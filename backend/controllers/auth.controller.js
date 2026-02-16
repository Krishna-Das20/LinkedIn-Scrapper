const { login, checkSession } = require('../services/browser.service');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Log in to LinkedIn and save cookies.
 */
async function loginHandler(req, res, next) {
    try {
        logger.info('Login request received');
        const result = await login();
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/auth/status
 * Check if we have a valid LinkedIn session.
 */
async function statusHandler(req, res, next) {
    try {
        const result = await checkSession();
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

module.exports = { loginHandler, statusHandler };
