var Booking         = require("../models/Booking");
var Payment         = require("../models/Payment");
var simulatePayment = require("../utils/paymentSimulator");
var AppError        = require("../utils/AppError");

exports.processPayment = function (req, res, next) {
    var bookingId  = req.params.bookingId;
    var userId     = req.user.email;
    var cardNumber = req.body.cardNumber;
    var amount     = req.body.amount; // already a number — Joi coerced it

    Booking.findById(bookingId, function (err, rows) {
        if (err) return next(err);
        if (rows.length === 0)
            return next(new AppError("Booking not found.", 404));

        var booking = rows[0];

        if (booking.userId !== userId)
            return next(new AppError("You are not authorised to pay for this booking.", 403));

        if (booking.status === "cancelled")
            return next(new AppError("Cannot process payment for a cancelled booking.", 400));

        if (booking.paymentStatus === "paid")
            return next(new AppError("This booking has already been paid.", 400));

        var result = simulatePayment(cardNumber);

        if (result.success) {
            Payment.create(bookingId, userId, amount, "success", result.transactionId, result.reason, function (err) {
                if (err) return next(err);
                Booking.updatePaymentAndBookingStatus(bookingId, "paid", "confirmed", function (err) {
                    if (err) return next(err);
                    res.status(200).json({
                        status:        "success",
                        message:       "Payment successful. Booking confirmed.",
                        transactionId: result.transactionId,
                        bookingStatus: "confirmed",
                        paymentStatus: "paid"
                    });
                });
            });
        } else {
            Payment.create(bookingId, userId, amount, "failed", null, result.reason, function (err) {
                if (err) return next(err);
                Booking.updatePaymentAndBookingStatus(bookingId, "pending", "pending", function (err) {
                    if (err) return next(err);
                    res.status(402).json({
                        status:        "fail",
                        message:       "Payment failed. Booking remains pending.",
                        reason:        result.reason,
                        bookingStatus: "pending",
                        paymentStatus: "pending"
                    });
                });
            });
        }
    });
};
