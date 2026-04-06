var AppError = require("../utils/AppError");
var logger   = require("../config/logger");

/**
 * authorizeRoles(...allowedRoles)
 * Must always run AFTER verifyToken — depends on req.user set by verifyToken.
 */
module.exports = function authorizeRoles(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            logger.warn("Role check failed", {
                meta: {
                    path: req.originalUrl,
                    method: req.method,
                    role: req.user && req.user.role,
                    allowed: allowedRoles
                }
            });
            if (process.env.NODE_ENV !== "production")
                console.warn("[role] forbidden", req.method, req.originalUrl, "role=", req.user && req.user.role);
            return next(new AppError("Access denied. You do not have permission to perform this action.", 403));
        }
        next();
    };
};
