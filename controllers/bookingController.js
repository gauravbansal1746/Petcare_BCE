var Booking        = require("../models/Booking");
var AppError       = require("../utils/AppError");
var parsePagination = require("../utils/pagination");

exports.createBooking = function (req, res, next) {
    var userId      = req.user.email;
    var caretakerId = req.body.caretakerId;
    var petType     = req.body.petType;
    var city        = req.body.city;
    var date        = req.body.date;
    var time        = req.body.time;

    if (userId === caretakerId)
        return next(new AppError("You cannot book yourself as a caretaker.", 400));

    if (new Date(date) < new Date(new Date().toDateString()))
        return next(new AppError("Booking date cannot be in the past.", 400));

    Booking.create(userId, caretakerId, petType, city, date, time, function (err, result) {
        if (err) return next(err);
        res.status(201).json({
            status:    "success",
            message:   "Booking created successfully.",
            bookingId: result.insertId
        });
    });
};

exports.updateBookingStatus = function (req, res, next) {
    var bookingId = req.params.id;
    var status    = req.body.status;
    var role      = req.user.role;

    if (role === "caretaker" && !["confirmed", "cancelled"].includes(status))
        return next(new AppError("Caretakers can only confirm or cancel a booking.", 403));

    if (role === "caretaker") {
        Booking.updateStatusByCaretaker(bookingId, req.user.email, status, function (err, result) {
            if (err) return next(err);
            if (result.affectedRows === 0)
                return next(new AppError("Booking not found or not assigned to you.", 404));
            res.json({ status: "success", message: "Booking status updated to '" + status + "'." });
        });
    } else {
        Booking.updateStatus(bookingId, status, function (err, result) {
            if (err) return next(err);
            if (result.affectedRows === 0)
                return next(new AppError("Booking not found.", 404));
            res.json({ status: "success", message: "Booking status updated to '" + status + "'." });
        });
    }
};

exports.getUserBookings = function (req, res, next) {
    var pg     = parsePagination(req.query);
    var userId = req.user.email;

    // Run count and data queries in parallel
    var done = 0, total = 0, rows = [], error = null;

    function finish() {
        if (error) return next(error);
        res.json({ status: "success", bookings: rows, pagination: pg.meta(total) });
    }

    Booking.countByUser(userId, function (err, result) {
        if (err) { error = err; }
        else     { total = result[0].total; }
        if (++done === 2) finish();
    });

    Booking.findByUser(userId, pg.limit, pg.offset, function (err, result) {
        if (err) { error = err; }
        else     { rows = result; }
        if (++done === 2) finish();
    });
};

exports.getCaretakerBookings = function (req, res, next) {
    var pg          = parsePagination(req.query);
    var caretakerId = req.user.email;

    var done = 0, total = 0, rows = [], error = null;

    function finish() {
        if (error) return next(error);
        res.json({ status: "success", bookings: rows, pagination: pg.meta(total) });
    }

    Booking.countByCaretaker(caretakerId, function (err, result) {
        if (err) { error = err; }
        else     { total = result[0].total; }
        if (++done === 2) finish();
    });

    Booking.findByCaretaker(caretakerId, pg.limit, pg.offset, function (err, result) {
        if (err) { error = err; }
        else     { rows = result; }
        if (++done === 2) finish();
    });
};

exports.getAllBookings = function (req, res, next) {
    var pg = parsePagination(req.query);
    var done = 0, total = 0, rows = [], error = null;

    function finish() {
        if (error) return next(error);
        res.json({ status: "success", bookings: rows, pagination: pg.meta(total) });
    }

    Booking.countAll(function (err, result) {
        if (err) { error = err; }
        else     { total = result[0].total; }
        if (++done === 2) finish();
    });

    Booking.findAll(pg.limit, pg.offset, function (err, result) {
        if (err) { error = err; }
        else     { rows = result; }
        if (++done === 2) finish();
    });
};
