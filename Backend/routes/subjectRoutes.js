const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/upload");


// ==================================================
// GET ALL SUBJECTS
// GET /api/subjects
// ==================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            id,
            subject_name,
            subject_code,
            description
        FROM subjects
        ORDER BY id
    `;

    db.query(sql, (error, results) => {

        if (error) {

            console.error("Get All Subjects Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load subjects"
            });
        }

        res.json({
            success: true,
            subjects: results
        });

    });

});


// ==================================================
// GET SUBJECTS OF A SEMESTER
// GET /api/subjects/semester/:semesterId
// ==================================================

router.get("/semester/:semesterId", (req, res) => {

    const semesterId = req.params.semesterId;

    const sql = `
        SELECT
            id,
            subject_name,
            subject_code,
            description
        FROM subjects
        WHERE semester_id = ?
        ORDER BY id
    `;

    db.query(sql, [semesterId], (error, results) => {

        if (error) {

            console.error("Subjects By Semester Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load subjects"
            });
        }

        res.json({
            success: true,
            subjects: results
        });

    });

});


// ==================================================
// GET UNITS OF A SUBJECT
// GET /api/subjects/:subjectId/units
// ==================================================

router.get("/:subjectId/units", (req, res) => {

    const subjectId = req.params.subjectId;

    const subjectSql = `
        SELECT id, subject_name, subject_code, description
        FROM subjects
        WHERE id = ?
    `;

    db.query(subjectSql, [subjectId], (subjectError, subjectResults) => {

        if (subjectError) {

            console.error("Get Subject Error:", subjectError);

            return res.status(500).json({
                success: false,
                message: "Unable to load subject"
            });
        }

        if (subjectResults.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        const unitsSql = `
            SELECT
                id,
                unit_number,
                unit_name,
                description
            FROM units
            WHERE subject_id = ?
            ORDER BY unit_number
        `;

        db.query(unitsSql, [subjectId], (error, results) => {

            if (error) {

                console.error("Units By Subject Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load units"
                });
            }

            res.json({
                success: true,
                subject: subjectResults[0],
                units: results
            });

        });

    });

});


// ==================================================
// GET CONTENTS (TOPICS) OF A UNIT
// GET /api/subjects/unit/:unitId/contents
// ==================================================

router.get("/unit/:unitId/contents", (req, res) => {

    const unitId = req.params.unitId;

    const unitSql = `
        SELECT id, unit_number, unit_name, description
        FROM units
        WHERE id = ?
    `;

    db.query(unitSql, [unitId], (unitError, unitResults) => {

        if (unitError) {

            console.error("Get Unit Error:", unitError);

            return res.status(500).json({
                success: false,
                message: "Unable to load unit"
            });
        }

        if (unitResults.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Unit not found"
            });
        }

        const contentsSql = `
            SELECT
                id,
                content_number,
                content_name
            FROM contents
            WHERE unit_id = ?
            ORDER BY content_number
        `;

        db.query(contentsSql, [unitId], (error, results) => {

            if (error) {

                console.error("Contents By Unit Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load topics"
                });
            }

            res.json({
                success: true,
                unit: unitResults[0],
                contents: results
            });

        });

    });

});


// ==================================================
// UPLOAD A FILE FOR A NOTE
// POST /api/subjects/notes/upload
// Expects multipart/form-data with field name "file"
// ==================================================

router.post("/notes/upload", upload.single("file"), (req, res) => {

    if (!req.file) {

        return res.status(400).json({
            success: false,
            message: "No file received"
        });
    }

    const fileUrl = `/uploads/notes/${req.file.filename}`;

    res.json({
        success: true,
        file_url: fileUrl
    });

});


// ==================================================
// CREATE A NOTE
// POST /api/subjects/notes
// Body: { content_id, title, body, file_url }
// ==================================================

router.post("/notes", (req, res) => {

    const { content_id, title, body, file_url } = req.body;

    if (!content_id || !title) {

        return res.status(400).json({
            success: false,
            message: "content_id and title are required"
        });
    }

    const sql = `
        INSERT INTO notes (content_id, title, body, file_url)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [content_id, title, body || null, file_url || null], (error, results) => {

        if (error) {

            console.error("Create Note Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to save note"
            });
        }

        res.json({
            success: true,
            note_id: results.insertId
        });

    });

});


// ==================================================
// GET ALL SEMESTERS
// GET /api/subjects/semesters
// Used by the student browsing page to populate the
// semester picker before drilling into subjects.
// ==================================================

router.get("/semesters", (req, res) => {

    const sql = `
        SELECT
            id,
            semester_number,
            semester_name
        FROM semesters
        ORDER BY semester_number
    `;

    db.query(sql, (error, results) => {

        if (error) {

            console.error("Get Semesters Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load semesters"
            });
        }

        res.json({
            success: true,
            semesters: results
        });

    });

});


// ==================================================
// GET NOTES FOR A TOPIC (CONTENT)
// GET /api/subjects/content/:contentId/notes
// Used by the student browsing page to show uploaded
// notes once a student drills down to a specific topic.
// ==================================================

router.get("/content/:contentId/notes", (req, res) => {

    const contentId = req.params.contentId;

    const contentSql = `
        SELECT id, content_number, content_name
        FROM contents
        WHERE id = ?
    `;

    db.query(contentSql, [contentId], (contentError, contentResults) => {

        if (contentError) {

            console.error("Get Content Error:", contentError);

            return res.status(500).json({
                success: false,
                message: "Unable to load topic"
            });
        }

        if (contentResults.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Topic not found"
            });
        }

        const notesSql = `
            SELECT
                id,
                title,
                body,
                file_url,
                created_at
            FROM notes
            WHERE content_id = ?
            ORDER BY created_at DESC
        `;

        db.query(notesSql, [contentId], (error, results) => {

            if (error) {

                console.error("Notes By Content Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load notes"
                });
            }

            res.json({
                success: true,
                content: contentResults[0],
                notes: results
            });

        });

    });

});

// ==================================================
// GET SHORT NOTES OF A UNIT
// GET /api/subjects/unit/:unitId/short-notes
// ==================================================

router.get("/unit/:unitId/short-notes", (req, res) => {

    const { unitId } = req.params;

    const unitSql = `
        SELECT subject_id, unit_number
        FROM units
        WHERE id = ?
    `;

    db.query(unitSql, [unitId], (unitError, unitResults) => {

        if (unitError) {
            console.error("Unit Lookup Error:", unitError);
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
            ORDER BY id
        `;

        db.query(notesSql, [subject_id, unit_number], (error, results) => {

            if (error) {
                console.error("Short Notes Error:", error);
                return res.status(500).json({ success: false, message: "Unable to load short notes" });
            }

            res.json({ success: true, short_notes: results });

        });

    });

});


// ==================================================
// CREATE SHORT NOTE
// POST /api/subjects/short-notes
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
            console.error("Unit/Subject Lookup Error:", lookupError);
            return res.status(500).json({
                success: false,
                message: "Unable to look up unit details",
                debug: {
                    code: lookupError.code,
                    sqlMessage: lookupError.sqlMessage,
                    sql: lookupError.sql
                }
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
                console.error("Create Short Note Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to create short note",
                    debug: {
                        code: error.code,
                        sqlMessage: error.sqlMessage,
                        sql: error.sql
                    }
                });
            }

            res.status(201).json({ success: true, message: "Short note created", id: result.insertId });

        });

    });

});


// ==================================================
// GET SUBJECT-LEVEL NOTES (NEW)
// GET /api/subjects/:subjectId/subject-notes
// For notes uploaded directly to a subject, not tied
// to any specific unit.
// ==================================================

router.get("/:subjectId/subject-notes", (req, res) => {

    const subjectId = req.params.subjectId;

    const sql = `
        SELECT id, title, body, file_url, created_at
        FROM subject_notes
        WHERE subject_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [subjectId], (error, results) => {

        if (error) {
            console.error("Get Subject Notes Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to load subject notes"
            });
        }

        res.json({
            success: true,
            subject_notes: results
        });

    });

});


// ==================================================
// CREATE SUBJECT-LEVEL NOTE (NEW)
// POST /api/subjects/subject-notes
// Body: { subject_id, title, body, file_url }
// ==================================================

router.post("/subject-notes", (req, res) => {

    const { subject_id, title, body, file_url } = req.body;

    if (!subject_id || !title) {
        return res.status(400).json({
            success: false,
            message: "subject_id and title are required"
        });
    }

    const sql = `
        INSERT INTO subject_notes (subject_id, title, body, file_url)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [subject_id, title, body || "", file_url || null], (error, result) => {

        if (error) {
            console.error("Create Subject Note Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to save subject note",
                debug: { code: error.code, sqlMessage: error.sqlMessage }
            });
        }

        res.status(201).json({
            success: true,
            message: "Subject note created",
            id: result.insertId
        });

    });

});


// ==================================================
// DELETE SUBJECT-LEVEL NOTE (NEW)
// DELETE /api/subjects/subject-notes/:id
// ==================================================

router.delete("/subject-notes/:id", (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM subject_notes WHERE id = ?";

    db.query(sql, [id], (error, result) => {

        if (error) {
            console.error("Delete Subject Note Error:", error);
            return res.status(500).json({ success: false, message: "Unable to delete note" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        res.json({ success: true, message: "Note deleted" });

    });

});


module.exports = router;