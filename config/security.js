var helmet    = require("helmet");
var cors      = require("cors");
var rateLimit = require("express-rate-limit");
var hpp       = require("hpp");

var isProd = process.env.NODE_ENV === "production";

// ── Helmet ────────────────────────────────────────────────────────────────────
// Sets 14 security-related HTTP response headers in one call.
// contentSecurityPolicy is tightened to only allow same-origin resources plus
// the CDNs already used by the frontend HTML files.
var helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", "https://cdn.jsdelivr.net", "https://ajax.googleapis.com", "'unsafe-inline'"],
            styleSrc:    ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
            fontSrc:     ["'self'", "https://fonts.gstatic.com"],
            // Allow Cloudinary images in production uploads
            imgSrc:      ["'self'", "data:", "https://via.placeholder.com", "https://res.cloudinary.com", "https://*.cloudinary.com"],
            connectSrc:  ["'self'"],
            objectSrc:   ["'none'"],
            upgradeInsecureRequests: isProd ? [] : null   // only force HTTPS in production
        }
    },
    // Prevent browsers from MIME-sniffing a response away from the declared content-type
    noSniff: true,
    // Deny framing entirely — prevents clickjacking
    frameguard: { action: "deny" },
    // Remove X-Powered-By: Express header
    hidePoweredBy: true,
    // HTTP Strict Transport Security — only meaningful in production over HTTPS
    hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    // Block pages from loading when XSS is detected (legacy browsers)
    xssFilter: true,
    // Prevent IE from opening downloads in the site context
    ieNoOpen: true,
    // Disable DNS prefetching to reduce information leakage
    dnsPrefetchControl: { allow: false },
    // Referrer policy — only send origin, never full URL
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// Whitelist only the known frontend origin.
// In development ALLOWED_ORIGIN=http://localhost:3000
// In production set ALLOWED_ORIGIN=https://yourdomain.com in the environment.
// In dev, browsers may use localhost or 127.0.0.1 — both must be allowed or fetch fails with CORS.
var allowedOrigins = (process.env.ALLOWED_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map(function (o) { return o.trim(); })
    .filter(Boolean);

var corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error("CORS: origin '" + origin + "' is not allowed."));
    },
    methods:          ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders:   ["Content-Type", "Authorization"],
    exposedHeaders:   ["X-Total-Count"],   // lets the frontend read pagination totals
    credentials:      true,                // allow cookies / Authorization header
    maxAge:           86400                // cache preflight for 24 h — reduces OPTIONS requests
};

var corsMiddleware = cors(corsOptions);

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Three separate limiters with different windows and ceilings:
//   authLimiter     — tightest, protects login/signup from brute-force
//   apiLimiter      — general API cap per authenticated user
//   publicLimiter   — loose cap for unauthenticated public endpoints

var authLimiter = rateLimit({
    windowMs:         15 * 60 * 1000,   // 15 minutes
    max:              20,                // 20 attempts per window per IP
    standardHeaders:  true,              // return RateLimit-* headers
    legacyHeaders:    false,
    message: {
        status:  "fail",
        message: "Too many requests from this IP. Please try again after 15 minutes."
    }
});

var apiLimiter = rateLimit({
    windowMs:         60 * 1000,         // 1 minute
    max:              100,               // 100 requests per minute per IP
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        status:  "fail",
        message: "Too many requests. Please slow down."
    }
});

var publicLimiter = rateLimit({
    windowMs:         60 * 1000,         // 1 minute
    max:              30,                // 30 requests per minute per IP
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        status:  "fail",
        message: "Too many requests. Please slow down."
    }
});

// ── HPP ───────────────────────────────────────────────────────────────────────
// HTTP Parameter Pollution protection — when a query string contains the same
// key multiple times (e.g. ?status=pending&status=confirmed) Express puts them
// in an array. HPP picks the last value and moves duplicates to req.query._ ,
// preventing unexpected array values from reaching controllers.
var hppMiddleware = hpp();

module.exports = {
    helmetMiddleware,
    corsMiddleware,
    corsOptions,
    authLimiter,
    apiLimiter,
    publicLimiter,
    hppMiddleware
};
