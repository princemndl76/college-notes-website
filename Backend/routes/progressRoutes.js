const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");


// ==========================================
// CHECK PROGRESS
// GET /api/progress/check/:contentId
// ==========================================

router.get("/check/:contentId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const content_id = req.params.contentId;

    db.query(
        `SELECT completed
         FROM study_progress
         WHERE user_id = ?
         AND content_id = ?`,
        [user_id, content_id],
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
// POST /api/progress/:contentId
// ==========================================

router.post("/:contentId", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const content_id = req.params.contentId;

    const completed = req.body.completed ? 1 : 0;

    // Check content exists
    db.query(
        "SELECT id FROM contents WHERE id = ?",
        [content_id],
        (err, rows) => {

            if (err) {
                console.error("Content check error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Content not found."
                });
            }

            const completedAt =
                completed === 1 ? new Date() : null;

            const sql = `
                INSERT INTO study_progress
                (
                    user_id,
                    content_id,
                    completed,
                    viewed_at,
                    completed_at
                )
                VALUES (?, ?, ?, NOW(), ?)

                ON DUPLICATE KEY UPDATE
                    completed = VALUES(completed),
                    viewed_at = NOW(),
                    completed_at = VALUES(completed_at)
            `;

            db.query(
                sql,
                [
                    user_id,
                    content_id,
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
                                ? "Topic marked as completed."
                                : "Topic marked as incomplete."
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


module.exports = router;