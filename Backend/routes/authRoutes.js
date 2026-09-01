const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendVerificationEmail } = require("../config/mailer");

const router = express.Router();

// ==========================================
// RATE LIMITER (login only)
// ==========================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
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

        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        const checkEmail = "SELECT id FROM users WHERE email = ?";

        db.query(checkEmail, [email], async (error, results) => {

            if (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered."
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const verificationToken = crypto.randomBytes(32).toString("hex");
            const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

            const sql = `
                INSERT INTO users
                (full_name, email, password, is_verified, verification_token, token_expiry)
                VALUES (?, ?, ?, false, ?, ?)
            `;

            db.query(
                sql,
                [full_name, email, hashedPassword, verificationToken, tokenExpiry],
                (error, result) => {

                    if (error) {
                        console.error(error);
                        return res.status(500).json({
                            success: false,
                            message: "Unable to create account."
                        });
                    }

                    sendVerificationEmail(email, verificationToken, (mailError) => {
                        if (mailError) {
                            console.error("Email send failed:", mailError);
                        }
                    });

                    res.status(201).json({
                        success: true,
                        message: "Account created! Please check your email to verify your account before logging in.",
                        userId: result.insertId
                    });
                }
            );
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }

});

// ==========================================
// VERIFY EMAIL
// ==========================================

router.get("/verify-email", (req, res) => {

    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Invalid verification link.");
    }

    const sql = "SELECT * FROM users WHERE verification_token = ?";

    db.query(sql, [token], (error, results) => {

        if (error) {
            console.error(error);
            return res.status(500).send("Something went wrong during verification.");
        }

        if (results.length === 0) {
            return res.status(400).send("Invalid or expired verification link.");
        }

        const user = results[0];

        if (new Date(user.token_expiry) < new Date()) {
            return res.status(400).send("This verification link has expired. Please register again.");
        }

        const updateSql = `
            UPDATE users
            SET is_verified = true, verification_token = NULL, token_expiry = NULL
            WHERE id = ?
        `;

        db.query(updateSql, [user.id], (error) => {

            if (error) {
                console.error(error);
                return res.status(500).send("Verification failed. Please try again.");
            }

            res.redirect("/Frontend/pages/login.html?verified=true");
        });
    });

});

// ==========================================
// LOGIN USER
// ==========================================

router.post("/login", loginLimiter, async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        const sql = "SELECT * FROM users WHERE email = ?";

        db.query(sql, [email], async (error, results) => {

            if (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            const user = results[0];

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            if (!user.is_verified) {
                return res.status(403).json({
                    success: false,
                    message: "Please verify your email before logging in. Check your inbox."
                });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                success: true,
                message: "Login successful!",
                token: token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }

});

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;