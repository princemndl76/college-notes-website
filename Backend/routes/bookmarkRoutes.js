const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// ==========================================
// ADD BOOKMARK
// POST /api/bookmarks
// ==========================================
router.post("/", verifyToken, (req, res) => {

    const { note_id } = req.body;
    const user_id = req.user.id;

    if (!note_id) {
        return res.status(400).json({
            success: false,
            message: "note_id is required."
        });
    }

    // Check if note exists
    db.query(
        "SELECT id FROM notes WHERE id = ?",
        [note_id],
        (err, notes) => {

            if (err) {
                console.error("Check note error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (notes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Note not found."
                });
            }

            // Insert bookmark
            db.query(
                `INSERT INTO bookmarks (user_id, note_id)
                 VALUES (?, ?)`,
                [user_id, note_id],
                (err, result) => {

                    if (err) {

                        // Already bookmarked
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
        }
    );
});


// ==========================================
// REMOVE BOOKMARK
// DELETE /api/bookmarks/:noteId
// ==========================================
router.delete("/:noteId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const note_id = req.params.noteId;

    db.query(
        `DELETE FROM bookmarks
         WHERE user_id = ? AND note_id = ?`,
        [user_id, note_id],
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
        `SELECT
            b.id AS bookmark_id,
            b.note_id,
            b.created_at,
            n.title,
            n.body,
            n.file_url,
            n.created_at AS note_created_at
         FROM bookmarks b
         INNER JOIN notes n
            ON b.note_id = n.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`,
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
// GET /api/bookmarks/check/:noteId
// ==========================================
router.get("/check/:noteId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const note_id = req.params.noteId;

    db.query(
        `SELECT id
         FROM bookmarks
         WHERE user_id = ? AND note_id = ?`,
        [user_id, note_id],
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