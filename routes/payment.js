var express           = require("express");
var router            = express.Router();
var paymentController = require("../controllers/paymentController");
var verifyToken       = require("../middlewares/auth");
var authorizeRoles    = require("../middlewares/role");
var validate          = require("../middlewares/validate");
var schemas           = require("../utils/schemas");
var ROLES             = require("../config/roles");

router.post(
    "/:bookingId",
    verifyToken,
    authorizeRoles(ROLES.USER),
    validate(schemas.processPayment),
    paymentController.processPayment
);

module.exports = router;
