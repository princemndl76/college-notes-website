const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const { pyqStorage } = require("../config/cloudinary");
const upload = multer({ storage: pyqStorage });

// ==================================================
// GET YEARS THAT HAVE PAPERS FOR A SEMESTER
// GET /api/pyq/semester/:semesterId/years
// ==================================================
router.get("/semester/:semesterId/years", (req, res) => {

    const { semesterId } = req.params;

    const sql = `
        SELECT DISTINCT exam_year
        FROM previous_year_papers
        WHERE semester_id = ?
        ORDER BY exam_year DESC
    `;

    db.query(sql, [semesterId], (error, results) => {
        if (error) {
            console.error("PYQ Years Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load years" });
        }
        const availableYears = results.map(r => r.exam_year);
        res.json({ success: true, availableYears });
    });
});


// ==================================================
// GET PAPERS FOR A SEMESTER + YEAR
// GET /api/pyq/semester/:semesterId/year/:year
// ==================================================
router.get("/semester/:semesterId/year/:year", (req, res) => {

    const { semesterId, year } = req.params;

    const sql = `
        SELECT
            pyp.id,
            pyp.exam_year,
            pyp.paper_title,
            pyp.file_url,
            pyp.description,
            s.subject_name,
            s.subject_code
        FROM previous_year_papers pyp
        JOIN subjects s ON pyp.subject_id = s.id
        WHERE pyp.semester_id = ? AND pyp.exam_year = ?
        ORDER BY s.subject_name
    `;

    db.query(sql, [semesterId, year], (error, results) => {
        if (error) {
            console.error("PYQ Papers Error:", error);
            return res.status(500).json({ success: false, message: "Unable to load papers" });
        }
        res.json({ success: true, papers: results });
    });
});


// ==================================================
// UPLOAD A PYQ PAPER
// POST /api/pyq/upload
// ==================================================
router.post("/upload", upload.single("paperFile"), (req, res) => {

    const { semesterId, subjectId, examYear, paperTitle, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = req.file.path;

    const sql = `
        INSERT INTO previous_year_papers
        (semester_id, subject_id, exam_year, paper_title, description, file_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [semesterId, subjectId, examYear, paperTitle, description, fileUrl], (error, result) => {
        if (error) {
            console.error("PYQ Upload Error:", error);
            return res.status(500).json({ success: false, message: "Upload failed" });
        }
        res.json({ success: true, message: "Paper uploaded", fileUrl });
    });
});


module.exports = router;