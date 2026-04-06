/**
 * Set a new bcrypt hash for one user (fixes accounts broken by truncated VARCHAR(50) hashes).
 *
 * Usage (from project root, server stopped is optional):
 *   node scripts/reset-user-password.js you@email.com YourNewPassword12
 *
 * Requires: MySQL running, same credentials as config/db.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

var bcrypt = require("bcryptjs");
var mysql  = require("mysql");

var email = process.argv[2];
var plain = process.argv[3];

if (!email || !plain || plain.length < 6) {
    console.error("Usage: node scripts/reset-user-password.js <email> <newPasswordMin6Chars>");
    process.exit(1);
}

var pool = mysql.createPool({
    host:     "127.0.0.1",
    user:     "root",
    password: "",
    database: "petcare"
});

pool.query("ALTER TABLE users MODIFY COLUMN pwd VARCHAR(255) NOT NULL", function (alterErr) {
    if (alterErr)
        console.warn("ALTER pwd column (fix if needed):", alterErr.message);

    bcrypt.hash(plain, 10, function (err, hash) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        pool.query("UPDATE users SET pwd = ? WHERE emailid = ?", [hash, email], function (e, result) {
            if (e) {
                console.error(e.message);
                process.exit(1);
            }
            if (result.affectedRows === 0) {
                console.error("No user found with email:", email);
                process.exit(1);
            }
            console.log("Password updated for", email, "— you can log in with the new password.");
            pool.end();
        });
    });
});
