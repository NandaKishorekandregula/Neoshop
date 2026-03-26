// server/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code is provided by the AppError
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle specific MongoDB errors (like duplicate emails) automatically!
    if (err.code === 11000) {
        err.statusCode = 400;
        err.message = 'Duplicate field value entered. Please use another value.';
    }

    // Send the response to the frontend
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        // Only show the messy stack trace if you are on your local machine
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;