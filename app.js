require("dotenv").config();
var express    = require("express");
var fileUpload = require("express-fileupload");
var security   = require("./config/security");

var app = express();

// ── Security middleware ───────────────────────────────────────────────────────
// Order matters: helmet and CORS must run before any route or body parser.

// 1. Helmet — sets all security headers in one call
app.get("/", (req, res) => {
    res.send("PetCare API is running 🚀");
  });

app.use(security.helmetMiddleware);

// 2. CORS — must come before routes so preflight OPTIONS requests are handled
app.use(security.corsMiddleware);

// 3. Body parsers — cap payload sizes to prevent large-body DoS attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 4. HPP — sanitise query string parameter pollution before it reaches controllers
app.use(security.hppMiddleware);

// 5. File upload — kept after body parsers
app.use(fileUpload({
    limits:          { fileSize: 2 * 1024 * 1024 },  // 2 MB max per file
    abortOnLimit:    true,                             // reject oversized uploads immediately
    safeFileNames:   true,                             // strip special chars from filenames
    preserveExtension: true
}));

// 6. Static files — served after security headers are set
app.use(express.static("public"));

// 7. Request logger
app.use(require("./middlewares/requestLogger"));

// ── Routes ────────────────────────────────────────────────────────────────────

// Page routes — public, loose rate limit
app.use("/", security.publicLimiter, require("./routes/pages"));

// Auth routes — tightest rate limit (brute-force protection)
app.use("/api/v1/auth",       security.authLimiter,   require("./routes/auth"));

// All other API routes — standard rate limit
app.use("/api/v1/clients",    security.apiLimiter,    require("./routes/client"));
app.use("/api/v1/caretakers", security.apiLimiter,    require("./routes/caretaker"));
app.use("/api/client",        security.apiLimiter,    require("./routes/client"));
app.use("/api/caretaker",     security.apiLimiter,    require("./routes/caretaker"));
app.use("/api/v1/admin",      security.apiLimiter,    require("./routes/admin"));
app.use("/api/v1/bookings",   security.apiLimiter,    require("./routes/booking"));
app.use("/api/v1/payments",   security.apiLimiter,    require("./routes/payment"));
app.use("/api/v1/payment",    security.apiLimiter,    require("./routes/payment"));

// ── Global error handler — must be last ──────────────────────────────────────
app.use(require("./middlewares/errorHandler"));

module.exports = app;
