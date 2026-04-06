var winston = require("winston");
require("winston-daily-rotate-file");
var path = require("path");

var logsDir = path.join(__dirname, "../logs");

// ── Formats ───────────────────────────────────────────────────────────────────

// Console: coloured, human-readable single line
var consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(function (info) {
        return info.timestamp + " [" + info.level + "] " + info.message +
            (info.meta ? " " + JSON.stringify(info.meta) : "");
    })
);

// File: structured JSON — easy to parse, grep, or ship to a log aggregator
var fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// ── Transports ────────────────────────────────────────────────────────────────

// Errors only  →  logs/error-YYYY-MM-DD.log
var errorFileTransport = new winston.transports.DailyRotateFile({
    filename:     path.join(logsDir, "error-%DATE%.log"),
    datePattern:  "YYYY-MM-DD",
    level:        "error",
    maxFiles:     "14d",   // keep 14 days of error logs
    format:       fileFormat
});

// All levels  →  logs/combined-YYYY-MM-DD.log
var combinedFileTransport = new winston.transports.DailyRotateFile({
    filename:    path.join(logsDir, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles:    "7d",    // keep 7 days of combined logs
    format:      fileFormat
});

// Console — only in development
var consoleTransport = new winston.transports.Console({
    format: consoleFormat
});

// ── Logger instance ───────────────────────────────────────────────────────────

var logger = winston.createLogger({
    level:      process.env.LOG_LEVEL || "info",
    transports: [
        errorFileTransport,
        combinedFileTransport,
        consoleTransport
    ]
});

module.exports = logger;
