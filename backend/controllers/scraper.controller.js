const { validateLinkedInUrl } = require('../utils/validators');
const { scrapeProfile: scrapeFullProfile, scrapePosts: scrapePostsOnly, scrapeImages: scrapeImagesOnly } = require('../services/scraper.service');
const logger = require('../utils/logger');

/**
 * GET /api/scrape/profile?url=...
 * Full profile scrape (all sections).
 */
async function scrapeProfile(req, res, next) {
    try {
        const url = validateLinkedInUrl(req.query.url);
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Invalid LinkedIn profile URL. Example: https://www.linkedin.com/in/username',
            });
        }

        const skipCache = req.query.fresh === 'true';
        const maxPosts = parseInt(req.query.maxPosts, 10) || 10;

        logger.info(`Scrape request for: ${url}`);
        const data = await scrapeFullProfile(url, { skipCache, maxPosts });

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/scrape/posts?url=...
 * Posts only.
 */
async function scrapePosts(req, res, next) {
    try {
        const url = validateLinkedInUrl(req.query.url);
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Invalid LinkedIn profile URL.',
            });
        }

        const maxPosts = parseInt(req.query.max, 10) || 20;
        logger.info(`Posts scrape request for: ${url}`);
        const data = await scrapePostsOnly(url, maxPosts);

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/scrape/images?url=...
 * All images.
 */
async function scrapeImages(req, res, next) {
    try {
        const url = validateLinkedInUrl(req.query.url);
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Invalid LinkedIn profile URL.',
            });
        }

        logger.info(`Images scrape request for: ${url}`);
        const data = await scrapeImagesOnly(url);

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/scrape/complete?url=...
 * Alias for full profile scrape.
 */
async function scrapeComplete(req, res, next) {
    return scrapeProfile(req, res, next);
}

module.exports = { scrapeProfile, scrapePosts, scrapeImages, scrapeComplete };
