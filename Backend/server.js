require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const db = require("./config/db");

const authRoutes =
    require("./routes/authRoutes");

const subjectRoutes =
    require("./routes/subjectRoutes");

const academicRoutes =
    require("./routes/academicRoutes");

const adminRoutes =
    require("./routes/adminRoutes");

const pyqRoutes =
    require("./routes/pyqRoutes");

    
const aiRoutes =
    require("./routes/aiRoutes");
    const bookmarkRoutes =
    require("./routes/bookmarkRoutes");

const app = express();
app.set("trust proxy", 1);

// Force any request to fail after 20 seconds instead of hanging forever
// (AI requests get more time since they can legitimately take longer)
app.use((req, res, next) => {
    const timeoutMs = req.path.startsWith("/api/ai") ? 45000 : 20000;
    res.setTimeout(timeoutMs, () => {
        res.status(504).json({ success: false, message: "Request timed out" });
    });
    next();
});

// Wrap express in an http server so socket.io can attach to it
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.get("/api/test123", (req, res) => res.json({ ok: true }));


// ======================================
// LIVE CONNECTED USERS (Socket.io)
// ======================================

let connectedUsers = 0;

io.on("connection", (socket) => {

    connectedUsers++;
    io.emit("userCount", connectedUsers);

    socket.on("disconnect", () => {
        connectedUsers--;
        io.emit("userCount", connectedUsers);
    });

});


// ======================================
// MIDDLEWARE
// ======================================

app.use(cors({
    origin: [
        "http://localhost:5000",
        "https://college-notes-website-f64v.onrender.com"
    ],
    credentials: true
}));

app.use(express.json());


// ======================================
// API ROUTES
// ======================================

app.use("/api", authRoutes);

app.use("/api/subjects", subjectRoutes);

app.use("/api/academic", academicRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/pyq", pyqRoutes);


app.use("/api/ai", aiRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

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

// IMPORTANT: use server.listen, NOT app.listen, now that socket.io is attached
server.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});