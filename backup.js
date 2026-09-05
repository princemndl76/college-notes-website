const mysql = require("mysql2/promise");
const fs = require("fs");

const DB_PASSWORD = "UBjAQuQMwIwQOXawPiBGdixcxnAgePRt";

async function backup() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: "sakura.proxy.rlwy.net",
            port: 15545,
            user: "root",
            password: DB_PASSWORD,
            database: "railway"
        });

        console.log("✅ Connected to Railway MySQL");

        const [tables] = await connection.query("SHOW TABLES");

        let sql = `
-- College Notes Railway Database Backup
-- Created: ${new Date().toISOString()}

SET FOREIGN_KEY_CHECKS=0;

`;

        for (const row of tables) {
            const table = Object.values(row)[0];

            console.log(`📦 Backing up: ${table}`);

            const [createResult] = await connection.query(
                `SHOW CREATE TABLE \`${table}\``
            );

            sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
            sql += createResult[0]["Create Table"] + ";\n\n";

            const [rows] = await connection.query(
                `SELECT * FROM \`${table}\``
            );

            for (const data of rows) {
                const columns = Object.keys(data)
                    .map(column => `\`${column}\``)
                    .join(", ");

                const values = Object.values(data)
                    .map(value => mysql.escape(value))
                    .join(", ");

                sql += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
            }

            sql += "\n";
        }

        sql += "SET FOREIGN_KEY_CHECKS=1;\n";

        fs.writeFileSync(
            "college_notes_backup.sql",
            sql,
            "utf8"
        );

        console.log("\n🎉 BACKUP COMPLETED SUCCESSFULLY!");
        console.log("📁 college_notes_backup.sql");

    } catch (error) {
        console.error("\n❌ BACKUP FAILED");
        console.error("Error:", error.message);

    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

backup();