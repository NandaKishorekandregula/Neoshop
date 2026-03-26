// server/utils/AppError.js

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // This helps us distinguish between our errors and random bugs

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;