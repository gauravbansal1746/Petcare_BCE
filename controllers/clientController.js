var dbRef                  = require("../config/db");
var AppError               = require("../utils/AppError");
var resolveClientColumns   = require("../utils/clientDbColumns").resolveClientColumns;

exports.createProfile = function (req, res, next) {
    var pic1 = "nopic.png";
    var pic2 = "nopic.png";
    var pending = 0;
    var aborted = false;

    if (process.env.NODE_ENV !== "production") {
        console.log("[profile-client] createProfile files:", Object.keys(req.files || {}));
    }

    function finishIfDone() {
        if (aborted) return;
        if (pending !== 0) return;

        var dataAry = [
            req.body.clientEmail, req.body.clientName, req.body.clientContact,
            req.body.clientAddress, req.body.clientCity, req.body.clientState,
            req.body.clientPin, pic1, pic2, req.body.clientPets
        ];

        dbRef.query("insert into clients values(?,?,?,?,?,?,?,?,?,?)", dataAry, function (err) {
            if (err) return next(err);
            res.status(201).json({ status: "success", message: "Client profile created successfully." });
        });
    }

    if (req.files && req.files.ppic) {
        pending++;
        pic1 = req.files.ppic.name;
        req.files.ppic.mv(process.cwd() + "/public/uploads/" + pic1, function (err) {
            if (aborted) return;
            if (err) {
                aborted = true;
                return next(err);
            }
            pending--;
            finishIfDone();
        });
    }

    if (req.files && req.files.idpic) {
        pending++;
        pic2 = req.files.idpic.name;
        req.files.idpic.mv(process.cwd() + "/public/uploads/" + pic2, function (err) {
            if (aborted) return;
            if (err) {
                aborted = true;
                return next(err);
            }
            pending--;
            finishIfDone();
        });
    }

    // No uploads? Insert immediately.
    finishIfDone();
};

exports.updateProfile = function (req, res, next) {
    var ppic = req.body["hdn-1"] || "nopic.png";
    var idpic = req.body["hdn-2"] || "nopic.png";
    var pending = 0;
    var aborted = false;

    if (process.env.NODE_ENV !== "production") {
        console.log("[profile-client] updateProfile files:", Object.keys(req.files || {}));
    }

    function doUpdate() {
        if (aborted) return;
        if (pending !== 0) return;

        var dataAry = [
            req.body.clientName, req.body.clientContact, req.body.clientAddress,
            req.body.clientCity, req.body.clientState, req.body.clientPin,
            ppic, idpic, req.body.clientPets, req.body.clientEmail
        ];

        resolveClientColumns(function (colErr, ccols) {
            if (colErr) return next(colErr);
            var sql =
                "update clients set name=?," +
                ccols.phoneSql +
                "=?,address=?,city=?,state=?,pin=?," +
                ccols.profilePicSql +
                "=?," +
                ccols.idProofPicSql +
                "=?," +
                ccols.petsSql +
                "=? where email=?";
            dbRef.query(sql, dataAry, function (err) {
                if (err) return next(err);
                res.json({ status: "success", message: "Client profile updated successfully." });
            });
        });
    }

    if (req.files) {
        if (req.files.ppic) {
            pending++;
            ppic = req.files.ppic.name;
            req.files.ppic.mv(process.cwd() + "/public/uploads/" + ppic, function (err) {
                if (aborted) return;
                if (err) {
                    aborted = true;
                    return next(err);
                }
                pending--;
                doUpdate();
            });
        }
        if (req.files.idpic) {
            pending++;
            idpic = req.files.idpic.name;
            req.files.idpic.mv(process.cwd() + "/public/uploads/" + idpic, function (err) {
                if (aborted) return;
                if (err) {
                    aborted = true;
                    return next(err);
                }
                pending--;
                doUpdate();
            });
        }
    }

    // No uploads? Update immediately.
    doUpdate();
};

exports.fetchProfile = function (req, res, next) {
    var email = req.query.emailForServer || req.query.emailforServer;
    if (!email || !String(email).trim())
        return next(new AppError("Email query parameter is required.", 400));
    if (req.user.role !== "admin" && req.user.email !== email && req.user.id !== email)
        return next(new AppError("Access denied. You can only load your own profile.", 403));

    resolveClientColumns(function (colErr, ccols) {
        if (colErr) return next(colErr);
        dbRef.query("select * from clients where email=?", [email.trim()], function (err, rows) {
            if (err) return next(err);
            var normalized = (rows || []).map(function (r) {
                var mobileVal = r && r[ccols.phone] != null ? r[ccols.phone] : (r.mobile || r.contact || "");
                var profilePicVal =
                    r && r[ccols.profilePic] != null && String(r[ccols.profilePic]).trim() !== ""
                        ? r[ccols.profilePic]
                        : "nopic.png";
                var idProofPicVal =
                    r && r[ccols.idProofPic] != null && String(r[ccols.idProofPic]).trim() !== ""
                        ? r[ccols.idProofPic]
                        : "nopic.png";

                return {
                    email:      r.email,
                    name:       r.name,
                    mobile:     mobileVal,
                    address:    r.address,
                    city:       r.city,
                    state:      r.state,
                    pin:        r.pin,
                    pets:       r[ccols.pets],
                    profilepic: profilePicVal,
                    idproofpic: idProofPicVal
                };
            });
            res.json({ status: "success", data: normalized });
        });
    });
};
