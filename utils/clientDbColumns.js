var dbRef    = require("../config/db");
var AppError = require("./AppError");

var cache = null;

function fieldMap(cols) {
    var m = {};
    (cols || []).forEach(function (c) {
        m[String(c.Field).toLowerCase()] = c.Field;
    });
    return m;
}

function pickFirstExisting(map, candidates) {
    for (var i = 0; i < candidates.length; i++) {
        var key = candidates[i].toLowerCase();
        if (map[key]) return map[key];
    }
    return null;
}

function quoteIdent(name) {
    return "`" + String(name).replace(/`/g, "") + "`";
}

/**
 * Resolves schema-variant columns on `clients`.
 * Cached for the process lifetime.
 */
exports.resolveClientColumns = function (cb) {
    if (cache) return cb(null, cache);

    dbRef.query("SHOW COLUMNS FROM clients", function (err, cols) {
        if (err) return cb(err);
        var map = fieldMap(cols);

        var phone = pickFirstExisting(map, ["mobile", "contact", "phone", "telephone", "cell"]);
        var profilePic = pickFirstExisting(map, ["profilepic", "pic1", "ppic", "profile_pic", "photo", "image"]);
        var idProofPic = pickFirstExisting(map, ["idproofpic", "pic2", "idpic", "id_proof_pic", "proofpic"]);
        var pets = pickFirstExisting(map, ["pets", "selpets", "pettypes", "pet_types", "pet"]);
        if (!phone)
            return cb(
                new AppError(
                    "The clients table has no phone/contact column (expected mobile or contact).",
                    500
                )
            );
        if (!profilePic)
            return cb(new AppError("The clients table has no profile picture column.", 500));
        if (!idProofPic)
            return cb(new AppError("The clients table has no ID proof picture column.", 500));
        if (!pets)
            return cb(new AppError("The clients table has no pets column.", 500));
        if (
            !/^[a-zA-Z0-9_$]+$/.test(phone) ||
            !/^[a-zA-Z0-9_$]+$/.test(profilePic) ||
            !/^[a-zA-Z0-9_$]+$/.test(idProofPic) ||
            !/^[a-zA-Z0-9_$]+$/.test(pets)
        )
            return cb(new AppError("Invalid column name from clients table metadata.", 500));

        cache = {
            phone: phone,
            profilePic: profilePic,
            idProofPic: idProofPic,
            pets: pets,
            phoneSql: quoteIdent(phone),
            profilePicSql: quoteIdent(profilePic),
            idProofPicSql: quoteIdent(idProofPic),
            petsSql: quoteIdent(pets)
        };
        if (process.env.NODE_ENV !== "production") {
            console.log("[clients] resolved columns:", {
                phone: phone,
                profilePic: profilePic,
                idProofPic: idProofPic,
                pets: pets
            });
        }
        cb(null, cache);
    });
};
