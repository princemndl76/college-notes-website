const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// Valid note_type values: 'content', 'unit', 'subject'


// ==========================================
// ADD BOOKMARK
// POST /api/bookmarks
// Body: { note_id, note_type, title, file_url }
// ==========================================
router.post("/", verifyToken, (req, res) => {

    const { note_id, note_type, title, file_url } = req.body;
    const user_id = req.user.id;

    if (!note_id || !note_type || !title) {
        return res.status(400).json({
            success: false,
            message: "note_id, note_type and title are required."
        });
    }

    if (!["content", "unit", "subject"].includes(note_type)) {
        return res.status(400).json({
            success: false,
            message: "note_type must be 'content', 'unit', or 'subject'."
        });
    }

    db.query(
        `INSERT INTO bookmarks (user_id, note_id, note_type, title, file_url)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, note_id, note_type, title, file_url || null],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Note is already bookmarked."
                    });
                }

                console.error("Add bookmark error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.status(201).json({
                success: true,
                message: "Note bookmarked successfully."
            });
        }
    );
});


// ==========================================
// REMOVE BOOKMARK
// DELETE /api/bookmarks/:noteId?type=unit
// ==========================================
router.delete("/:noteId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const note_id = req.params.noteId;
    const note_type = req.query.type || "content";

    db.query(
        `DELETE FROM bookmarks
         WHERE user_id = ? AND note_id = ? AND note_type = ?`,
        [user_id, note_id, note_type],
        (err, result) => {

            if (err) {
                console.error("Remove bookmark error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Bookmark not found."
                });
            }

            res.json({
                success: true,
                message: "Bookmark removed successfully."
            });
        }
    );
});


// ==========================================
// GET MY BOOKMARKS
// GET /api/bookmarks
// ==========================================
router.get("/", verifyToken, (req, res) => {

    const user_id = req.user.id;

    db.query(
        `SELECT id, note_id, note_type, title, file_url, created_at
         FROM bookmarks
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [user_id],
        (err, bookmarks) => {

            if (err) {
                console.error("Get bookmarks error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.json({
                success: true,
                bookmarks: bookmarks
            });
        }
    );
});


// ==========================================
// CHECK BOOKMARK
// GET /api/bookmarks/check/:noteId?type=unit
// ==========================================
router.get("/check/:noteId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const note_id = req.params.noteId;
    const note_type = req.query.type || "content";

    db.query(
        `SELECT id
         FROM bookmarks
         WHERE user_id = ? AND note_id = ? AND note_type = ?`,
        [user_id, note_id, note_type],
        (err, rows) => {

            if (err) {
                console.error("Check bookmark error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.json({
                success: true,
                bookmarked: rows.length > 0
            });
        }
    );
});


module.exports = router;