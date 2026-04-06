var express           = require("express");
var router            = express.Router();
var bookingController = require("../controllers/bookingController");
var verifyToken       = require("../middlewares/auth");
var authorizeRoles    = require("../middlewares/role");
var validate          = require("../middlewares/validate");
var schemas           = require("../utils/schemas");
var ROLES             = require("../config/roles");

router.post(
    "/",
    verifyToken,
    authorizeRoles(ROLES.USER),
    validate(schemas.createBooking),
    bookingController.createBooking
);

router.patch(
    "/:id/status",
    verifyToken,
    authorizeRoles(ROLES.CARETAKER, ROLES.ADMIN),
    validate(schemas.updateBookingStatus),
    bookingController.updateBookingStatus
);

router.get("/my",
    verifyToken,
    authorizeRoles(ROLES.USER, ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    bookingController.getUserBookings
);

router.get("/user",
    verifyToken,
    authorizeRoles(ROLES.USER, ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    bookingController.getUserBookings
);

router.get("/caretaker",
    verifyToken,
    authorizeRoles(ROLES.CARETAKER, ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    bookingController.getCaretakerBookings
);

router.get("/admin",
    verifyToken,
    authorizeRoles(ROLES.ADMIN),
    validate(schemas.paginationQuery, "query"),
    bookingController.getAllBookings
);

router.put(
    "/:id/status",
    verifyToken,
    authorizeRoles(ROLES.CARETAKER, ROLES.ADMIN),
    validate(schemas.updateBookingStatus),
    bookingController.updateBookingStatus
);

module.exports = router;
