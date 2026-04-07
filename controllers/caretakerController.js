var dbRef                   = require("../config/db");
var AppError                = require("../utils/AppError");
var resolveCaretakerColumns = require("../utils/caretakerDbColumns").resolveCaretakerColumns;
var cloudinaryUpload        = require("../utils/cloudinary").uploadFile;
var cloudinaryEnabled       = require("../utils/cloudinary").isEnabled;
var validators              = require("../utils/validators");
var fs                      = require("fs");
var canWriteLocalUploads    = process.env.NODE_ENV !== "production";
var localUploadDir          = process.cwd() + "/uploads";

function normalizeUploadPath(value) {
    var raw = value == null ? "" : String(value).trim();
    if (!raw || raw.toLowerCase() === "nopic.png") return "/uploads/nopic.png";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.indexOf("/uploads/") === 0) return raw;
    if (raw.indexOf("/") !== -1) return raw;
    return "/uploads/" + raw;
}

function ensureCaretakerPayload(req, next) {
    var b = req.body || {};
    if (!b.caretkrName || !b.caretkrAddress || !b.stt || !b.city || !b.selPets)
        return next(new AppError(validators.REQUIRED_MESSAGE, 400)) || true;
    if (!validators.validatePhone(b.caretkrContact))
        return next(new AppError(validators.PHONE_MESSAGE, 400)) || true;
    if (!validators.validatePin(b.caretkrPin))
        return next(new AppError(validators.PIN_MESSAGE, 400)) || true;
    return false;
}

exports.createProfile = function (req, res, next) {
    if (ensureCaretakerPayload(req, next)) return;
    var pic = "/uploads/nopic.png";
    var aborted = false;

    if (process.env.NODE_ENV !== "production") {
        console.log("[profile-caretaker] createProfile files:", Object.keys(req.files || {}));
    }

    function doInsert() {
        if (aborted) return;
        var dataAry = [
            req.body.caretkrEmail, req.body.caretkrName, req.body.caretkrContact,
            req.body.caretkrAddress, req.body.caretkrWebsite, req.body.stt,
            req.body.city.trim(), req.body.caretkrPin, req.body.selPets, pic
        ];

        resolveCaretakerColumns(function (colErr, cols) {
            if (colErr) return next(colErr);
            var nameCol       = "`" + cols.name + "`";
            var phoneCol      = "`" + cols.phone + "`";
            var addressCol    = "`" + cols.address + "`";
            var petCol        = "`" + cols.pet + "`";
            var idProofPicCol = "`" + cols.idProofPic + "`";
            var sql =
                "insert into caretakers (email, " +
                nameCol +
                ", " +
                phoneCol +
                ", " +
                addressCol +
                ", website, state, city, pin, " +
                petCol +
                ", " +
                idProofPicCol +
                ") values (?,?,?,?,?,?,?,?,?,?)";
            dbRef.query(sql, dataAry, function (err) {
                if (aborted) return;
                if (err) return next(err);
                res.status(201).json({ status: "success", message: "Caretaker profile created successfully." });
            });
        });
    }

    if (req.files && req.files.idpic) {
        var f = req.files.idpic;
        if (cloudinaryEnabled()) {
            cloudinaryUpload(f, { subfolder: "caretaker/idproof" }, function (err, out) {
                if (aborted) return;
                if (err) {
                    aborted = true;
                    return next(err);
                }
                pic = out && out.url ? out.url : "/uploads/nopic.png";
                doInsert();
            });
            return;
        }

        if (!canWriteLocalUploads) {
            pic = "/uploads/nopic.png";
            doInsert();
            return;
        }

        pic = "/uploads/" + f.name;
        fs.mkdirSync(localUploadDir, { recursive: true });
        f.mv(localUploadDir + "/" + f.name, function (err) {
            if (aborted) return;
            if (err) {
                aborted = true;
                return next(err);
            }
            doInsert();
        });
    } else {
        doInsert();
    }
};

exports.updateProfile = function (req, res, next) {
    if (ensureCaretakerPayload(req, next)) return;
    var picName = normalizeUploadPath(req.body.hdn);

    if (process.env.NODE_ENV !== "production") {
        console.log("[profile-caretaker] updateProfile files:", Object.keys(req.files || {}));
    }

    function doUpdate() {
        var dataAry = [
            req.body.caretkrName, req.body.caretkrContact, req.body.caretkrAddress,
            req.body.caretkrWebsite, req.body.stt, req.body.city,
            req.body.caretkrPin, req.body.selPets, picName, req.body.caretkrEmail
        ];

        resolveCaretakerColumns(function (colErr, cols) {
            if (colErr) return next(colErr);
            var nameCol       = "`" + cols.name + "`";
            var phoneCol      = "`" + cols.phone + "`";
            var addressCol    = "`" + cols.address + "`";
            var petCol        = "`" + cols.pet + "`";
            var idProofPicCol = "`" + cols.idProofPic + "`";
            var sql =
                "update caretakers set " + nameCol + "=?," +
                phoneCol +
                "=?," +
                addressCol +
                "=?,website=?,state=?,city=?,pin=?," +
                petCol +
                "=?," +
                idProofPicCol +
                "=? where email=?";
            dbRef.query(sql, dataAry, function (err) {
                if (err) return next(err);
                res.json({ status: "success", message: "Caretaker profile updated successfully." });
            });
        });
    }

    // Caretaker profile form uploads only `idpic` (not `ppic`)
    if (req.files && req.files.idpic) {
        var f = req.files.idpic;
        if (cloudinaryEnabled()) {
            cloudinaryUpload(f, { subfolder: "caretaker/idproof" }, function (err, out) {
                if (err) return next(err);
                picName = out && out.url ? out.url : "/uploads/nopic.png";
                doUpdate();
            });
            return;
        }
        if (!canWriteLocalUploads) {
            picName = "/uploads/nopic.png";
            doUpdate();
            return;
        }

        picName = "/uploads/" + f.name;
        fs.mkdirSync(localUploadDir, { recursive: true });
        f.mv(localUploadDir + "/" + f.name, function (err) {
            if (err) return next(err);
            doUpdate();
        });
    } else {
        doUpdate();
    }
};

exports.fetchProfile = function (req, res, next) {
    var email = req.query.emailForServer || req.query.emailforServer;
    if (!email || !String(email).trim())
        return next(new AppError("Email query parameter is required.", 400));
    if (req.user.role !== "admin" && req.user.email !== email && req.user.id !== email)
        return next(new AppError("Access denied. You can only load your own profile.", 403));

    resolveCaretakerColumns(function (colErr, cols) {
        if (colErr) return next(colErr);
        dbRef.query("select * from caretakers where email=?", [email.trim()], function (err, rows) {
            if (err) return next(err);
            var normalized = (rows || []).map(function (r) {
                var nameVal =
                    r && r[cols.name] != null
                        ? r[cols.name]
                        : (r.name != null ? r.name : r.Name);
                var phoneVal =
                    r && r[cols.phone] != null
                        ? r[cols.phone]
                        : (r.mobile || r.contact || r.Contact || "");
                var addressVal =
                    r && r[cols.address] != null
                        ? r[cols.address]
                        : (r.address || r.firm || r.Firm || "");
                var petsVal =
                    r && r[cols.pet] != null
                        ? r[cols.pet]
                        : (r.selpets || r.pets || r.Pets || "");
                var idProofVal = normalizeUploadPath(
                    r && r[cols.idProofPic] != null && String(r[cols.idProofPic]).trim() !== ""
                        ? r[cols.idProofPic]
                        : (r.idproofpic || r.pic || r.Pic || "nopic.png")
                );

                return {
                    email:      r.email,
                    name:       nameVal || "",
                    mobile:     phoneVal || "",
                    address:    addressVal || "",
                    website:    r.website || "",
                    state:      r.state || "",
                    city:       r.city || "",
                    pin:        r.pin || "",
                    selpets:    petsVal || "",
                    idproofpic: idProofVal
                };
            });
            res.json({ status: "success", data: normalized });
        });
    });
};

exports.fetchAllCities = function (req, res, next) {
    dbRef.query(
        "SELECT DISTINCT city FROM caretakers WHERE city IS NOT NULL AND city <> '' ORDER BY city",
        function (err, rows) {
            if (err) return next(err);
            var list = (rows || []).map(function (r) {
                var c = r && r.city != null ? String(r.city).trim() : "";
                return c ? { city: c } : null;
            }).filter(Boolean);
            if (process.env.NODE_ENV !== "production")
                console.log("[caretakers/cities] returning", list.length, "cities");
            res.json({ status: "success", data: list });
        }
    );
};

function normalizeFinderRow(row, cols) {
    if (!row) return row;
    var phoneVal =
        cols && cols.phone && row[cols.phone] != null
            ? row[cols.phone]
            : (row.mobile || row.contact || row.Contact || "");
    var petsVal =
        cols && cols.pet && row[cols.pet] != null
            ? row[cols.pet]
            : (row.selpets || row.pets || "");
    var idProofVal = normalizeUploadPath(
        cols && cols.idProofPic && row[cols.idProofPic] != null
            ? row[cols.idProofPic]
            : (row.idproofpic || row.pic || row.Pic || "nopic.png")
    );

    return {
        email:      row.email,
        name:       cols && cols.name && row[cols.name] != null ? row[cols.name] : (row.name || row.Name),
        mobile:     phoneVal,
        city:       row.city,
        state:      row.state,
        selpets:    petsVal,
        idproofpic: idProofVal
    };
}

exports.fetchByFilter = function (req, res, next) {
    var cityRaw =
        req.query.cityforserver ||
        req.query.cityForServer ||
        req.query.city;
    var petRaw =
        req.query.petforserver ||
        req.query.petForServer ||
        req.query.pet ||
        req.query.petType;
    if (cityRaw == null || petRaw == null || !String(cityRaw).trim() || !String(petRaw).trim())
        return next(new AppError("Query parameters city and pet are required (e.g. cityforserver & petforserver).", 400));

    var city = String(cityRaw).trim();
    var pet  = "%" + String(petRaw).trim() + "%";
    var pg   = require("../utils/pagination")(req.query);

    if (process.env.NODE_ENV !== "production") {
        console.log("[caretakers/search] request", {
            city: city,
            petPattern: pet,
            pagination: { limit: pg.limit, offset: pg.offset },
            rawQuery: req.query
        });
    }

    resolveCaretakerColumns(function (errCol, cols) {
        if (errCol) return next(errCol);

        var petCol = cols.pet;
        var colSql = "`" + petCol + "`";
        var done = 0, total = 0, rows = [], error = null;

        function finish() {
            if (error) return next(error);
            if (process.env.NODE_ENV !== "production") {
                console.log("[caretakers/search] response", { total: total, returned: rows.length, petColumn: petCol });
            }
            res.json({ status: "success", data: rows, pagination: pg.meta(total) });
        }

        var countSql =
            "SELECT COUNT(*) AS total FROM caretakers WHERE city=? AND " + colSql + " LIKE ?";
        var listSql =
            "SELECT * FROM caretakers WHERE city=? AND " + colSql + " LIKE ? LIMIT ? OFFSET ?";

        dbRef.query(countSql, [city, pet], function (err, result) {
            if (err) { error = err; }
            else     { total = result[0].total; }
            if (++done === 2) finish();
        });

        dbRef.query(listSql, [city, pet, pg.limit, pg.offset], function (err, result) {
            if (err) { error = err; }
            else     { rows = (result || []).map(function (r) { return normalizeFinderRow(r, cols); }); }
            if (++done === 2) finish();
        });
    });
};
