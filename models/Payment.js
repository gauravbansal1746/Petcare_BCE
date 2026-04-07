var dbRef = require("../config/db");

// Create table if it does not exist — runs once on server start
dbRef.query(`
    CREATE TABLE IF NOT EXISTS payments (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        bookingId       INT NOT NULL,
        userId          VARCHAR(255) NOT NULL,
        amount          DECIMAL(10,2) NOT NULL,
        status          ENUM('created','success','failed') NOT NULL,
        transactionId   VARCHAR(100) DEFAULT NULL,
        orderId         VARCHAR(100) DEFAULT NULL,
        razorpayPaymentId VARCHAR(100) DEFAULT NULL,
        razorpayOrderId   VARCHAR(100) DEFAULT NULL,
        signature         VARCHAR(255) DEFAULT NULL,
        paymentMethod     VARCHAR(50) DEFAULT NULL,
        reason          VARCHAR(255) DEFAULT NULL,
        createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES bookings(id),
        FOREIGN KEY (userId)    REFERENCES users(emailid)
    )
`, function (err) {
    if (err) console.log("Payments table error: " + err.toString());
    else     console.log("Payments table ready.");
});

dbRef.query("SHOW COLUMNS FROM payments", function (err, cols) {
    if (err) return;
    var names = (cols || []).map(function (c) { return String(c.Field).toLowerCase(); });
    function add(sql) { dbRef.query(sql, function () {}); }
    if (names.indexOf("orderid") === -1) add("ALTER TABLE payments ADD COLUMN orderId VARCHAR(100) DEFAULT NULL");
    if (names.indexOf("razorpaypaymentid") === -1) add("ALTER TABLE payments ADD COLUMN razorpayPaymentId VARCHAR(100) DEFAULT NULL");
    if (names.indexOf("razorpayorderid") === -1) add("ALTER TABLE payments ADD COLUMN razorpayOrderId VARCHAR(100) DEFAULT NULL");
    if (names.indexOf("signature") === -1) add("ALTER TABLE payments ADD COLUMN signature VARCHAR(255) DEFAULT NULL");
    if (names.indexOf("paymentmethod") === -1) add("ALTER TABLE payments ADD COLUMN paymentMethod VARCHAR(50) DEFAULT NULL");
    add("ALTER TABLE payments MODIFY COLUMN status ENUM('created','success','failed') NOT NULL");
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

    createRazorpayOrder: function (bookingId, userId, amount, orderId, callback) {
        dbRef.query(
            "INSERT INTO payments (bookingId, userId, amount, status, orderId, razorpayOrderId) VALUES (?,?,?,?,?,?)",
            [bookingId, userId, amount, "created", orderId, orderId],
            callback
        );
    },

    markSuccessByOrderId: function (orderId, details, callback) {
        dbRef.query(
            "UPDATE payments SET status='success', transactionId=?, razorpayPaymentId=?, razorpayOrderId=?, signature=?, paymentMethod=?, reason=NULL WHERE orderId=?",
            [
                details.razorpayPaymentId || null,
                details.razorpayPaymentId || null,
                details.razorpayOrderId || null,
                details.signature || null,
                details.paymentMethod || null,
                orderId
            ],
            callback
        );
    },

    markFailedByOrderId: function (orderId, reason, callback) {
        dbRef.query(
            "UPDATE payments SET status='failed', reason=? WHERE orderId=?",
            [reason || "Payment verification failed", orderId],
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
