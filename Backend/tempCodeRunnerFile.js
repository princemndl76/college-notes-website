const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./config/db");

const authRoutes =
    require("./routes/authRoutes");

const subjectRoutes =
    require("./routes/subjectRoutes");

const app = express();


// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());

app.use(express.json());


// ======================================
// API ROUTES
// ======================================

app.use("/api", authRoutes);

app.use("/api/subjects", subjectRoutes);


// ======================================
// SERVE UPLOADED NOTE FILES
// ======================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// ======================================
// SERVE FRONTEND
// ======================================

app.use(
    "/Frontend",
    express.static(
  path.join(__dirname, "..", "Frontend")
    )
);


// ======================================
// HOME PAGE
// ======================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "..",
            "Frontend/pages/login.html"
        )
    );
});


// ======================================
// TEST MYSQL
// ======================================

app.get("/test-db", (req, res) => {

    db.query(
        "SELECT 1 AS result",
        (error, results) => {

            if (error) {

                console.error(error);

                return res.status(500).json({

                    success: false,

                    message:
                        "Database connection failed"

                });

            }

            res.json({

                success: true,

                message:
                    "MySQL Database Connected!",

                result: results

            });

        }
    );

});


// ======================================
// START SERVER
// ======================================

const PORT = 5000;

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});