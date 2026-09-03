const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendOtpEmail } = require("../config/mailer");

const router = express.Router();

// ==========================================
// RATE LIMITERS
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

// Separate, stricter limiter for OTP verification endpoints
// (prevents someone from brute-forcing a 6-digit code)
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 6,
    message: {
        success: false,
        message: "Too many verification attempts. Please try again in 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter just for resend requests, so someone can't spam themselves new codes
const resendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 4,
    message: {
        success: false,
        message: "Too many resend requests. Please wait a few minutes and try again."
    },
    standardHeaders: true,
    legacyHeaders: false
});


// ==========================================
// HELPER: GENERATE 6-DIGIT OTP
// ==========================================

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}


// ==========================================
// REGISTER USER  (sends signup OTP instead of a link)
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

            const otp = generateOtp();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

            const sql = `
                INSERT INTO users
                (full_name, email, password, is_verified, verification_token, token_expiry)
                VALUES (?, ?, ?, false, ?, ?)
            `;

            db.query(
                sql,
                [full_name, email, hashedPassword, otp, otpExpiry],
                (error, result) => {

                    if (error) {
                        console.error(error);
                        return res.status(500).json({
                            success: false,
                            message: "Unable to create account."
                        });
                    }

                    sendOtpEmail(email, otp, "signup", (mailError) => {
                        if (mailError) {
                            console.error("OTP email send failed:", mailError);
                        }
                    });

                    res.status(201).json({
                        success: true,
                        message: "Account created! We've emailed you a 6-digit code — enter it to verify your account.",
                        email: email
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
// RESEND SIGNUP OTP
// Issues a fresh 6-digit code for an account that
// exists but hasn't been verified yet.
// Body: { email }
// ==========================================

router.post("/resend-signup-otp", resendLimiter, (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], (error, results) => {

        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Database error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Account not found." });
        }

        const user = results[0];

        if (user.is_verified) {
            return res.status(400).json({ success: false, message: "Account is already verified. Please log in." });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const updateSql = `
            UPDATE users
            SET verification_token = ?, token_expiry = ?
            WHERE id = ?
        `;

        db.query(updateSql, [otp, otpExpiry, user.id], (updateError) => {

            if (updateError) {
                console.error(updateError);
                return res.status(500).json({ success: false, message: "Unable to resend code. Please try again." });
            }

            sendOtpEmail(email, otp, "signup", (mailError) => {
                if (mailError) {
                    console.error("Resend OTP email failed:", mailError);
                }
            });

            res.json({
                success: true,
                message: "A new code has been sent to your email."
            });

        });

    });

});


// ==========================================
// VERIFY SIGNUP OTP
// Body: { email, otp }
// ==========================================

router.post("/verify-signup-otp", otpLimiter, (req, res) => {

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and code are required." });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], (error, results) => {

        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Database error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Account not found." });
        }

        const user = results[0];

        if (user.is_verified) {
            return res.status(400).json({ success: false, message: "Account is already verified." });
        }

        if (!user.verification_token || user.verification_token !== otp) {
            return res.status(400).json({ success: false, message: "Incorrect code." });
        }

        if (new Date(user.token_expiry) < new Date()) {
            return res.status(400).json({ success: false, message: "This code has expired. Please register again." });
        }

        const updateSql = `
            UPDATE users
            SET is_verified = true, verification_token = NULL, token_expiry = NULL
            WHERE id = ?
        `;

        db.query(updateSql, [user.id], (error) => {

            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: "Verification failed. Please try again." });
            }

            res.json({ success: true, message: "Account verified! You can now log in." });

        });

    });

});


// ==========================================
// LOGIN — password only, issues JWT directly
// (OTP is no longer required on login, only at signup)
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
                    message: "Please verify your email before logging in."
                });
            }

            // Password correct and account verified — issue JWT directly
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