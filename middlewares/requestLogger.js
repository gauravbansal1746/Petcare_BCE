var logger = require("../config/logger");

/**
 * requestLogger
 *
 * Logs every inbound HTTP request once the response finishes.
 * Skips static asset requests (anything not under /api) to keep logs clean.
 *
 * Log fields:
 *   method       GET / POST / PATCH …
 *   url          /api/v1/auth/login
 *   status       200 / 400 / 500 …
 *   responseTime response time in ms
 *   user         email from JWT if authenticated, "anonymous" otherwise
 *   ip           client IP address
 */
module.exports = function requestLogger(req, res, next) {
    // Skip static file requests — only log API calls
    if (!req.path.startsWith("/api")) return next();

    var startTime = Date.now();

    res.on("finish", function () {
        var responseTime = Date.now() - startTime;
        var level        = res.statusCode >= 500 ? "error"
                         : res.statusCode >= 400 ? "warn"
                         : "info";

        logger[level]("HTTP " + req.method + " " + req.originalUrl, {
            meta: {
                method:       req.method,
                url:          req.originalUrl,
                status:       res.statusCode,
                responseTime: responseTime + "ms",
                user:         (req.user && req.user.email) || "anonymous",
                ip:           req.ip || req.connection.remoteAddress
            }
        });
    });

    next();
};
