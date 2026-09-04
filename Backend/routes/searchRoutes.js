const express = require("express");
const router = express.Router();

const db = require("../config/db");


// ======================================
// GLOBAL SEARCH
// ======================================

router.get("/", (req, res) => {

    const q = (req.query.q || "").trim();

    // If search box is empty
    if (!q) {
        return res.json({
            success: true,
            results: []
        });
    }


    const searchTerm = `%${q}%`;


    // ======================================
    // SEARCH QUERY
    // ======================================

    const sql = `
        SELECT *
        FROM (

            -- ==============================
            -- COURSES
            -- ==============================

            SELECT
                'course' AS type,
                c.id AS id,
                c.course_name AS title,
                c.course_code AS code,
                c.description AS description,
                NULL AS subject_id,
                NULL AS content_id

            FROM courses c

            WHERE c.course_name LIKE ?
               OR c.course_code LIKE ?
               OR c.description LIKE ?


            UNION ALL


            -- ==============================
            -- ACADEMIC YEARS
            -- ==============================

            SELECT
                'year' AS type,
                ay.id AS id,
                ay.year_name AS title,
                NULL AS code,
                NULL AS description,
                NULL AS subject_id,
                NULL AS content_id

            FROM academic_years ay

            WHERE ay.year_name LIKE ?


            UNION ALL


            -- ==============================
            -- SEMESTERS
            -- ==============================

            SELECT
                'semester' AS type,
                s.id AS id,
                s.semester_name AS title,
                NULL AS code,
                NULL AS description,
                NULL AS subject_id,
                NULL AS content_id

            FROM semesters s

            WHERE s.semester_name LIKE ?


            UNION ALL


            -- ==============================
            -- SUBJECTS
            -- ==============================

            SELECT
                'subject' AS type,
                sub.id AS id,
                sub.subject_name AS title,
                sub.subject_code AS code,
                sub.description AS description,
                sub.id AS subject_id,
                NULL AS content_id

            FROM subjects sub

            WHERE sub.subject_name LIKE ?
               OR sub.subject_code LIKE ?
               OR sub.description LIKE ?


            UNION ALL


            -- ==============================
            -- UNITS
            -- ==============================

            SELECT
                'unit' AS type,
                u.id AS id,
                u.unit_name AS title,
                NULL AS code,
                u.description AS description,
                u.subject_id AS subject_id,
                NULL AS content_id

            FROM units u

            WHERE u.unit_name LIKE ?
               OR u.description LIKE ?


            UNION ALL


            -- ==============================
            -- CONTENTS
            -- ==============================

            SELECT
                'content' AS type,
                ct.id AS id,
                ct.content_name AS title,
                NULL AS code,
                NULL AS description,
                u.subject_id AS subject_id,
                ct.id AS content_id

            FROM contents ct

            INNER JOIN units u
                ON ct.unit_id = u.id

            WHERE ct.content_name LIKE ?


            UNION ALL


            -- ==============================
            -- NOTES
            -- ==============================

            SELECT
                'note' AS type,
                n.id AS id,
                n.title AS title,
                NULL AS code,
                n.body AS description,
                s.id AS subject_id,
                ct.id AS content_id

            FROM notes n

            INNER JOIN contents ct
                ON n.content_id = ct.id

            INNER JOIN units u
                ON ct.unit_id = u.id

            INNER JOIN subjects s
                ON u.subject_id = s.id

            WHERE n.title LIKE ?
               OR n.body LIKE ?

        ) AS search_results


        -- ==================================
        -- RESULT PRIORITY
        -- ==================================

        ORDER BY
            CASE type

                WHEN 'subject' THEN 1
                WHEN 'course' THEN 2
                WHEN 'unit' THEN 3
                WHEN 'content' THEN 4
                WHEN 'note' THEN 5
                WHEN 'semester' THEN 6
                WHEN 'year' THEN 7

                ELSE 8

            END


        LIMIT 50
    `;


    // ======================================
    // QUERY VALUES
    // ======================================

    const values = [

        // courses
        searchTerm,
        searchTerm,
        searchTerm,

        // academic years
        searchTerm,

        // semesters
        searchTerm,

        // subjects
        searchTerm,
        searchTerm,
        searchTerm,

        // units
        searchTerm,
        searchTerm,

        // contents
        searchTerm,

        // notes
        searchTerm,
        searchTerm
    ];


    // ======================================
    // RUN MYSQL QUERY
    // ======================================

    db.query(
        sql,
        values,
        (error, results) => {

            if (error) {

                console.error(
                    "Search database error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Search failed."
                });

            }


            // ==================================
            // SUCCESS
            // ==================================

            res.json({
                success: true,
                results: results
            });

        }
    );

});


module.exports = router;