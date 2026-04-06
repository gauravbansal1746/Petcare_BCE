var express          = require("express");
var router           = express.Router();
var clientController = require("../controllers/clientController");
var verifyToken      = require("../middlewares/auth");
var authorizeRoles   = require("../middlewares/role");
var validate         = require("../middlewares/validate");
var schemas          = require("../utils/schemas");
var ROLES            = require("../config/roles");

router.get("/profile",
    verifyToken,
    authorizeRoles(ROLES.USER, ROLES.ADMIN),
    clientController.fetchProfile
);

router.post("/profile",
    verifyToken,
    authorizeRoles(ROLES.USER, ROLES.ADMIN),
    validate(schemas.clientProfile),
    clientController.createProfile
);

router.put("/profile",
    verifyToken,
    authorizeRoles(ROLES.USER, ROLES.ADMIN),
    validate(schemas.clientProfile),
    clientController.updateProfile
);

module.exports = router;
