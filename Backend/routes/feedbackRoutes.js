const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");


// ==========================================
// SUBMIT FEEDBACK
// POST /api/feedback
// Body: { categories: ["Bug", "UI/UX"], rating: 4, message: "..." }
// ==========================================
router.post("/", verifyToken, (req, res) => {

    const { categories, rating, message } = req.body;
    const user_id = req.user.id;

    if (!message || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: "Feedback message is required."
        });
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Select at least one category."
        });
    }

    const validRating =
        rating && Number(rating) >= 1 && Number(rating) <= 5
            ? Number(rating)
            : null;

    const categoriesString = categories.join(",");

    db.query(
        `INSERT INTO feedback (user_id, categories, rating, message)
         VALUES (?, ?, ?, ?)`,
        [user_id, categoriesString, validRating, message.trim()],
        (err, result) => {

            if (err) {
                console.error("Submit feedback error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.status(201).json({
                success: true,
                message: "Feedback submitted successfully."
            });
        }
    );
});


// ==========================================
// GET MY FEEDBACK HISTORY
// GET /api/feedback/mine
// ==========================================
router.get("/mine", verifyToken, (req, res) => {

    const user_id = req.user.id;

    db.query(
        `SELECT id, categories, rating, message, status, created_at
         FROM feedback
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [user_id],
        (err, rows) => {

            if (err) {
                console.error("Get my feedback error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.json({
                success: true,
                feedback: rows
            });
        }
    );
});


// ==========================================
// ADMIN: GET ALL FEEDBACK
// GET /api/feedback
// ==========================================
router.get("/", verifyToken, (req, res) => {

    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            message: "Admin access required."
        });
    }

    db.query(
        `SELECT f.id, f.user_id, u.name AS user_name, f.categories,
                f.rating, f.message, f.status, f.created_at
         FROM feedback f
         LEFT JOIN users u ON u.id = f.user_id
         ORDER BY f.created_at DESC`,
        (err, rows) => {

            if (err) {
                console.error("Get all feedback error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.json({
                success: true,
                feedback: rows
            });
        }
    );
});


// ==========================================
// ADMIN: UPDATE FEEDBACK STATUS
// PATCH /api/feedback/:id
// Body: { status: "reviewed" }
// ==========================================
router.patch("/:id", verifyToken, (req, res) => {

    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            message: "Admin access required."
        });
    }

    const { status } = req.body;
    const feedbackId = req.params.id;

    if (!["new", "reviewed", "resolved"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "status must be 'new', 'reviewed', or 'resolved'."
        });
    }

    db.query(
        `UPDATE feedback SET status = ? WHERE id = ?`,
        [status, feedbackId],
        (err, result) => {

            if (err) {
                console.error("Update feedback status error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback not found."
                });
            }

            res.json({
                success: true,
                message: "Feedback status updated."
            });
        }
    );
});


module.exports = router;