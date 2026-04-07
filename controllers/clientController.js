var dbRef                  = require("../config/db");
var AppError               = require("../utils/AppError");
var resolveClientColumns   = require("../utils/clientDbColumns").resolveClientColumns;
var cloudinaryUpload       = require("../utils/cloudinary").uploadFile;
var cloudinaryEnabled      = require("../utils/cloudinary").isEnabled;
var validators             = require("../utils/validators");
var fs                     = require("fs");
var canWriteLocalUploads   = process.env.NODE_ENV !== "production";
var localUploadDir         = process.cwd() + "/uploads";

function normalizeUploadPath(value) {
    var raw = value == null ? "" : String(value).trim();
    if (!raw || raw.toLowerCase() === "nopic.png") return "/uploads/nopic.png";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.indexOf("/uploads/") === 0) return raw;
    if (raw.indexOf("/") !== -1) return raw;
    return "/uploads/" + raw;
}

function ensureClientPayload(req, next) {
    var b = req.body || {};
    if (!b.clientName || !b.clientAddress || !b.clientCity || !b.clientState || !b.clientPets)
        return next(new AppError(validators.REQUIRED_MESSAGE, 400)) || true;
    if (!validators.validatePhone(b.clientContact))
        return next(new AppError(validators.PHONE_MESSAGE, 400)) || true;
    if (!validators.validatePin(b.clientPin))
        return next(new AppError(validators.PIN_MESSAGE, 400)) || true;
    return false;
}

exports.createProfile = function (req, res, next) {
    var validationError = ensureClientPayload(req, next);
    if (validationError) return;
    var pic1 = "/uploads/nopic.png";
    var pic2 = "/uploads/nopic.png";
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

        resolveClientColumns(function (colErr, ccols) {
            if (colErr) return next(colErr);
            var sql =
                "insert into clients (email, name, " +
                ccols.phoneSql +
                ", address, city, state, pin, " +
                ccols.profilePicSql +
                ", " +
                ccols.idProofPicSql +
                ", " +
                ccols.petsSql +
                ") values (?,?,?,?,?,?,?,?,?,?)";
            dbRef.query(sql, dataAry, function (err) {
                if (err) return next(err);
                res.status(201).json({ status: "success", message: "Client profile created successfully." });
            });
        });
    }

    function handleUpload(fileKey, subfolder, setOut) {
        if (!req.files || !req.files[fileKey]) return;
        pending++;
        var f = req.files[fileKey];

        if (cloudinaryEnabled()) {
            cloudinaryUpload(f, { subfolder: subfolder }, function (err, out) {
                if (aborted) return;
                if (err) {
                    aborted = true;
                    return next(err);
                }
                setOut(out && out.url ? out.url : "/uploads/nopic.png");
                pending--;
                finishIfDone();
            });
            return;
        }

        if (!canWriteLocalUploads) {
            // On production hosts (e.g. Railway), local filesystem may be ephemeral/read-only.
            // If Cloudinary is not configured, skip file persistence but continue profile save.
            setOut("/uploads/nopic.png");
            pending--;
            finishIfDone();
            return;
        }

        var name = f.name;
        fs.mkdirSync(localUploadDir, { recursive: true });
        f.mv(localUploadDir + "/" + name, function (err) {
            if (aborted) return;
            if (err) {
                aborted = true;
                return next(err);
            }
            setOut("/uploads/" + name);
            pending--;
            finishIfDone();
        });
    }

    handleUpload("ppic", "client/profile", function (v) { pic1 = v; });
    handleUpload("idpic", "client/idproof", function (v) { pic2 = v; });

    // No uploads? Insert immediately.
    finishIfDone();
};

exports.updateProfile = function (req, res, next) {
    var validationError = ensureClientPayload(req, next);
    if (validationError) return;
    var ppic = normalizeUploadPath(req.body["hdn-1"]);
    var idpic = normalizeUploadPath(req.body["hdn-2"]);
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

    function handleUpload(fileKey, subfolder, setOut) {
        if (!req.files || !req.files[fileKey]) return;
        pending++;
        var f = req.files[fileKey];

        if (cloudinaryEnabled()) {
            cloudinaryUpload(f, { subfolder: subfolder }, function (err, out) {
                if (aborted) return;
                if (err) {
                    aborted = true;
                    return next(err);
                }
                setOut(out && out.url ? out.url : "/uploads/nopic.png");
                pending--;
                doUpdate();
            });
            return;
        }

        if (!canWriteLocalUploads) {
            setOut("/uploads/nopic.png");
            pending--;
            doUpdate();
            return;
        }

        var name = f.name;
        fs.mkdirSync(localUploadDir, { recursive: true });
        f.mv(localUploadDir + "/" + name, function (err) {
            if (aborted) return;
            if (err) {
                aborted = true;
                return next(err);
            }
            setOut("/uploads/" + name);
            pending--;
            doUpdate();
        });
    }

    handleUpload("ppic", "client/profile", function (v) { ppic = v; });
    handleUpload("idpic", "client/idproof", function (v) { idpic = v; });

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
                var profilePicVal = normalizeUploadPath(
                    r && r[ccols.profilePic] != null && String(r[ccols.profilePic]).trim() !== ""
                        ? r[ccols.profilePic]
                        : "nopic.png"
                );
                var idProofPicVal = normalizeUploadPath(
                    r && r[ccols.idProofPic] != null && String(r[ccols.idProofPic]).trim() !== ""
                        ? r[ccols.idProofPic]
                        : "nopic.png"
                );

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
