/**
 * AppError
 *
 * Throw this anywhere in the app to produce a consistent, structured error.
 * The global error handler in middlewares/errorHandler.js catches it and
 * formats the response automatically.
 *
 * Usage:
 *   throw new AppError("Booking not found.", 404);
 *   next(new AppError("Access denied.", 403));
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // distinguishes known app errors from unexpected crashes
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
