var dbRef = require("../config/db");
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

/**
 * Resolves actual MySQL column names on `caretakers` (schemas differ from README).
 * Cached for the process lifetime.
 */
exports.resolveCaretakerColumns = function (cb) {
    if (cache) return cb(null, cache);

    dbRef.query("SHOW COLUMNS FROM caretakers", function (err, cols) {
        if (err) return cb(err);
        var map = fieldMap(cols);

        var name = pickFirstExisting(map, ["name"]);
        var pet = pickFirstExisting(map, ["selpets", "pets", "sel_pets", "caretaker_pets", "pet_types", "pettype"]);
        if (!pet) {
            for (var k in map) {
                if (Object.prototype.hasOwnProperty.call(map, k) && /pet/i.test(map[k])) {
                    pet = map[k];
                    break;
                }
            }
        }

        var phone = pickFirstExisting(map, ["mobile", "contact", "phone", "telephone", "cell"]);
        var address = pickFirstExisting(map, ["address", "firm", "location", "addressline", "business", "office", "addr"]);
        var idProofPic = pickFirstExisting(map, ["idproofpic", "pic", "idpic", "id_pic", "proofpic", "photo", "image"]);

        if (!name)
            return cb(new AppError("The caretakers table has no name column (expected name).", 500));
        if (!pet)
            return cb(new AppError("The caretakers table has no pet-types column (expected selpets or pets).", 500));
        if (!phone)
            return cb(new AppError("The caretakers table has no phone/contact column (expected mobile or contact).", 500));
        if (!address)
            return cb(new AppError("The caretakers table has no address column (expected address or firm).", 500));
        if (!idProofPic)
            return cb(new AppError("The caretakers table has no id-proof picture column (expected idproofpic or pic).", 500));

        if (
            !/^[a-zA-Z0-9_$]+$/.test(name) ||
            !/^[a-zA-Z0-9_$]+$/.test(pet) ||
            !/^[a-zA-Z0-9_$]+$/.test(phone) ||
            !/^[a-zA-Z0-9_$]+$/.test(address) ||
            !/^[a-zA-Z0-9_$]+$/.test(idProofPic)
        )
            return cb(new AppError("Invalid column name from caretakers table metadata.", 500));

        cache = { name: name, pet: pet, phone: phone, address: address, idProofPic: idProofPic };
        if (process.env.NODE_ENV !== "production") {
            console.log("[caretakers] resolved columns:", cache);
        }
        cb(null, cache);
    });
};
