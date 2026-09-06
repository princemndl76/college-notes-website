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


// ==========================================
// DAILY QUIZ (10-question mode)
// ==========================================

// Helper: get today's date as YYYY-MM-DD
function todayDateString() {
    const now = new Date();
    return now.toISOString().split("T")[0];
}

// ==========================================
// GET OR CREATE TODAY'S DAILY QUIZ
// GET /api/quiz/daily?semester=all|1|2|3...
// ==========================================

router.get("/daily", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const semester = req.query.semester || "all";
    const quizDate = todayDateString();

    // Check if an attempt already exists for today
    db.query(
        `SELECT * FROM quiz_attempts
         WHERE user_id = ? AND category = 'subject'
         AND semester_filter = ? AND quiz_date = ?`,
        [user_id, semester, quizDate],
        (err, existingAttempts) => {

            if (err) {
                console.error("Daily quiz check error:", err);
                return res.status(500).json({ success: false, message: "Server error." });
            }

            if (existingAttempts.length > 0) {
                // Attempt already exists - return its questions
                return returnAttemptQuestions(existingAttempts[0], res);
            }

            // No attempt yet today - build the subject_id filter
            const subjectFilterSql =
                semester === "all"
                    ? "SELECT id FROM subjects"
                    : "SELECT id FROM subjects WHERE semester_id = ?";

            const subjectFilterParams = semester === "all" ? [] : [semester];

            db.query(
                `SELECT id FROM quiz_questions
                 WHERE category = 'subject'
                 AND subject_id IN (${subjectFilterSql})
                 ORDER BY RAND()
                 LIMIT 10`,
                subjectFilterParams,
                (err, questionRows) => {

                    if (err) {
                        console.error("Daily quiz question select error:", err);
                        return res.status(500).json({ success: false, message: "Server error." });
                    }

                    if (questionRows.length === 0) {
                        return res.json({
                            success: true,
                            question: null,
                            message: "No questions available for this semester yet."
                        });
                    }

                    // Create the attempt row
                    db.query(
                        `INSERT INTO quiz_attempts
                         (user_id, category, subject_id, semester_filter, quiz_date, total_questions, completed)
                         VALUES (?, 'subject', 0, ?, ?, ?, 0)`,
                        [user_id, semester, quizDate, questionRows.length],
                        (err, insertResult) => {

                            if (err) {
                                console.error("Daily quiz attempt create error:", err);
                                return res.status(500).json({ success: false, message: "Server error." });
                            }

                            const attemptId = insertResult.insertId;

                            // Create one quiz_answers row per selected question (answer starts blank)
                            const answerRows = questionRows.map(q => [attemptId, q.id, null, null]);

                            db.query(
                                `INSERT INTO quiz_answers (attempt_id, question_id, selected_option, is_correct)
                                 VALUES ?`,
                                [answerRows],
                                (err) => {

                                    if (err) {
                                        console.error("Daily quiz answers create error:", err);
                                        return res.status(500).json({ success: false, message: "Server error." });
                                    }

                                    db.query(
                                        "SELECT * FROM quiz_attempts WHERE id = ?",
                                        [attemptId],
                                        (err, attemptRows) => {

                                            if (err || attemptRows.length === 0) {
                                                return res.status(500).json({ success: false, message: "Server error." });
                                            }

                                            returnAttemptQuestions(attemptRows[0], res);
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );

});

// Shared helper: given an attempt row, fetch its questions and respond
function returnAttemptQuestions(attempt, res) {

    db.query(
        `SELECT qa.question_id, qa.selected_option, qa.is_correct,
                qq.question, qq.option_a, qq.option_b, qq.option_c, qq.option_d, qq.correct_option
         FROM quiz_answers qa
         JOIN quiz_questions qq ON qq.id = qa.question_id
         WHERE qa.attempt_id = ?`,
        [attempt.id],
        (err, rows) => {

            if (err) {
                console.error("Fetch attempt questions error:", err);
                return res.status(500).json({ success: false, message: "Server error." });
            }

            // If already completed, include correct answers; otherwise hide them
            const questions = rows.map(r => ({
                question_id: r.question_id,
                question: r.question,
                option_a: r.option_a,
                option_b: r.option_b,
                option_c: r.option_c,
                option_d: r.option_d,
                selected_option: r.selected_option,
                correct_option: attempt.completed ? r.correct_option : undefined,
                is_correct: attempt.completed ? r.is_correct === 1 : undefined
            }));

            res.json({
                success: true,
                attempt_id: attempt.id,
                completed: attempt.completed === 1,
                score: attempt.score,
                correct_count: attempt.correct_count,
                incorrect_count: attempt.incorrect_count,
                total_questions: attempt.total_questions,
                questions: questions
            });
        }
    );
}


// ==========================================
// SUBMIT DAILY QUIZ ANSWERS
// POST /api/quiz/daily/:attemptId/submit
// Body: { answers: [{ question_id, selected_option }, ...] }
// ==========================================

router.post("/daily/:attemptId/submit", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const attemptId = req.params.attemptId;
    const answers = req.body.answers || [];

    // Verify this attempt belongs to the user and isn't already completed
    db.query(
        "SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?",
        [attemptId, user_id],
        (err, attemptRows) => {

            if (err) {
                console.error("Submit quiz - attempt lookup error:", err);
                return res.status(500).json({ success: false, message: "Server error." });
            }

            if (attemptRows.length === 0) {
                return res.status(404).json({ success: false, message: "Quiz attempt not found." });
            }

            if (attemptRows[0].completed === 1) {
                return res.status(400).json({ success: false, message: "This quiz has already been submitted." });
            }

            // Get correct answers for every question in this attempt
            db.query(
                `SELECT qa.question_id, qq.correct_option
                 FROM quiz_answers qa
                 JOIN quiz_questions qq ON qq.id = qa.question_id
                 WHERE qa.attempt_id = ?`,
                [attemptId],
                (err, correctRows) => {

                    if (err) {
                        console.error("Submit quiz - correct answer lookup error:", err);
                        return res.status(500).json({ success: false, message: "Server error." });
                    }

                    const correctMap = {};
                    correctRows.forEach(r => {
                        correctMap[r.question_id] = r.correct_option;
                    });

                    let correctCount = 0;
                    let incorrectCount = 0;

                    const updatePromises = answers.map(a => {

                        const isCorrect =
                            correctMap[a.question_id] &&
                            correctMap[a.question_id] === a.selected_option;

                        if (isCorrect) {
                            correctCount++;
                        } else {
                            incorrectCount++;
                        }

                        return new Promise((resolve, reject) => {
                            db.query(
                                `UPDATE quiz_answers
                                 SET selected_option = ?, is_correct = ?
                                 WHERE attempt_id = ? AND question_id = ?`,
                                [a.selected_option, isCorrect ? 1 : 0, attemptId, a.question_id],
                                (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        });

                    });

                    Promise.all(updatePromises)
                        .then(() => {

                            db.query(
                                `UPDATE quiz_attempts
                                 SET score = ?, correct_count = ?, incorrect_count = ?, completed = 1
                                 WHERE id = ?`,
                                [correctCount, correctCount, incorrectCount, attemptId],
                                (err) => {

                                    if (err) {
                                        console.error("Submit quiz - final update error:", err);
                                        return res.status(500).json({ success: false, message: "Server error." });
                                    }

                                    res.json({
                                        success: true,
                                        score: correctCount,
                                        correct_count: correctCount,
                                        incorrect_count: incorrectCount,
                                        total_questions: correctRows.length,
                                        accuracy: Math.round((correctCount / correctRows.length) * 100)
                                    });
                                }
                            );

                        })
                        .catch(err => {
                            console.error("Submit quiz - update answers error:", err);
                            res.status(500).json({ success: false, message: "Server error." });
                        });

                }
            );

        }
    );

});


// ==========================================
// GET DAILY QUIZ RESULT (correct/incorrect breakdown)
// GET /api/quiz/daily/:attemptId/result
// ==========================================

router.get("/daily/:attemptId/result", verifyToken, (req, res) => {

    const user_id = req.user.id;
    const attemptId = req.params.attemptId;

    db.query(
        "SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?",
        [attemptId, user_id],
        (err, attemptRows) => {

            if (err) {
                console.error("Quiz result lookup error:", err);
                return res.status(500).json({ success: false, message: "Server error." });
            }

            if (attemptRows.length === 0) {
                return res.status(404).json({ success: false, message: "Quiz attempt not found." });
            }

            returnAttemptQuestions(attemptRows[0], res);
        }
    );

});


// ==========================================
// DAILY QUIZ HISTORY
// GET /api/quiz/daily/history
// ==========================================

router.get("/daily/history", verifyToken, (req, res) => {

    const user_id = req.user.id;

    db.query(
        `SELECT id, semester_filter, quiz_date, total_questions, score,
                correct_count, incorrect_count, completed, created_at
         FROM quiz_attempts
         WHERE user_id = ? AND category = 'subject' AND completed = 1
         ORDER BY quiz_date DESC`,
        [user_id],
        (err, rows) => {

            if (err) {
                console.error("Quiz history error:", err);
                return res.status(500).json({ success: false, message: "Server error." });
            }

            res.json({
                success: true,
                history: rows
            });
        }
    );

});


module.exports = router;