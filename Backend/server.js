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

const app = express();

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
       origin: "http://localhost:5000", // your actual frontend origin
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