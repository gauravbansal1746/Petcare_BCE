var logger = require("../config/logger");

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
    var statusCode = err.statusCode || 500;
    var status     = statusCode >= 500 ? "error" : "fail";

    // Joi validation error — flatten field-level messages into an array
    if (err.isJoi) {
        logger.warn("Validation failed", {
            meta: {
                url:    req.originalUrl,
                method: req.method,
                errors: err.details.map(function (d) { return d.message; })
            }
        });
        return res.status(400).json({
            success: false,
            status:  "fail",
            message: err.details[0] ? err.details[0].message.replace(/['"]/g, "") : "Validation failed.",
            field: err.details[0] && err.details[0].path ? err.details[0].path.join(".") : undefined,
            errors:  err.details.map(function (d) {
                return { field: d.path.join("."), message: d.message.replace(/['"]/g, "") };
            })
        });
    }

    // MySQL value too long (e.g. pwd column shorter than bcrypt hash length)
    if (err.code === "ER_DATA_TOO_LONG") {
        logger.warn("Data too long for column", {
            meta: { url: req.originalUrl, method: req.method, error: err.message }
        });
        return res.status(400).json({
            success: false,
            status:  "fail",
            message: "A value is too long for the database. If this is signup, ensure users.pwd is VARCHAR(255) or longer."
        });
    }

    // MySQL unknown column — usually schema drift vs app code (e.g. renamed fields)
    if (err.code === "ER_BAD_FIELD_ERROR") {
        logger.error("Database column mismatch", {
            meta: { url: req.originalUrl, method: req.method, error: err.message }
        });
        return res.status(500).json({
            success: false,
            status:  "error",
            message:
                "Database schema does not match the application. Check table columns against the README caretakers definition. Detail: " +
                err.message
        });
    }

    // MySQL duplicate entry
    if (err.code === "ER_DUP_ENTRY") {
        logger.warn("Duplicate entry", {
            meta: { url: req.originalUrl, method: req.method, error: err.message }
        });
        return res.status(409).json({
            success: false,
            status:  "fail",
            message: "A record with that value already exists."
        });
    }

    // Known operational error (thrown via AppError)
    if (err.isOperational) {
        logger.warn(err.message, {
            meta: { url: req.originalUrl, method: req.method, statusCode: statusCode }
        });
        return res.status(statusCode).json({
            success: false,
            status:  status,
            message: err.message
        });
    }

    // Unknown / programmer error — log full stack, hide internals from client
    logger.error("Unhandled error", {
        meta: {
            url:     req.originalUrl,
            method:  req.method,
            message: err.message,
            stack:   err.stack
        }
    });
    // Never expose stack traces or internal error details to the client
    return res.status(500).json({
        success: false,
        status:  "error",
        message: "Something went wrong. Please try again later."
    });
};
