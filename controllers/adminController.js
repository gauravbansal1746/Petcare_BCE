var dbRef               = require("../config/db");
var AppError            = require("../utils/AppError");
var parsePagination     = require("../utils/pagination");
var resolveClientColumns = require("../utils/clientDbColumns").resolveClientColumns;

function normalizeCaretakerAdminRow(row) {
    if (!row) return row;
    var phone =
        row.mobile != null && String(row.mobile).trim() !== ""
            ? row.mobile
            : row.contact != null && String(row.contact).trim() !== ""
                ? row.contact
                : row.Contact != null && String(row.Contact).trim() !== ""
                    ? row.Contact
                    : row.phone != null && String(row.phone).trim() !== ""
                        ? row.phone
                        : row.telephone != null
                            ? row.telephone
                            : row.cell != null
                                ? row.cell
                                : "";
    return {
        email:      row.email,
        name:       row.name != null ? row.name : row.Name,
        mobile:     phone,
        address:    row.address != null ? row.address : (row.firm != null ? row.firm : row.Firm),
        website:    row.website,
        state:      row.state,
        city:       row.city,
        pin:        row.pin,
        selpets:    row.selpets != null ? row.selpets : row.pets,
        idproofpic: row.idproofpic != null ? row.idproofpic : (row.pic != null ? row.pic : "nopic.png")
    };
}

exports.fetchAllUsers = function (req, res, next) {
    var pg = parsePagination(req.query);

    var done = 0, total = 0, rows = [], error = null;

    function finish() {
        if (error) return next(error);
        res.json({ status: "success", data: rows, pagination: pg.meta(total) });
    }

    dbRef.query("SELECT COUNT(*) AS total FROM users", function (err, result) {
        if (err) { error = err; }
        else     { total = result[0].total; }
        if (++done === 2) finish();
    });

    // Exclude pwd from the list — no need to expose hashes in admin views
    dbRef.query(
        "SELECT emailid, utype, status FROM users ORDER BY emailid LIMIT ? OFFSET ?",
        [pg.limit, pg.offset],
        function (err, result) {
            if (err) { error = err; }
            else     { rows = result; }
            if (++done === 2) finish();
        }
    );
};

exports.fetchAllClients = function (req, res, next) {
    var pg = parsePagination(req.query);

    resolveClientColumns(function (colErr, ccols) {
        if (colErr) return next(colErr);

        var done = 0, total = 0, rows = [], error = null;

        function finish() {
            if (error) return next(error);
            res.json({ status: "success", data: rows, pagination: pg.meta(total) });
        }

        var listSql =
            "SELECT email, name, " +
            ccols.phoneSql +
            " AS mobile, address, city, state, pin, " +
            ccols.profilePicSql +
            " AS profilepic, " +
            ccols.idProofPicSql +
            " AS idproofpic, " +
            ccols.petsSql +
            " AS pets " +
            "FROM clients ORDER BY name LIMIT ? OFFSET ?";

        dbRef.query("SELECT COUNT(*) AS total FROM clients", function (err, result) {
            if (err) { error = err; }
            else     { total = result[0].total; }
            if (++done === 2) finish();
        });

        dbRef.query(listSql, [pg.limit, pg.offset], function (err, result) {
            if (err) { error = err; }
            else     { rows = result; }
            if (++done === 2) finish();
        });
    });
};

exports.blockUser = function (req, res, next) {
    dbRef.query("UPDATE users SET status=0 WHERE emailid=?", [req.query.xEmail], function (err, result) {
        if (err) return next(err);
        if (result.affectedRows === 0) return next(new AppError("User not found.", 404));
        res.json({ status: "success", message: "User blocked successfully." });
    });
};

exports.resumeUser = function (req, res, next) {
    dbRef.query("UPDATE users SET status=1 WHERE emailid=?", [req.query.xEmail], function (err, result) {
        if (err) return next(err);
        if (result.affectedRows === 0) return next(new AppError("User not found.", 404));
        res.json({ status: "success", message: "User resumed successfully." });
    });
};

exports.deleteClient = function (req, res, next) {
    dbRef.query("DELETE FROM clients WHERE email=?", [req.query.xEmail], function (err, result) {
        if (err) return next(err);
        if (result.affectedRows === 0) return next(new AppError("Client not found.", 404));
        res.json({ status: "success", message: "Client deleted successfully." });
    });
};

exports.fetchAllCaretakers = function (req, res, next) {
    var pg = parsePagination(req.query);

    var done = 0, total = 0, rows = [], error = null;

    function finish() {
        if (error) return next(error);
        res.json({ status: "success", data: rows, pagination: pg.meta(total) });
    }

    dbRef.query("SELECT COUNT(*) AS total FROM caretakers", function (err, result) {
        if (err) { error = err; }
        else     { total = result[0].total; }
        if (++done === 2) finish();
    });

    dbRef.query(
        "SELECT * FROM caretakers ORDER BY email LIMIT ? OFFSET ?",
        [pg.limit, pg.offset],
        function (err, result) {
            if (err) { error = err; }
            else     { rows = (result || []).map(normalizeCaretakerAdminRow); }
            if (++done === 2) finish();
        }
    );
};

exports.deleteCaretaker = function (req, res, next) {
    dbRef.query("DELETE FROM caretakers WHERE email=?", [req.query.xEmail], function (err, result) {
        if (err) return next(err);
        if (result.affectedRows === 0) return next(new AppError("Caretaker not found.", 404));
        res.json({ status: "success", message: "Caretaker deleted successfully." });
    });
};
