const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
    logger.error(err.message, { stack: err.stack });

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

module.exports = errorHandler;
