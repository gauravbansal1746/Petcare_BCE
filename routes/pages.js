var express = require("express");
var router = express.Router();
var pageController = require("../controllers/pageController");

router.get("/", pageController.index);
router.get("/dclient", pageController.dashClient);
router.get("/dcaretaker", pageController.dashCaretaker);
router.get("/dcaretkr-profile", pageController.profileCaretaker);
router.get("/dash-admin", pageController.dashAdmin);
router.get("/caretkr-finder", pageController.caretakerFinder);
router.get("/payment", pageController.paymentPage);
router.get("/my-bookings", pageController.myBookingsPage);
router.get("/caretaker-bookings", pageController.caretakerBookingsPage);
router.get("/admin-bookings", pageController.adminBookingsPage);

module.exports = router;
