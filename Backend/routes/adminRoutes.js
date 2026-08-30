const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

// Every route below requires a valid signed token AND an admin role
// (verified server-side from the token, not from any client header)
router.use(verifyToken, requireAdmin);


// ==================================================
// GET SHORT NOTES FOR A UNIT (admin list view)
// GET /api/admin/short-notes?unit_id=6
// ==================================================

router.get("/short-notes", (req, res) => {

    const { unit_id } = req.query;

    if (!unit_id) {
        return res.status(400).json({ success: false, message: "unit_id is required" });
    }

    // Look up subject_id + unit_number for this unit, same as the create flow
    const unitSql = `
        SELECT subject_id, unit_number
        FROM units
        WHERE id = ?
    `;

    db.query(unitSql, [unit_id], (unitError, unitResults) => {

        if (unitError) {
            console.error("Admin Unit Lookup Error:", unitError);
            return res.status(500).json({ success: false, message: "Unable to load unit" });
        }

        if (unitResults.length === 0) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        const { subject_id, unit_number } = unitResults[0];

        const notesSql = `
            SELECT id, title, body, file_url
            FROM short_notes
            WHERE subject_id = ? AND unit_number = ?
            ORDER BY id DESC
        `;

        db.query(notesSql, [subject_id, unit_number], (error, results) => {

            if (error) {
                console.error("Admin List Short Notes Error:", error);
                return res.status(500).json({ success: false, message: "Unable to load short notes" });
            }

            res.json({ success: true, short_notes: results });

        });

    });

});


// ==================================================
// CREATE SHORT NOTE (admin)
// POST /api/admin/short-notes
// Body: { unit_id, title, body, file_url }
// ==================================================

router.post("/short-notes", (req, res) => {

    const { unit_id, title, body, file_url } = req.body;

    if (!unit_id || !title) {
        return res.status(400).json({ success: false, message: "unit_id and title are required" });
    }

    const lookupSql = `
        SELECT u.subject_id, u.unit_number, u.unit_name, s.semester_id
        FROM units u
        JOIN subjects s ON u.subject_id = s.id
        WHERE u.id = ?
    `;

    db.query(lookupSql, [unit_id], (lookupError, lookupResults) => {

        if (lookupError) {
            console.error("Admin Create - Lookup Error:", lookupError);
            return res.status(500).json({
                success: false,
                message: "Unable to look up unit details",
                debug: { code: lookupError.code, sqlMessage: lookupError.sqlMessage }
            });
        }

        if (lookupResults.length === 0) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        const { subject_id, unit_number, unit_name, semester_id } = lookupResults[0];

        const insertSql = `
            INSERT INTO short_notes
            (semester_id, subject_id, unit_number, unit_title, title, body, file_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [semester_id, subject_id, unit_number, unit_name, title, body || "", file_url || null];

        db.query(insertSql, values, (error, result) => {

            if (error) {
                console.error("Admin Create Short Note Error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Unable to create short note",
                    debug: { code: error.code, sqlMessage: error.sqlMessage }
                });
            }

            res.status(201).json({ success: true, id: result.insertId });

        });

    });

});


// ==================================================
// UPDATE SHORT NOTE (admin)
// PUT /api/admin/short-notes/:id
// Body: { title, body, file_url }
// ==================================================

router.put("/short-notes/:id", (req, res) => {

    const { id } = req.params;
    const { title, body, file_url } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, message: "title is required" });
    }

    const sql = `
        UPDATE short_notes
        SET title = ?, body = ?, file_url = ?
        WHERE id = ?
    `;

    db.query(sql, [title, body || "", file_url || null, id], (error, result) => {

        if (error) {
            console.error("Admin Update Short Note Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to update note",
                debug: { code: error.code, sqlMessage: error.sqlMessage }
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        res.json({ success: true, message: "Note updated" });

    });

});


// ==================================================
// DELETE SHORT NOTE (admin)
// DELETE /api/admin/short-notes/:id
// ==================================================

router.delete("/short-notes/:id", (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM short_notes WHERE id = ?";

    db.query(sql, [id], (error, result) => {

        if (error) {
            console.error("Admin Delete Short Note Error:", error);
            return res.status(500).json({ success: false, message: "Unable to delete note" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        res.json({ success: true, message: "Note deleted" });

    });

});


// ==================================================
// FILE UPLOAD (admin) - reuses same upload middleware
// POST /api/admin/notes/upload
//
// FIX: file_url now includes the "notes" subfolder to
// match where upload.js middleware actually saves files
// (Backend/uploads/notes/...). Previously this was
// missing "notes", causing 404s when opening files.
// ==================================================

router.post("/notes/upload", upload.single("file"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file received" });
    }

    res.json({ success: true, file_url: `/uploads/notes/${req.file.filename}` });


});


module.exports = router;