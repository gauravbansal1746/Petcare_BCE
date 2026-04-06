var mysql  = require("mysql");
var logger = require("./logger");

// ── Connection Pool ───────────────────────────────────────────────────────────
// Local defaults match typical XAMPP/WAMP. For deployment, set MYSQL_* in .env
// (or the host platform’s environment) to your managed MySQL host and credentials.
var pool = mysql.createPool({
    host:              process.env.MYSQL_HOST || "127.0.0.1",
    user:              process.env.MYSQL_USER || "root",
    password:          process.env.MYSQL_PASSWORD || "",
    database:          process.env.MYSQL_DATABASE || "petcare",
    connectionLimit:   parseInt(process.env.MYSQL_CONNECTION_LIMIT, 10) || 10,
    waitForConnections: true,
    queueLimit:        0
});

// ── Schema compatibility (must run after DB is reachable) ──────────────────
// bcrypt hashes are 60 chars ($2a$/$2b$…); VARCHAR(50) truncates them → "invalid password" on login.
function applySchemaFixes() {
    var sql = "ALTER TABLE users MODIFY COLUMN pwd VARCHAR(255) NOT NULL";
    pool.query(sql, function (err) {
        if (err) {
            logger.error("CRITICAL: could not widen users.pwd — logins will fail until you run SQL manually", {
                meta: { error: err.message, code: err.code, sql: sql }
            });
            console.error(
                "\n[petcare] Fix users.pwd column manually in MySQL:\n" +
                "  USE petcare;\n" +
                "  ALTER TABLE users MODIFY COLUMN pwd VARCHAR(255) NOT NULL;\n"
            );
            return;
        }
        logger.info("Database schema OK: users.pwd is VARCHAR(255) (safe for bcrypt)", { meta: {} });
        console.log("[petcare] users.pwd column set to VARCHAR(255).");
    });

    // Legacy schemas had INT columns for contact/pic fields.
    // That truncates phone numbers and stores file names as 0.
    var profileFixes = [
        "ALTER TABLE clients MODIFY COLUMN contact VARCHAR(20) NOT NULL",
        "ALTER TABLE clients MODIFY COLUMN pin VARCHAR(10) NOT NULL",
        "ALTER TABLE clients MODIFY COLUMN pic1 VARCHAR(255) NOT NULL",
        "ALTER TABLE clients MODIFY COLUMN pic2 VARCHAR(255) NOT NULL",
        "ALTER TABLE caretakers MODIFY COLUMN Contact VARCHAR(20) NOT NULL",
        "ALTER TABLE caretakers MODIFY COLUMN pin VARCHAR(10) NOT NULL",
        "ALTER TABLE caretakers MODIFY COLUMN pic VARCHAR(255) NOT NULL"
    ];

    profileFixes.forEach(function (fixSql) {
        pool.query(fixSql, function (fixErr) {
            if (fixErr) {
                logger.warn("Profile schema fix skipped", {
                    meta: { sql: fixSql, error: fixErr.message, code: fixErr.code }
                });
                return;
            }
            if (process.env.NODE_ENV !== "production")
                console.log("[petcare] profile schema fix applied:", fixSql);
        });
    });
}

// Verify the pool can reach the DB on startup, then widen pwd column if needed
pool.getConnection(function (err, connection) {
    if (err) {
        logger.error("Database connection failed", { meta: { error: err.message } });
        return;
    }
    logger.info("Database pool connected successfully", { meta: { host: "127.0.0.1", database: "petcare" } });
    connection.release();
    applySchemaFixes();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
// ADD INDEX IF NOT EXISTS is not supported in MySQL 5.x, so we use a
// stored-procedure-style approach: attempt to add, ignore duplicate-key errors.
// Each index targets a column that appears in a WHERE, JOIN, or ORDER BY clause.

var indexes = [
    // users — login lookup and admin block/resume
    "ALTER TABLE users ADD INDEX idx_users_emailid (emailid)",

    // clients — profile fetch and admin delete
    "ALTER TABLE clients ADD INDEX idx_clients_email (email)",

    // caretakers — profile fetch, city filter, pet filter, admin delete
    "ALTER TABLE caretakers ADD INDEX idx_caretakers_email (email)",
    "ALTER TABLE caretakers ADD INDEX idx_caretakers_city  (city)",

    // bookings — the two most-queried FK columns + status filter
    "ALTER TABLE bookings ADD INDEX idx_bookings_userId      (userId)",
    "ALTER TABLE bookings ADD INDEX idx_bookings_caretakerId (caretakerId)",
    "ALTER TABLE bookings ADD INDEX idx_bookings_status      (status)",

    // payments — lookup by booking
    "ALTER TABLE payments ADD INDEX idx_payments_bookingId (bookingId)",
    "ALTER TABLE payments ADD INDEX idx_payments_userId    (userId)"
];

indexes.forEach(function (sql) {
    pool.query(sql, function (err) {
        // ER_DUP_KEYNAME = index already exists — safe to ignore
        if (err && err.code !== "ER_DUP_KEYNAME")
            logger.warn("Index creation skipped", { meta: { sql: sql, error: err.message } });
    });
});

module.exports = pool;
