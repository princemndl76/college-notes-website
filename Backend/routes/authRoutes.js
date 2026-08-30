const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// ==========================================
// RATE LIMITER (login only)
// ==========================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8, // 8 attempts per IP per window
    message: {
        success: false,
        message: "Too many login attempts. Please try again in 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ==========================================
// REGISTER USER
// ==========================================

router.post("/register", async (req, res) => {

    try {

        const {
            full_name,
            email,
            password
        } = req.body;


        // Check required fields

        if (!full_name || !email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all required fields."

            });

        }


        // Check password length

        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters."

            });

        }


        // Check whether email already exists

        const checkEmail =
            "SELECT id FROM users WHERE email = ?";


        db.query(
            checkEmail,
            [email],
            async (error, results) => {

                if (error) {

                    console.error(error);

                    return res.status(500).json({

                        success: false,

                        message:
                            "Database error."

                    });

                }


                // Email already exists

                if (results.length > 0) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "Email already registered."

                    });

                }


                // Hash password

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );


                // Insert user
                // NOTE: role is not set here on purpose —
                // it defaults to 'user' at the database level
                // (see ALTER TABLE users ... DEFAULT 'user').
                // Admins are promoted manually via SQL, never
                // through this public registration endpoint.

                const sql = `
                    INSERT INTO users
                    (full_name, email, password)
                    VALUES (?, ?, ?)
                `;


                db.query(
                    sql,
                    [
                        full_name,
                        email,
                        hashedPassword
                    ],
                    (error, result) => {

                        if (error) {

                            console.error(error);

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Unable to create account."

                            });

                        }


                        res.status(201).json({

                            success: true,

                            message:
                                "Account created successfully!",

                            userId:
                                result.insertId

                        });

                    }
                );

            }
        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Server error."

        });

    }

});


// ==========================================
// LOGIN USER
// ==========================================

router.post("/login", loginLimiter, async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // Check fields

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter email and password."

            });

        }


        // Find user by email

        const sql =
            "SELECT * FROM users WHERE email = ?";


        db.query(
            sql,
            [email],
            async (error, results) => {

                if (error) {

                    console.error(error);

                    return res.status(500).json({

                        success: false,

                        message:
                            "Database error."

                    });

                }


                // User doesn't exist

                if (results.length === 0) {

                    return res.status(401).json({

                        success: false,

                        message:
                            "Invalid email or password."

                    });

                }


                const user = results[0];


                // Compare entered password
                // with hashed password

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                // Password incorrect

                if (!passwordMatch) {

                    return res.status(401).json({

                        success: false,

                        message:
                            "Invalid email or password."

                    });

                }


                // Login successful — create a JWT so the
                // frontend can prove who's logged in later

                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                res.json({

                    success: true,

                    message:
                        "Login successful!",

                    token: token,

                    user: {

                        id: user.id,

                        full_name:
                            user.full_name,

                        email:
                            user.email,

                        role:
                            user.role

                    }

                });
            }
        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Server error."

        });

    }

});


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;