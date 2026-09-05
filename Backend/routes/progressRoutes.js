const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// Valid note_type values: 'content', 'unit', 'subject'


// ==========================================
// CHECK PROGRESS
// GET /api/progress/check/:noteId?type=unit
// ==========================================

router.get("/check/:noteId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const note_id = req.params.noteId;
    const note_type = req.query.type || "content";

    db.query(
        `SELECT completed
         FROM study_progress
         WHERE user_id = ?
         AND note_type = ?
         AND content_id = ?`,
        [user_id, note_type, note_id],
        (err, rows) => {

            if (err) {
                console.error("Check progress error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (rows.length === 0) {
                return res.json({
                    success: true,
                    completed: false
                });
            }

            res.json({
                success: true,
                completed: rows[0].completed === 1
            });
        }
    );
});


// ==========================================
// UPDATE PROGRESS
// POST /api/progress/:noteId
// Body: { completed, note_type }
// ==========================================

router.post("/:noteId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const note_id = req.params.noteId;

    const note_type = req.body.note_type || "content";
    const completed = req.body.completed ? 1 : 0;

    if (!["content", "unit", "subject"].includes(note_type)) {
        return res.status(400).json({
            success: false,
            message: "note_type must be 'content', 'unit', or 'subject'."
        });
    }

    // Table to verify the note actually exists, per type
    const tableMap = {
        content: "contents",
        unit: "short_notes",
        subject: "subject_notes"
    };

    const checkTable = tableMap[note_type];

    db.query(
        `SELECT id FROM ${checkTable} WHERE id = ?`,
        [note_id],
        (err, rows) => {

            if (err) {
                console.error("Note check error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Note not found."
                });
            }

            const completedAt =
                completed === 1 ? new Date() : null;

            const sql = `
                INSERT INTO study_progress
                (
                    user_id,
                    content_id,
                    note_type,
                    completed,
                    viewed_at,
                    completed_at
                )
                VALUES (?, ?, ?, ?, NOW(), ?)

                ON DUPLICATE KEY UPDATE
                    completed = VALUES(completed),
                    viewed_at = NOW(),
                    completed_at = VALUES(completed_at)
            `;

            db.query(
                sql,
                [
                    user_id,
                    note_id,
                    note_type,
                    completed,
                    completedAt
                ],
                (err) => {

                    if (err) {
                        console.error(
                            "Update progress error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Unable to update progress."
                        });
                    }

                    res.json({
                        success: true,
                        completed: completed === 1,
                        message:
                            completed === 1
                                ? "Marked as completed."
                                : "Marked as incomplete."
                    });
                }
            );
        }
    );
});


// ==========================================
// GET ALL MY PROGRESS
// GET /api/progress
// ==========================================

router.get("/", verifyToken, (req, res) => {

    const user_id = req.user.id;

    db.query(
        `SELECT
            content_id,
            note_type,
            completed,
            viewed_at,
            completed_at
         FROM study_progress
         WHERE user_id = ?
         ORDER BY viewed_at DESC`,
        [user_id],
        (err, rows) => {

            if (err) {
                console.error(
                    "Get progress error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            res.json({
                success: true,
                progress: rows
            });
        }
    );
});


// ==========================================
// GET OVERALL PROGRESS SUMMARY
// GET /api/progress/summary
// Counts across all three note types
// ==========================================

router.get("/summary", verifyToken, (req, res) => {

    const user_id = req.user.id;

    const totalSql = `
        SELECT
            (SELECT COUNT(*) FROM contents) +
            (SELECT COUNT(*) FROM short_notes) +
            (SELECT COUNT(*) FROM subject_notes)
            AS total
    `;

    db.query(totalSql, (err, totalRows) => {

        if (err) {
            console.error(
                "Progress summary total error:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Server error."
            });
        }

        db.query(
            `SELECT COUNT(*) AS completedCount
             FROM study_progress
             WHERE user_id = ?
             AND completed = 1`,
            [user_id],
            (err, completedRows) => {

                if (err) {
                    console.error(
                        "Progress summary completed error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Server error."
                    });
                }

                const total = totalRows[0].total || 0;
                const completed = completedRows[0].completedCount || 0;

                const percentage =
                    total > 0
                        ? Math.round((completed / total) * 100)
                        : 0;

                res.json({
                    success: true,
                    total: total,
                    completed: completed,
                    percentage: percentage
                });
            }
        );
    });
});


module.exports = router;