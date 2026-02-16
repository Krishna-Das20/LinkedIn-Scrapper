const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const scraperRoutes = require('./routes/scraper.routes');
const authRoutes = require('./routes/auth.routes');
const { closeBrowser } = require('./services/browser.service');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(rateLimiter);

// ── Routes ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'LinkedIn Scraper API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/scrape', scraperRoutes);

// ── Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────
const server = app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
});

// Graceful shutdown
async function gracefulShutdown() {
    logger.info('Shutting down...');
    await closeBrowser();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
