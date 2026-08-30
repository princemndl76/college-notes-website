
const express = require("express");
const router = express.Router();
const db = require("../config/db");


// ==================================================
// ==================================================
// COURSES
// ==================================================
// ==================================================


// GET ALL COURSES
// GET /api/academic/courses

router.get("/courses", (req, res) => {

    const sql = `
        SELECT id, course_name, course_code, description
        FROM courses
        ORDER BY id
    `;

    db.query(sql, (error, results) => {

        if (error) {
            console.error("Courses Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to load courses"
            });
        }

        res.json({
            success: true,
            courses: results
        });

    });

});


// CREATE COURSE
// POST /api/academic/courses

router.post("/courses", (req, res) => {

    const { course_name, course_code, description } = req.body;

    if (!course_name) {
        return res.status(400).json({
            success: false,
            message: "course_name is required"
        });
    }

    const sql = `
        INSERT INTO courses (course_name, course_code, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [course_name, course_code || "", description || ""],
        (error, result) => {

            if (error) {
                console.error("Create Course Error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Unable to create course"
                });
            }

            res.status(201).json({
                success: true,
                message: "Course created",
                id: result.insertId
            });

        }
    );

});


// UPDATE COURSE
// PUT /api/academic/courses/:id

router.put("/courses/:id", (req, res) => {

    const { id } = req.params;
    const { course_name, course_code, description } = req.body;

    const sql = `
        UPDATE courses
        SET course_name = ?, course_code = ?, description = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [course_name, course_code || "", description || "", id],
        (error, result) => {

            if (error) {
                console.error("Update Course Error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update course"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });
            }

            res.json({ success: true, message: "Course updated" });

        }
    );

});


// DELETE COURSE
// DELETE /api/academic/courses/:id

router.delete("/courses/:id", (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM courses WHERE id = ?", [id], (error, result) => {

        if (error) {
            console.error("Delete Course Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to delete course. Make sure its years are deleted first."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({ success: true, message: "Course deleted" });

    });

});


// ==================================================
// ==================================================
// ACADEMIC YEARS
// ==================================================
// ==================================================


// GET YEARS OF A COURSE
// GET /api/academic/courses/:courseId/years

router.get("/courses/:courseId/years", (req, res) => {

    const { courseId } = req.params;

    const sql = `
        SELECT id, course_id, year_number, year_name
        FROM academic_years
        WHERE course_id = ?
        ORDER BY year_number
    `;

    db.query(sql, [courseId], (error, results) => {

        if (error) {
            console.error("Years Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to load years"
            });
        }

        res.json({
            success: true,
            years: results
        });

    });

});


// CREATE YEAR
// POST /api/academic/years

router.post("/years", (req, res) => {

    const { course_id, year_number, year_name } = req.body;

    if (!course_id || !year_number || !year_name) {
        return res.status(400).json({
            success: false,
            message: "course_id, year_number and year_name are required"
        });
    }

    const sql = `
        INSERT INTO academic_years (course_id, year_number, year_name)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [course_id, year_number, year_name],
        (error, result) => {

            if (error) {
                console.error("Create Year Error:", error);

                if (error.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "This year number already exists for this course"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to create year"
                });
            }

            res.status(201).json({
                success: true,
                message: "Year created",
                id: result.insertId
            });

        }
    );

});


// UPDATE YEAR
// PUT /api/academic/years/:id

router.put("/years/:id", (req, res) => {

    const { id } = req.params;
    const { year_number, year_name } = req.body;

    const sql = `
        UPDATE academic_years
        SET year_number = ?, year_name = ?
        WHERE id = ?
    `;

    db.query(sql, [year_number, year_name, id], (error, result) => {

        if (error) {
            console.error("Update Year Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to update year"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Year not found"
            });
        }

        res.json({ success: true, message: "Year updated" });

    });

});


// DELETE YEAR
// DELETE /api/academic/years/:id

router.delete("/years/:id", (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM academic_years WHERE id = ?", [id], (error, result) => {

        if (error) {
            console.error("Delete Year Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to delete year. Make sure its semesters are deleted first."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Year not found"
            });
        }

        res.json({ success: true, message: "Year deleted" });

    });

});


// ==================================================
// ==================================================
// SEMESTERS
// ==================================================
// ==================================================


// GET SEMESTERS OF A YEAR
// GET /api/academic/years/:yearId/semesters

router.get("/years/:yearId/semesters", (req, res) => {

    const { yearId } = req.params;

    const sql = `
        SELECT id, year_id, semester_number, semester_name
        FROM semesters
        WHERE year_id = ?
        ORDER BY semester_number
    `;

    db.query(sql, [yearId], (error, results) => {

        if (error) {
            console.error("Semesters Error:", error);
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


// CREATE SEMESTER
// POST /api/academic/semesters

router.post("/semesters", (req, res) => {

    const { year_id, semester_number, semester_name } = req.body;

    if (!year_id || !semester_number || !semester_name) {
        return res.status(400).json({
            success: false,
            message: "year_id, semester_number and semester_name are required"
        });
    }

    const sql = `
        INSERT INTO semesters (year_id, semester_number, semester_name)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [year_id, semester_number, semester_name],
        (error, result) => {

            if (error) {
                console.error("Create Semester Error:", error);

                if (error.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "This semester number already exists for this year"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to create semester"
                });
            }

            res.status(201).json({
                success: true,
                message: "Semester created",
                id: result.insertId
            });

        }
    );

});


// UPDATE SEMESTER
// PUT /api/academic/semesters/:id

router.put("/semesters/:id", (req, res) => {

    const { id } = req.params;
    const { semester_number, semester_name } = req.body;

    const sql = `
        UPDATE semesters
        SET semester_number = ?, semester_name = ?
        WHERE id = ?
    `;

    db.query(sql, [semester_number, semester_name, id], (error, result) => {

        if (error) {
            console.error("Update Semester Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to update semester"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Semester not found"
            });
        }

        res.json({ success: true, message: "Semester updated" });

    });

});


// DELETE SEMESTER
// DELETE /api/academic/semesters/:id

router.delete("/semesters/:id", (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM semesters WHERE id = ?", [id], (error, result) => {

        if (error) {
            console.error("Delete Semester Error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to delete semester. Make sure its subjects are deleted first."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Semester not found"
            });
        }

        res.json({ success: true, message: "Semester deleted" });

    });

});


module.exports = router;