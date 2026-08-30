const mysql = require("mysql2");


// Create MySQL connection
// Uses environment variables so the same code works
// locally (via your .env file) and when deployed
// (via Render's environment variable settings).

const db = mysql.createConnection({

    host: process.env.DB_HOST || "localhost",

    user: process.env.DB_USER || "root",

    password: process.env.DB_PASSWORD || "MYSQL@@66",

    database: process.env.DB_NAME || "college_notes",

    port: process.env.DB_PORT || 3306

});


// Connect to MySQL

db.connect((error) => {

    if (error) {

        console.error("MySQL connection failed!");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Full error:", error);

        return;

    }

    console.log(
        "MySQL Connected Successfully!"
    );

});


module.exports = db;