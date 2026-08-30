const mysql = require("mysql2");


// Create MySQL connection

const db = mysql.createConnection({

    host: "localhost",

    user: "root",

    password: "MYSQL@@66",

    database: "college_notes"

});


// Connect to MySQL

db.connect((error) => {

    if (error) {

        console.error(
            "MySQL connection failed:",
            error.message
        );

        return;

    }

    console.log(
        "MySQL Connected Successfully!"
    );

});


module.exports = db;