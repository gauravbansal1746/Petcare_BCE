var dbRef = require("../config/db");

var VALID_STATUSES         = ["pending", "confirmed", "cancelled", "completed"];
var VALID_PAYMENT_STATUSES = ["pending", "paid"];

function hasColumn(columns, name) {
    var target = String(name).toLowerCase();
    return (columns || []).some(function (c) {
        return String(c.Field).toLowerCase() === target;
    });
}

function ensureBookingColumns() {
    dbRef.query("SHOW COLUMNS FROM bookings", function (err, cols) {
        if (err) {
            console.log("Bookings schema check error: " + err.toString());
            return;
        }
        var alters = [];
        if (!hasColumn(cols, "petType"))
            alters.push("ALTER TABLE bookings ADD COLUMN petType VARCHAR(100) NOT NULL DEFAULT 'dog'");
        if (!hasColumn(cols, "city"))
            alters.push("ALTER TABLE bookings ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT ''");
        if (!hasColumn(cols, "time"))
            alters.push("ALTER TABLE bookings ADD COLUMN time VARCHAR(20) NOT NULL DEFAULT '09:00'");
        if (!hasColumn(cols, "paymentStatus"))
            alters.push("ALTER TABLE bookings ADD COLUMN paymentStatus VARCHAR(20) NOT NULL DEFAULT 'pending'");
        else
            alters.push("ALTER TABLE bookings MODIFY COLUMN paymentStatus VARCHAR(20) NOT NULL DEFAULT 'pending'");

        alters.forEach(function (sql) {
            dbRef.query(sql, function (alterErr) {
                if (alterErr) console.log("Bookings alter error: " + alterErr.toString());
            });
        });

        dbRef.query(
            "UPDATE bookings SET paymentStatus='pending' WHERE paymentStatus IS NULL OR paymentStatus='' OR paymentStatus='unpaid' OR paymentStatus='failed'",
            function () {}
        );
    });
}

// Create table if it does not exist — runs once on server start
dbRef.query(`
    CREATE TABLE IF NOT EXISTS bookings (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        userId          VARCHAR(255) NOT NULL,
        caretakerId     VARCHAR(255) NOT NULL,
        petType         VARCHAR(100) NOT NULL DEFAULT 'dog',
        city            VARCHAR(100) NOT NULL DEFAULT '',
        date            DATE NOT NULL,
        time            VARCHAR(20) NOT NULL DEFAULT '09:00',
        status          ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
        paymentStatus   ENUM('pending','paid') NOT NULL DEFAULT 'pending',
        createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId)      REFERENCES users(emailid),
        FOREIGN KEY (caretakerId) REFERENCES users(emailid)
    )
`, function (err) {
    if (err) console.log("Bookings table error: " + err.toString());
    else {
        console.log("Bookings table ready.");
        ensureBookingColumns();
    }
});

var Booking = {

    VALID_STATUSES:         VALID_STATUSES,
    VALID_PAYMENT_STATUSES: VALID_PAYMENT_STATUSES,

    create: function (userId, caretakerId, petType, city, date, time, callback) {
        dbRef.query(
            "INSERT INTO bookings (userId, caretakerId, petType, city, date, time, status, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending')",
            [userId, caretakerId, petType, city, date, time],
            callback
        );
    },

    updateStatus: function (bookingId, status, callback) {
        dbRef.query(
            "UPDATE bookings SET status=? WHERE id=?",
            [status, bookingId],
            callback
        );
    },

    updatePaymentAndBookingStatus: function (bookingId, paymentStatus, bookingStatus, callback) {
        dbRef.query(
            "UPDATE bookings SET paymentStatus=?, status=? WHERE id=?",
            [paymentStatus, bookingStatus, bookingId],
            callback
        );
    },

    updateStatusByCaretaker: function (bookingId, caretakerId, status, callback) {
        dbRef.query(
            "UPDATE bookings SET status=? WHERE id=? AND caretakerId=?",
            [status, bookingId, caretakerId],
            callback
        );
    },

    // Paginated — returns one page of results
    findByUser: function (userId, limit, offset, callback) {
        dbRef.query(
            "SELECT id, userId, caretakerId, petType, city, date, time, status, paymentStatus, createdAt " +
            "FROM bookings WHERE userId=? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
            [userId, limit, offset],
            callback
        );
    },

    // Total count for pagination metadata
    countByUser: function (userId, callback) {
        dbRef.query(
            "SELECT COUNT(*) AS total FROM bookings WHERE userId=?",
            [userId],
            callback
        );
    },

    // Paginated — returns one page of results
    findByCaretaker: function (caretakerId, limit, offset, callback) {
        dbRef.query(
            "SELECT id, userId, caretakerId, petType, city, date, time, status, paymentStatus, createdAt " +
            "FROM bookings WHERE caretakerId=? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
            [caretakerId, limit, offset],
            callback
        );
    },

    // Total count for pagination metadata
    countByCaretaker: function (caretakerId, callback) {
        dbRef.query(
            "SELECT COUNT(*) AS total FROM bookings WHERE caretakerId=?",
            [caretakerId],
            callback
        );
    },

    findById: function (bookingId, callback) {
        dbRef.query(
            "SELECT id, userId, caretakerId, petType, city, date, time, status, paymentStatus, createdAt " +
            "FROM bookings WHERE id=?",
            [bookingId],
            callback
        );
    },

    countAll: function (callback) {
        dbRef.query("SELECT COUNT(*) AS total FROM bookings", callback);
    },

    findAll: function (limit, offset, callback) {
        dbRef.query(
            "SELECT id, userId, caretakerId, petType, city, date, time, status, paymentStatus, createdAt " +
            "FROM bookings ORDER BY createdAt DESC LIMIT ? OFFSET ?",
            [limit, offset],
            callback
        );
    }
};

module.exports = Booking;
