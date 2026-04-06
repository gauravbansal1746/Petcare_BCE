var express        = require("express");
var router         = express.Router();
var adminController = require("../controllers/adminController");
var verifyToken    = require("../middlewares/auth");
var authorizeRoles = require("../middlewares/role");
var validate       = require("../middlewares/validate");
var schemas        = require("../utils/schemas");
var ROLES          = require("../config/roles");

router.get("/users",
    verifyToken, authorizeRoles(ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    adminController.fetchAllUsers
);

router.get("/clients",
    verifyToken, authorizeRoles(ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    adminController.fetchAllClients
);

router.get("/caretakers",
    verifyToken, authorizeRoles(ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    adminController.fetchAllCaretakers
);

router.get("/users/block",       verifyToken, authorizeRoles(ROLES.ADMIN), adminController.blockUser);
router.get("/users/resume",      verifyToken, authorizeRoles(ROLES.ADMIN), adminController.resumeUser);
router.get("/clients/delete",    verifyToken, authorizeRoles(ROLES.ADMIN), adminController.deleteClient);
router.get("/caretakers/delete", verifyToken, authorizeRoles(ROLES.ADMIN), adminController.deleteCaretaker);

module.exports = router;
