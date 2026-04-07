var Booking  = require("../models/Booking");
var Payment  = require("../models/Payment");
var AppError = require("../utils/AppError");
var Razorpay = require("razorpay");
var crypto   = require("crypto");
var dbRef    = require("../config/db");

function getRazorpayClient() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
        return null;
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

exports.getPublicKey = function (req, res, next) {
    if (!process.env.RAZORPAY_KEY_ID)
        return next(new AppError("Razorpay key id is missing.", 500));
    res.json({ key: process.env.RAZORPAY_KEY_ID });
};

exports.createOrder = function (req, res, next) {
    var bookingId = Number(req.body.bookingId);
    var amount = Number(req.body.amount);
    var userId = req.user.email;

    if (!bookingId || !amount || amount <= 0)
        return next(new AppError("bookingId and amount are required.", 400));

    var razorpay = getRazorpayClient();
    if (!razorpay)
        return next(new AppError("Razorpay keys are missing in environment.", 500));

    Booking.findById(bookingId, function (err, rows) {
        if (err) return next(err);
        if (!rows || rows.length === 0)
            return next(new AppError("Booking not found.", 404));

        var booking = rows[0];
        if (booking.userId !== userId)
            return next(new AppError("You are not authorised to pay for this booking.", 403));
        if (booking.status === "cancelled")
            return next(new AppError("Cannot process payment for a cancelled booking.", 400));
        if (booking.paymentStatus === "paid")
            return next(new AppError("This booking has already been paid.", 400));

        razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: "receipt_" + Date.now()
        }, function (orderErr, order) {
            if (orderErr)
                return next(new AppError(orderErr.error ? orderErr.error.description : "Order creation failed.", 502));

            Payment.createRazorpayOrder(bookingId, userId, amount, order.id, function (saveErr) {
                if (saveErr) return next(saveErr);
                res.json({
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency
                });
            });
        });
    });
};

exports.verifyPayment = function (req, res, next) {
    var userId = req.user.email;
    var bookingId = Number(req.body.bookingId);
    var razorpayOrderId = req.body.razorpay_order_id;
    var razorpayPaymentId = req.body.razorpay_payment_id;
    var razorpaySignature = req.body.razorpay_signature;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
        return next(new AppError("Missing Razorpay verification fields.", 400));

    var generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        Payment.markFailedByOrderId(razorpayOrderId, "Invalid Razorpay signature", function () {});
        return res.status(400).json({ success: false });
    }

    Booking.findById(bookingId, function (err, rows) {
        if (err) return next(err);
        if (!rows || rows.length === 0)
            return next(new AppError("Booking not found.", 404));

        var booking = rows[0];
        if (booking.userId !== userId)
            return next(new AppError("You are not authorised to verify this payment.", 403));

        Payment.markSuccessByOrderId(razorpayOrderId, {
            razorpayPaymentId: razorpayPaymentId,
            razorpayOrderId: razorpayOrderId,
            signature: razorpaySignature,
            paymentMethod: "online"
        }, function (markErr) {
            if (markErr) return next(markErr);
            Booking.updatePaymentAndBookingStatus(bookingId, "paid", "confirmed", function (updErr) {
                if (updErr) return next(updErr);
                res.json({
                    success: true,
                    bookingId: bookingId,
                    paymentId: razorpayPaymentId,
                    orderId: razorpayOrderId
                });
            });
        });
    });
};

exports.getReceipt = function (req, res, next) {
    var bookingId = Number(req.params.bookingId);
    var userId = req.user.email;
    if (!bookingId) return next(new AppError("Invalid bookingId.", 400));

    dbRef.query(
        "SELECT p.bookingId, p.userId, p.amount, p.razorpayPaymentId, p.razorpayOrderId, p.paymentMethod, p.createdAt, b.status AS bookingStatus, b.paymentStatus " +
        "FROM payments p JOIN bookings b ON b.id=p.bookingId " +
        "WHERE p.bookingId=? AND p.userId=? AND p.status='success' ORDER BY p.id DESC LIMIT 1",
        [bookingId, userId],
        function (err, rows) {
            if (err) return next(err);
            if (!rows || rows.length === 0) return next(new AppError("Receipt not found.", 404));
            var r = rows[0];
            res.json({
                status: "success",
                receipt: {
                    bookingId: r.bookingId,
                    userId: r.userId,
                    amount: r.amount,
                    paymentId: r.razorpayPaymentId,
                    orderId: r.razorpayOrderId,
                    method: r.paymentMethod || "N/A",
                    paidAt: r.createdAt,
                    bookingStatus: r.bookingStatus,
                    paymentStatus: r.paymentStatus
                }
            });
        }
    );
};
