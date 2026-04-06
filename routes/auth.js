var express        = require("express");
var router         = express.Router();
var authController = require("../controllers/authController");
var validate       = require("../middlewares/validate");
var schemas        = require("../utils/schemas");

router.post("/signup", validate(schemas.signup),               authController.signup);
router.post("/login",  validate(schemas.login),                authController.login);
router.get("/check-email", validate(schemas.checkEmail, "query"), authController.checkEmail);

module.exports = router;
