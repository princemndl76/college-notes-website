require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const db = require("./config/db");

// ======================================
// ROUTES
// ======================================

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const academicRoutes = require("./routes/academicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const pyqRoutes = require("./routes/pyqRoutes");
const aiRoutes = require("./routes/aiRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const searchRoutes = require("./routes/searchRoutes");
const progressRoutes = require("./routes/progressRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
// ======================================
// CREATE APP
// ======================================

const app = express();

app.set("trust proxy", 1);

// ======================================
// MIDDLEWARE
// ======================================

app.use(
    cors({
        origin: [
            "http://localhost:5000",
            "http://127.0.0.1:5000",
            "https://college-notes-website-f64v.onrender.com"
        ],
        credentials: true
    })
);

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// ======================================
// REQUEST TIMEOUT
// ======================================

app.use((req, res, next) => {

    const timeoutMs =
        req.path.startsWith("/api/ai")
            ? 45000
            : 20000;

    res.setTimeout(timeoutMs, () => {

        if (!res.headersSent) {

            res.status(504).json({
                success: false,
                message: "Request timed out"
            });

        }

    });

    next();

});

// ======================================
// HTTP SERVER
// ======================================

const server = http.createServer(app);

// ======================================
// SOCKET.IO
// ======================================

const io = new Server(server, {

    cors: {
        origin: [
            "http://localhost:5000",
            "http://127.0.0.1:5000",
            "https://college-notes-website-f64v.onrender.com"
        ],
        credentials: true
    }

});

// ======================================
// TEST API
// ======================================

app.get("/api/test123", (req, res) => {

    res.json({
        success: true,
        message: "Backend API is working!"
    });

});

// ======================================
// LIVE CONNECTED USERS
// ======================================

let connectedUsers = 0;

io.on("connection", (socket) => {

    connectedUsers++;

    console.log(
        `User connected. Total users: ${connectedUsers}`
    );

    io.emit(
        "userCount",
        connectedUsers
    );

    socket.on("disconnect", () => {

        connectedUsers--;

        console.log(
            `User disconnected. Total users: ${connectedUsers}`
        );

        io.emit(
            "userCount",
            connectedUsers
        );

    });

});

// ======================================
// API ROUTES
// ======================================

// ======================================
// AUTHENTICATION
// ======================================

app.use(
    "/api",
    authRoutes
);
// ======================================
// FEEDBACK
// ======================================

app.use(
    "/api/feedback",
    feedbackRoutes
);

// ======================================
// SUBJECTS / UNITS / CONTENTS / NOTES
// ======================================

app.use(
    "/api/subjects",
    subjectRoutes
);

// ======================================
// COURSES / YEARS / SEMESTERS
// ======================================

app.use(
    "/api/academic",
    academicRoutes
);

// ======================================
// ADMIN
// ======================================

app.use(
    "/api/admin",
    adminRoutes
);

// ======================================
// PREVIOUS YEAR QUESTIONS
// ======================================

app.use(
    "/api/pyq",
    pyqRoutes
);

// ======================================
// AI
// ======================================

app.use(
    "/api/ai",
    aiRoutes
);

// ======================================
// BOOKMARKS
// ======================================

app.use(
    "/api/bookmarks",
    bookmarkRoutes
);

// ======================================
// STUDY PROGRESS
// ======================================

app.use(
    "/api/progress",
    progressRoutes
);

// ======================================
// GLOBAL SEARCH
// ======================================

// IMPORTANT:
// Keep this route unchanged because your
// dashboard search is currently working.

app.use(
    "/api/search",
    searchRoutes
);

// ======================================
// SERVE UPLOADED FILES
// ======================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

// ======================================
// SERVE FRONTEND
// ======================================

app.use(
    "/Frontend",
    express.static(
        path.join(
            __dirname,
            "..",
            "Frontend"
        )
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
            "Frontend",
            "pages",
            "login.html"
        )
    );

});

// ======================================
// TEST MYSQL DATABASE
// ======================================

app.get("/test-db", (req, res) => {

    db.query(
        "SELECT 1 AS result",
        (error, results) => {

            if (error) {

                console.error(
                    "Database error:",
                    error
                );

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
// API 404 HANDLER
// ======================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found"

        });

    }
);

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled server error:",
            err
        );

        if (res.headersSent) {
            return next(err);
        }

        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);

// ======================================
// START SERVER
// ======================================

const PORT =
    process.env.PORT || 5000;

server.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);