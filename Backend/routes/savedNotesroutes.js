const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");


// ==================================================
// ==================================================
// BOOKMARKS  ("read later")
// ==================================================
// ==================================================


// ADD A BOOKMARK
// POST /api/bookmarks
// Body: { note_type, note_ref_id, title, file_url, subject_id, subject_name }

router.post("/bookmarks", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { note_type, note_ref_id, title, file_url, subject_id, subject_name } = req.body;

    if (!note_type || !note_ref_id || !title) {
        return res.status(400).json({
            success: false,
            message: "note_type, note_ref_id and title are required"
        });
    }

    const sql = `
        INSERT INTO bookmarks
        (user_id, note_type, note_ref_id, title, file_url, subject_id, subject_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [userId, note_type, note_ref_id, title, file_url || null, subject_id || null, subject_name || null],
        (error, result) => {

            if (error) {

                if (error.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Already bookmarked"
                    });
                }

                console.error("Add Bookmark Error:", error);
                return res.status(500).json({ success: false, message: "Unable to add bookmark" });
            }

            res.status(201).json({ success: true, message: "Bookmarked", id: result.insertId });

        }
    );

});


// GET MY BOOKMARKS
// GET /api/bookmarks

router.get("/bookmarks", verifyToken, (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT id, note_type, note_ref_id, title, file_url, subject_id, subject_name, created_at
        FROM bookmarks
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (error, results) => {

        if (error) {
            console.error("Get Bookmarks Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load bookmarks" });
        }

        res.json({ success: true, bookmarks: results });

    });

});


// REMOVE A BOOKMARK
// DELETE /api/bookmarks/:id

router.delete("/bookmarks/:id", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { id } = req.params;

    const sql = "DELETE FROM bookmarks WHERE id = ? AND user_id = ?";

    db.query(sql, [id, userId], (error, result) => {

        if (error) {
            console.error("Delete Bookmark Error:", error);
            return res.status(500).json({ success: false, message: "Unable to remove bookmark" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Bookmark not found" });
        }

        res.json({ success: true, message: "Bookmark removed" });

    });

});


// ==================================================
// ==================================================
// FAVORITES  ("best notes")
// ==================================================
// ==================================================


// ADD A FAVORITE
// POST /api/favorites
// Body: { note_type, note_ref_id, title, file_url, subject_id, subject_name }

router.post("/favorites", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { note_type, note_ref_id, title, file_url, subject_id, subject_name } = req.body;

    if (!note_type || !note_ref_id || !title) {
        return res.status(400).json({
            success: false,
            message: "note_type, note_ref_id and title are required"
        });
    }

    const sql = `
        INSERT INTO favorites
        (user_id, note_type, note_ref_id, title, file_url, subject_id, subject_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [userId, note_type, note_ref_id, title, file_url || null, subject_id || null, subject_name || null],
        (error, result) => {

            if (error) {

                if (error.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Already in favorites"
                    });
                }

                console.error("Add Favorite Error:", error);
                return res.status(500).json({ success: false, message: "Unable to add favorite" });
            }

            res.status(201).json({ success: true, message: "Added to favorites", id: result.insertId });

        }
    );

});


// GET MY FAVORITES
// GET /api/favorites

router.get("/favorites", verifyToken, (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT id, note_type, note_ref_id, title, file_url, subject_id, subject_name, created_at
        FROM favorites
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (error, results) => {

        if (error) {
            console.error("Get Favorites Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load favorites" });
        }

        res.json({ success: true, favorites: results });

    });

});


// REMOVE A FAVORITE
// DELETE /api/favorites/:id

router.delete("/favorites/:id", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { id } = req.params;

    const sql = "DELETE FROM favorites WHERE id = ? AND user_id = ?";

    db.query(sql, [id, userId], (error, result) => {

        if (error) {
            console.error("Delete Favorite Error:", error);
            return res.status(500).json({ success: false, message: "Unable to remove favorite" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Favorite not found" });
        }

        res.json({ success: true, message: "Favorite removed" });

    });

});


module.exports = router;