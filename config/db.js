var mysql2  = require("mysql2");
var bcrypt  = require("bcryptjs");
var logger = require("./logger");

function env(name, fallback) {
    var v = process.env[name];
    return v != null && String(v).trim() !== "" ? v : fallback;
}

function safeLogDbTarget() {
    // Avoid logging secrets; only log host + db if possible
    if (!process.env.DB_URL) return { host: env("DB_HOST", env("MYSQL_HOST", "127.0.0.1")), database: env("DB_NAME", env("MYSQL_DATABASE", "petcare")) };
    try {
        var u = new URL(process.env.DB_URL);
        return { host: u.hostname, database: (u.pathname || "").replace(/^\//, "") || "(unknown)" };
    } catch (_) {
        return { host: "(from DB_URL)", database: "(from DB_URL)" };
    }
}

// ── Connection Pool ───────────────────────────────────────────────────────────
// Local defaults match typical XAMPP/WAMP. For deployment, set MYSQL_* in .env
// (or the host platform’s environment) to your managed MySQL host and credentials.
var pool = process.env.DB_URL
    ? mysql2.createPool(process.env.DB_URL)
    : mysql2.createPool({
          // Production-friendly names (preferred): DB_*
          // Back-compat: MYSQL_*
          host:              env("DB_HOST", env("MYSQL_HOST", "127.0.0.1")),
          user:              env("DB_USER", env("MYSQL_USER", "root")),
          password:          env("DB_PASSWORD", env("MYSQL_PASSWORD", "")),
          database:          env("DB_NAME", env("MYSQL_DATABASE", "petcare")),
          port:              parseInt(env("DB_PORT", env("MYSQL_PORT", "3306")), 10) || 3306,
          connectionLimit:   parseInt(env("DB_CONNECTION_LIMIT", env("MYSQL_CONNECTION_LIMIT", "10")), 10) || 10,
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

    // Ensure a default admin exists (requested: hardcoded credentials).
    // This does NOT bypass DB auth; it inserts the admin user if missing.
    var ADMIN_EMAIL = "admin@gmail.com";
    var ADMIN_PLAIN = "admin123";
    pool.query("SELECT emailid FROM users WHERE emailid=?", [ADMIN_EMAIL], function (e, rows) {
        if (e) {
            logger.warn("Default admin check failed", { meta: { error: e.message } });
            return;
        }
        if (rows && rows.length > 0) return; // already exists; do not overwrite password

        bcrypt.hash(ADMIN_PLAIN, 10, function (hashErr, hash) {
            if (hashErr) {
                logger.warn("Default admin hash failed", { meta: { error: hashErr.message } });
                return;
            }
            pool.query(
                "INSERT INTO users (emailid, pwd, utype, status) VALUES (?,?, 'admin', 1)",
                [ADMIN_EMAIL, hash],
                function (insErr) {
                    if (insErr) {
                        logger.warn("Default admin insert failed", { meta: { error: insErr.message } });
                        return;
                    }
                    logger.info("Default admin created", { meta: { email: ADMIN_EMAIL } });
                    if (process.env.NODE_ENV !== "production") {
                        console.log("[petcare] Default admin ready:", ADMIN_EMAIL, "/", ADMIN_PLAIN);
                    }
                }
            );
        });
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
    logger.info("Database pool connected successfully", { meta: safeLogDbTarget() });
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
