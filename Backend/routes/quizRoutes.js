const express = require("express");
const router = express.Router();

const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");


// ==========================================
// DASHBOARD WIDGET
// GET /api/quiz/widget
// Rotates category daily: ramayana -> mahabharata -> gk -> repeat
// ==========================================

router.get("/widget", verifyToken, (req, res) => {

    const rotation = ["ramayana", "mahabharata", "gk"];

    // Day-of-year determines which category shows today
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000);

    const category = rotation[dayOfYear % rotation.length];

    db.query(
        `SELECT id, category, question, option_a, option_b, option_c, option_d, correct_option
         FROM quiz_questions
         WHERE category = ?
         ORDER BY RAND()
         LIMIT 1`,
        [category],
        (err, rows) => {

            if (err) {
                console.error("Quiz widget error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (rows.length === 0) {
                return res.json({
                    success: true,
                    question: null,
                    message: "No questions available for today's category."
                });
            }

            res.json({
                success: true,
                question: rows[0]
            });
        }
    );

});


// ==========================================
// SUBJECT WIDGET
// GET /api/quiz/subject-widget/:subjectId
// Returns one random question tied to this subject
// ==========================================

router.get("/subject-widget/:subjectId", verifyToken, (req, res) => {

    const subjectId = req.params.subjectId;

    db.query(
        `SELECT id, category, subject_id, question, option_a, option_b, option_c, option_d, correct_option
         FROM quiz_questions
         WHERE category = 'subject'
         AND subject_id = ?
         ORDER BY RAND()
         LIMIT 1`,
        [subjectId],
        (err, rows) => {

            if (err) {
                console.error("Subject quiz widget error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Server error."
                });
            }

            if (rows.length === 0) {
                return res.json({
                    success: true,
                    question: null,
                    message: "No quiz questions available for this subject yet."
                });
            }

            res.json({
                success: true,
                question: rows[0]
            });
        }
    );

});


module.exports = router;