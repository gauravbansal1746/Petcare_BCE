/**
 * validate(schema, source?)
 *
 * Validates req[source] against a Joi schema and calls next(err) on failure
 * so the global error handler formats the response.
 *
 * source defaults to "body". Pass "query" for GET query-string validation.
 *
 * Usage:
 *   router.post("/signup", validate(schemas.signup), handler)
 *   router.get("/check-email", validate(schemas.checkEmail, "query"), handler)
 */
var AppError = require("../utils/AppError");

module.exports = function validate(schema, source) {
    source = source || "body";

    return function (req, res, next) {
        var result = schema.validate(req[source], { abortEarly: false });

        if (result.error) {
            // Tag the error as a Joi error so the global handler formats it correctly
            result.error.isJoi = true;
            return next(result.error);
        }

        // Replace req[source] with the Joi-coerced values (trimmed, typed correctly)
        req[source] = result.value;
        next();
    };
};
