var Joi = require("joi");
var validators = require("./validators");

var ROLES    = ["user", "caretaker", "admin"];
var STATUSES = ["pending", "confirmed", "cancelled", "completed"];

// ── Auth ─────────────────────────────────────────────────────────────────────

exports.signup = Joi.object({
    emailForServer: Joi.string().required().custom(function (value, helpers) {
        return validators.validateEmail(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.EMAIL_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    pwdForServer: Joi.string().required().custom(function (value, helpers) {
        return validators.validatePassword(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.PASSWORD_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    typeForServer: Joi.string().valid(...ROLES).required().messages({
        "any.only":     "typeForServer must be one of: " + ROLES.join(", "),
        "any.required": validators.REQUIRED_MESSAGE
    })
});

exports.login = Joi.object({
    emailForServer: Joi.string().required().custom(function (value, helpers) {
        return validators.validateEmail(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.EMAIL_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    pwdForServer: Joi.string().required().custom(function (value, helpers) {
        return validators.validatePassword(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.PASSWORD_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    })
});

exports.checkEmail = Joi.object({
    emailForServer: Joi.string().email().required().messages({
        "string.email": "emailForServer must be a valid email address.",
        "any.required": "emailForServer is required."
    })
});

// ── Booking ───────────────────────────────────────────────────────────────────

exports.createBooking = Joi.object({
    caretakerId: Joi.string().email().required().messages({
        "string.email": "caretakerId must be a valid email address.",
        "any.required": "caretakerId is required."
    }),
    petType: Joi.string().min(2).max(100).required().messages({
        "any.required": "petType is required."
    }),
    city: Joi.string().min(2).max(100).required().messages({
        "any.required": "city is required."
    }),
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .messages({
            "string.pattern.base": "date must be in YYYY-MM-DD format.",
            "any.required":        "date is required."
        }),
    time: Joi.string()
        .pattern(/^\d{2}:\d{2}$/)
        .required()
        .messages({
            "string.pattern.base": "time must be in HH:MM format.",
            "any.required":        "time is required."
        })
});

exports.updateBookingStatus = Joi.object({
    status: Joi.string().valid(...STATUSES).required().messages({
        "any.only":     "status must be one of: " + STATUSES.join(", "),
        "any.required": "status is required."
    })
});

// ── Payment ───────────────────────────────────────────────────────────────────

exports.processPayment = Joi.object({
    cardNumber: Joi.string()
        .pattern(/^\d{16}$/)
        .default("4242424242424242")
        .messages({
            "string.pattern.base": "cardNumber must be exactly 16 digits.",
            "any.required":        "cardNumber is required."
        }),
    amount: Joi.number().positive().default(499).messages({
        "number.positive": "amount must be a positive number.",
        "any.required":    "amount is required."
    })
});

// ── Client Profile ────────────────────────────────────────────────────────────

exports.clientProfile = Joi.object({
    clientEmail:   Joi.string().required().custom(function (value, helpers) {
        return validators.validateEmail(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.EMAIL_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    clientName:    Joi.string().min(2).max(100).required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    clientContact: Joi.string().required().custom(function (value, helpers) {
        return validators.validatePhone(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.PHONE_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    clientAddress: Joi.string().min(5).required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    clientCity:    Joi.string().required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    clientState:   Joi.string().required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    clientPin:     Joi.string().required().custom(function (value, helpers) {
        return validators.validatePin(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.PIN_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    clientPets:    Joi.string().required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    })
}).options({ allowUnknown: true }); // allow file fields to pass through

// ── Caretaker Profile ─────────────────────────────────────────────────────────

exports.caretakerProfile = Joi.object({
    caretkrEmail:   Joi.string().required().custom(function (value, helpers) {
        return validators.validateEmail(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.EMAIL_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    caretkrName:    Joi.string().min(2).max(100).required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    caretkrContact: Joi.string().required().custom(function (value, helpers) {
        return validators.validatePhone(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.PHONE_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    caretkrAddress: Joi.string().min(5).required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    caretkrWebsite: Joi.string().uri().allow("", null).messages({
        "string.uri": "caretkrWebsite must be a valid URL."
    }),
    stt:            Joi.string().required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    city:           Joi.string().required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    }),
    caretkrPin:     Joi.string().required().custom(function (value, helpers) {
        return validators.validatePin(value) ? value : helpers.error("any.invalid");
    }).messages({
        "any.invalid": validators.PIN_MESSAGE,
        "any.required": validators.REQUIRED_MESSAGE
    }),
    selPets:        Joi.string().required().messages({
        "any.required": validators.REQUIRED_MESSAGE,
        "string.empty": validators.REQUIRED_MESSAGE
    })
}).options({ allowUnknown: true });

// ── Pagination (query string) ─────────────────────────────────────────────────

exports.paginationQuery = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
}).options({ allowUnknown: true }); // allow other query params to pass through
