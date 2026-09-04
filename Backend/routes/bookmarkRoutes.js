const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// ==========================================
// ADD BOOKMARK
// ==========================================
router.post("/", verifyToken, async (req, res) => {
    try {
        const { note_id } = req.body;
        const user_id = req.user.id;

        if (!note_id) {
            return res.status(400).json({
                success: false,
                message: "note_id is required."
            });
        }

        // Check whether note exists
        const [notes] = await db.query(
            "SELECT id FROM notes WHERE id = ?",
            [note_id]
        );

        if (notes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Note not found."
            });
        }

        // Add bookmark
        await db.query(
            `INSERT INTO bookmarks (user_id, note_id)
             VALUES (?, ?)`,
            [user_id, note_id]
        );

        res.status(201).json({
            success: true,
            message: "Note bookmarked successfully."
        });

    } catch (err) {

        // Duplicate bookmark
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Note is already bookmarked."
            });
        }

        console.error("Add bookmark error:", err);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});


// ==========================================
// REMOVE BOOKMARK
// ==========================================
router.delete("/:noteId", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const note_id = req.params.noteId;

        const [result] = await db.query(
            `DELETE FROM bookmarks
             WHERE user_id = ? AND note_id = ?`,
            [user_id, note_id]
        );

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

    } catch (err) {

        console.error("Remove bookmark error:", err);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});


// ==========================================
// GET MY BOOKMARKS
// ==========================================
router.get("/", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.id;

        const [bookmarks] = await db.query(
            `SELECT
                b.id AS bookmark_id,
                b.note_id,
                b.created_at,
                n.title,
                n.body,
                n.file_url,
                n.created_at AS note_created_at
             FROM bookmarks b
             INNER JOIN notes n ON b.note_id = n.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`,
            [user_id]
        );

        res.json({
            success: true,
            bookmarks
        });

    } catch (err) {

        console.error("Get bookmarks error:", err);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});


// ==========================================
// CHECK IF A NOTE IS BOOKMARKED
// ==========================================
router.get("/check/:noteId", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const note_id = req.params.noteId;

        const [rows] = await db.query(
            `SELECT id
             FROM bookmarks
             WHERE user_id = ? AND note_id = ?`,
            [user_id, note_id]
        );

        res.json({
            success: true,
            bookmarked: rows.length > 0
        });

    } catch (err) {

        console.error("Check bookmark error:", err);

        res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});


module.exports = router;