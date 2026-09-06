const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");


// ==================================================
// LOG A STUDY SESSION
// POST /api/study/log
// Body: { duration_seconds }
// ==================================================

router.post("/log", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { duration_seconds } = req.body;

    if (!duration_seconds || duration_seconds <= 0) {
        return res.status(400).json({ success: false, message: "duration_seconds is required" });
    }

    const sql = `
        INSERT INTO study_sessions (user_id, duration_seconds, session_date)
        VALUES (?, ?, CURDATE())
    `;

    db.query(sql, [userId, duration_seconds], (error, result) => {

        if (error) {
            console.error("Log Study Session Error:", error);
            return res.status(500).json({ success: false, message: "Unable to log session" });
        }

        res.json({ success: true, session_id: result.insertId });

    });

});


// ==================================================
// GET TODAY'S TOTAL STUDY TIME
// GET /api/study/today
// ==================================================

router.get("/today", verifyToken, (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds
        FROM study_sessions
        WHERE user_id = ? AND session_date = CURDATE()
    `;

    db.query(sql, [userId], (error, results) => {

        if (error) {
            console.error("Today Study Time Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load study time" });
        }

        res.json({ success: true, total_seconds: results[0].total_seconds });

    });

});


// ==================================================
// GET WEEKLY STUDY STATS (last 7 days)
// GET /api/study/weekly
// ==================================================

router.get("/weekly", verifyToken, (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT session_date, SUM(duration_seconds) AS total_seconds
        FROM study_sessions
        WHERE user_id = ? AND session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY session_date
        ORDER BY session_date ASC
    `;

    db.query(sql, [userId], (error, results) => {

        if (error) {
            console.error("Weekly Study Stats Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load weekly stats" });
        }

        res.json({ success: true, weekly: results });

    });

});


// ==================================================
// STUDY LEADERBOARD (top study time this week)
// GET /api/study/leaderboard
// ==================================================

router.get("/leaderboard", verifyToken, (req, res) => {

    const sql = `
        SELECT u.id, u.full_name, SUM(s.duration_seconds) AS total_seconds
        FROM users u
        JOIN study_sessions s ON s.user_id = u.id
        WHERE s.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY u.id
        ORDER BY total_seconds DESC
        LIMIT 20
    `;

    db.query(sql, (error, results) => {

        if (error) {
            console.error("Study Leaderboard Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load leaderboard" });
        }

        res.json({ success: true, leaderboard: results });

    });

});


module.exports = router;