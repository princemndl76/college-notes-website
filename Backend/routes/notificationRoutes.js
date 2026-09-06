const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");


// ==================================================
// GET NEW NOTES SINCE LAST SEEN
// GET /api/notifications
// ==================================================

router.get("/", verifyToken, (req, res) => {

    const userId = req.user.id;

    db.query(
        "SELECT last_seen_notifications FROM users WHERE id = ?",
        [userId],
        (error, userRows) => {

            if (error) {
                console.error("Notifications - user lookup error:", error);
                return res.status(500).json({ success: false, message: "Unable to load notifications" });
            }

            if (userRows.length === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const lastSeen = userRows[0].last_seen_notifications;

            const sql = `
                SELECT id, title, created_at, 'content' AS note_type FROM notes WHERE created_at > ?
                UNION ALL
                SELECT id, title, created_at, 'unit' AS note_type FROM short_notes WHERE created_at > ?
                UNION ALL
                SELECT id, title, created_at, 'subject' AS note_type FROM subject_notes WHERE created_at > ?
                ORDER BY created_at DESC
                LIMIT 20
            `;

            db.query(sql, [lastSeen, lastSeen, lastSeen], (error2, results) => {

                if (error2) {
                    console.error("Notifications - fetch error:", error2);
                    return res.status(500).json({ success: false, message: "Unable to load notifications" });
                }

                res.json({
                    success: true,
                    count: results.length,
                    notifications: results
                });

            });

        }
    );

});


// ==================================================
// MARK NOTIFICATIONS AS SEEN
// POST /api/notifications/mark-seen
// ==================================================

router.post("/mark-seen", verifyToken, (req, res) => {

    const userId = req.user.id;

    db.query(
        "UPDATE users SET last_seen_notifications = NOW() WHERE id = ?",
        [userId],
        (error) => {

            if (error) {
                console.error("Mark seen error:", error);
                return res.status(500).json({ success: false, message: "Unable to update" });
            }

            res.json({ success: true });

        }
    );

});


module.exports = router;