var express             = require("express");
var router              = express.Router();
var caretakerController = require("../controllers/caretakerController");
var verifyToken         = require("../middlewares/auth");
var authorizeRoles      = require("../middlewares/role");
var validate            = require("../middlewares/validate");
var schemas             = require("../utils/schemas");
var ROLES               = require("../config/roles");

router.get("/",       caretakerController.fetchByFilter);
router.get("/cities", caretakerController.fetchAllCities);
router.get("/profile",
    verifyToken,
    authorizeRoles(ROLES.CARETAKER, ROLES.ADMIN),
    caretakerController.fetchProfile
);

router.post("/profile",
    verifyToken,
    authorizeRoles(ROLES.CARETAKER, ROLES.ADMIN),
    validate(schemas.caretakerProfile),
    caretakerController.createProfile
);

router.put("/profile",
    verifyToken,
    authorizeRoles(ROLES.CARETAKER, ROLES.ADMIN),
    validate(schemas.caretakerProfile),
    caretakerController.updateProfile
);

module.exports = router;
