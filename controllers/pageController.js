var path = require("path");

exports.index = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/index.html"));
};

exports.dashClient = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/dash-client.html"));
};

exports.dashCaretaker = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/dash-caretaker.html"));
};

exports.profileCaretaker = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/profile-caretaker.html"));
};

exports.dashAdmin = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/dash-admin.html"));
};

exports.caretakerFinder = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/caretaker-finder.html"));
};

exports.paymentPage = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/payment.html"));
};

exports.myBookingsPage = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/my-bookings.html"));
};

exports.caretakerBookingsPage = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/caretaker-bookings.html"));
};

exports.adminBookingsPage = function (req, resp) {
    resp.sendFile(path.join(__dirname, "../public/admin-bookings.html"));
};
