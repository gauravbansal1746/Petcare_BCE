var dbRef = require("../config/db");

// Create table if it does not exist — runs once on server start
dbRef.query(`
    CREATE TABLE IF NOT EXISTS payments (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        bookingId       INT NOT NULL,
        userId          VARCHAR(255) NOT NULL,
        amount          DECIMAL(10,2) NOT NULL,
        status          ENUM('success','failed') NOT NULL,
        transactionId   VARCHAR(100) DEFAULT NULL,
        reason          VARCHAR(255) DEFAULT NULL,
        createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES bookings(id),
        FOREIGN KEY (userId)    REFERENCES users(emailid)
    )
`, function (err) {
    if (err) console.log("Payments table error: " + err.toString());
    else     console.log("Payments table ready.");
});

var Payment = {

    // Log every payment attempt — success or failure
    create: function (bookingId, userId, amount, status, transactionId, reason, callback) {
        dbRef.query(
            "INSERT INTO payments (bookingId, userId, amount, status, transactionId, reason) VALUES (?,?,?,?,?,?)",
            [bookingId, userId, amount, status, transactionId || null, reason || null],
            callback
        );
    },

    findByBooking: function (bookingId, callback) {
        dbRef.query(
            "SELECT * FROM payments WHERE bookingId=? ORDER BY createdAt DESC",
            [bookingId],
            callback
        );
    }
};

module.exports = Payment;
