var dbRef    = require("../config/db");
var bcrypt   = require("bcryptjs");
var jwt      = require("jsonwebtoken");
var AppError = require("../utils/AppError");
var validators = require("../utils/validators");

exports.signup = function (req, res, next) {
    var email    = req.body.emailForServer;
    var password = req.body.pwdForServer;
    var utype    = req.body.typeForServer;
    if (!validators.validateEmail(email))
        return next(new AppError(validators.EMAIL_MESSAGE, 400));
    if (!validators.validatePassword(password))
        return next(new AppError(validators.PASSWORD_MESSAGE, 400));

    dbRef.query("select emailid from users where emailid=?", [email], function (err, rows) {
        if (err) return next(err);
        if (rows.length > 0)
            return next(new AppError("Email already registered.", 409));

        bcrypt.hash(password, 10, function (err, hashedPwd) {
            if (err) return next(err);

            dbRef.query(
                "INSERT INTO users (emailid, pwd, utype, status) VALUES (?,?,?,1)",
                [email, hashedPwd, utype],
                function (err) {
                    if (err) return next(err);
                    res.status(201).json({ status: "success", message: "Signed up successfully." });
                }
            );
        });
    });
};

exports.login = function (req, res, next) {
    var email    = req.body.emailForServer;
    var password = req.body.pwdForServer;
    if (!validators.validateEmail(email))
        return next(new AppError(validators.EMAIL_MESSAGE, 400));
    if (!validators.validatePassword(password))
        return next(new AppError(validators.PASSWORD_MESSAGE, 400));

    dbRef.query("select * from users where emailid=?", [email], function (err, rows) {
        if (err) return next(err);
        if (rows.length === 0)
            return next(new AppError("Invalid email or password.", 401));

        var user = rows[0];

        if (Number(user.status) !== 1)
            return next(new AppError("Your account is blocked.", 403));

        bcrypt.compare(password, user.pwd, function (err, isMatch) {
            if (err) return next(err);
            if (!isMatch)
                return next(new AppError("Invalid email or password.", 401));

            if (!process.env.JWT_SECRET)
                return next(new AppError("Server misconfiguration: JWT secret is not set.", 500));

            var token = jwt.sign(
                { id: user.emailid, email: user.emailid, role: user.utype },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
            );

            res.status(200).json({ status: "success", token: token, role: user.utype });
        });
    });
};

exports.checkEmail = function (req, res, next) {
    dbRef.query("select emailid from users where emailid=?", [req.query.emailForServer], function (err, rows) {
        if (err) return next(err);
        res.json({ status: "success", available: rows.length === 0 });
    });
};
