var Joi = require("joi");

var ROLES    = ["user", "caretaker", "admin"];
var STATUSES = ["pending", "confirmed", "cancelled", "completed"];

// ── Auth ─────────────────────────────────────────────────────────────────────

exports.signup = Joi.object({
    emailForServer: Joi.string().email().required().messages({
        "string.email": "emailForServer must be a valid email address.",
        "any.required": "emailForServer is required."
    }),
    pwdForServer: Joi.string().min(6).required().messages({
        "string.min":   "pwdForServer must be at least 6 characters.",
        "any.required": "pwdForServer is required."
    }),
    typeForServer: Joi.string().valid(...ROLES).required().messages({
        "any.only":     "typeForServer must be one of: " + ROLES.join(", "),
        "any.required": "typeForServer is required."
    })
});

exports.login = Joi.object({
    emailForServer: Joi.string().email().required().messages({
        "string.email": "emailForServer must be a valid email address.",
        "any.required": "emailForServer is required."
    }),
    pwdForServer: Joi.string().required().messages({
        "any.required": "pwdForServer is required."
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
    clientEmail:   Joi.string().email().required(),
    clientName:    Joi.string().min(2).max(100).required(),
    clientContact: Joi.string().pattern(/^\d{10}$/).required().messages({
        "string.pattern.base": "clientContact must be a 10-digit number."
    }),
    clientAddress: Joi.string().min(5).required(),
    clientCity:    Joi.string().required(),
    clientState:   Joi.string().required(),
    clientPin:     Joi.string().pattern(/^\d{6}$/).required().messages({
        "string.pattern.base": "clientPin must be a 6-digit number."
    }),
    clientPets:    Joi.string().allow("", null)
}).options({ allowUnknown: true }); // allow file fields to pass through

// ── Caretaker Profile ─────────────────────────────────────────────────────────

exports.caretakerProfile = Joi.object({
    caretkrEmail:   Joi.string().email().required(),
    caretkrName:    Joi.string().min(2).max(100).required(),
    caretkrContact: Joi.string().pattern(/^\d{10}$/).required().messages({
        "string.pattern.base": "caretkrContact must be a 10-digit number."
    }),
    caretkrAddress: Joi.string().min(5).required(),
    caretkrWebsite: Joi.string().uri().allow("", null).messages({
        "string.uri": "caretkrWebsite must be a valid URL."
    }),
    stt:            Joi.string().required(),
    city:           Joi.string().required(),
    caretkrPin:     Joi.string().pattern(/^\d{6}$/).required().messages({
        "string.pattern.base": "caretkrPin must be a 6-digit number."
    }),
    selPets:        Joi.string().allow("", null)
}).options({ allowUnknown: true });

// ── Pagination (query string) ─────────────────────────────────────────────────

exports.paginationQuery = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
}).options({ allowUnknown: true }); // allow other query params to pass through
