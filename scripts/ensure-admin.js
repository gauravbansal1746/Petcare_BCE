/**
 * Create or update the default admin account (for local/dev login to /dash-admin).
 *
 * Usage (from project root):
 *   node scripts/ensure-admin.js
 *
 * Optional env overrides (same MYSQL_* as config/db.js):
 *   ADMIN_EMAIL, ADMIN_PASSWORD — defaults admin@gmail.com / Admin@123
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

var bcrypt = require("bcryptjs");
var mysql  = require("mysql");

var ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "admin@gmail.com";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
}

var pool = mysql.createPool({
    host:     process.env.MYSQL_HOST || "127.0.0.1",
    user:     process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "petcare",
    connectionLimit: 2
});

pool.query("ALTER TABLE users MODIFY COLUMN pwd VARCHAR(255) NOT NULL", function (alterErr) {
    if (alterErr)
        console.warn("ALTER pwd column:", alterErr.message);

    bcrypt.hash(ADMIN_PASSWORD, 10, function (err, hash) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        var sql =
            "INSERT INTO users (emailid, pwd, utype, status) VALUES (?, ?, 'admin', 1) " +
            "ON DUPLICATE KEY UPDATE pwd = VALUES(pwd), utype = 'admin', status = 1";
        pool.query(sql, [ADMIN_EMAIL, hash], function (e) {
            if (e) {
                console.error(e.message);
                process.exit(1);
            }
            console.log("Admin ready:", ADMIN_EMAIL, "(password from ADMIN_PASSWORD or default Admin@123)");
            console.log("Log in at the home page; you will be redirected to /dash-admin.");
            pool.end();
        });
    });
});
