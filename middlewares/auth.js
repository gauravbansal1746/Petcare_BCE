var jwt      = require("jsonwebtoken");
var AppError = require("../utils/AppError");
var logger   = require("../config/logger");

module.exports = function verifyToken(req, res, next) {
    var authHeader = req.headers["authorization"];
    var token      = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        logger.warn("Auth rejected: missing token", { meta: { path: req.originalUrl, method: req.method } });
        if (process.env.NODE_ENV !== "production")
            console.warn("[auth] missing token", req.method, req.originalUrl);
        return next(new AppError("Access denied. No token provided.", 401));
    }

    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            logger.warn("Auth rejected: invalid JWT", { meta: { path: req.originalUrl, method: req.method, err: err.message } });
            if (process.env.NODE_ENV !== "production")
                console.warn("[auth] invalid or expired token", req.method, req.originalUrl, err.message);
            return next(new AppError("Invalid or expired token.", 403));
        }

        req.user = decoded; // { id, email, role }
        next();
    });
};
