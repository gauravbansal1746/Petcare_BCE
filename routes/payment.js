var express           = require("express");
var router            = express.Router();
var paymentController = require("../controllers/paymentController");
var verifyToken       = require("../middlewares/auth");
var authorizeRoles    = require("../middlewares/role");
var validate          = require("../middlewares/validate");
var schemas           = require("../utils/schemas");
var ROLES             = require("../config/roles");

router.get(
    "/public-key",
    verifyToken,
    authorizeRoles(ROLES.USER),
    paymentController.getPublicKey
);

router.post(
    "/create-order",
    verifyToken,
    authorizeRoles(ROLES.USER),
    validate(schemas.createPaymentOrder),
    paymentController.createOrder
);

router.post(
    "/verify",
    verifyToken,
    authorizeRoles(ROLES.USER),
    validate(schemas.verifyPayment),
    paymentController.verifyPayment
);

router.get(
    "/receipt/:bookingId",
    verifyToken,
    authorizeRoles(ROLES.USER),
    paymentController.getReceipt
);

module.exports = router;
