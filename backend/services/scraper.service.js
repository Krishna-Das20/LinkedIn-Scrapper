/**
 * Scraper orchestrator — rewritten with multi-page Detail scraping strategy.
 */
const logger = require('../utils/logger');
const { getPage, getNewPage, ensureLoggedIn, humanScroll, humanDelay } = require('./browser.service');
const cacheService = require('./cache.service');
// const { scrollToBottom } = require('../utils/scroll'); // Deprecated for stealth
const { randomDelay } = require('../utils/delay');
const fs = require('fs');
const path = require('path');

// Ensure debug directory exists
const debugDir = path.resolve(__dirname, '../../debug');
if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
}

// Extractors
const { extractProfile } = require('./extractors/profile.extractor');
const { extractExperience } = require('./extractors/experience.extractor');
const { extractEducation } = require('./extractors/education.extractor');
const { extractSkills } = require('./extractors/skills.extractor');
const { extractRecommendations } = require('./extractors/recommendations.extractor');
const { extractCertifications } = require('./extractors/certifications.extractor');
const { extractPosts } = require('./extractors/posts.extractor');
const { extractContact } = require('./extractors/contact.extractor');
const { extractAccomplishments } = require('./extractors/accomplishments.extractor');
const { extractImages } = require('./extractors/images.extractor');
const { extractProjects } = require('./extractors/projects.extractor');
const { extractInterests } = require('./extractors/interests.extractor');

/**
 * Scrape full profile data using Detail Page strategy.
 */
async function scrapeProfile(profileUrl) {
    // Check cache first
    const cached = cacheService.get(profileUrl);
    if (cached) {
        logger.info('Returning cached data');
        return { ...cached, meta: { ...cached.meta, fromCache: true } };
    }

    const startTime = Date.now();

    // Ensure session is valid
    await ensureLoggedIn();

    const page = await getPage();
    let result = {};

    // Normalize URL (strip trailing slash)
    const baseUrl = profileUrl.replace(/\/$/, '');

    try {
        // ── 1. Main Profile (Header, About, Contact) ──
        logger.info(`Navigating to Main Profile: ${baseUrl}`);
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await waitForPageLoad(page, 'h1, .pv-text-details__left-panel');

        // Check Auth
        checkUrlAuth(page);

        // Scroll to load basic info
        await humanScroll(page);
        await randomDelay(1000, 2000);
        await page.evaluate(() => window.scrollTo(0, 0));

        // Basic Profile Info
        result.profile = await safeExtract('profile', () => extractProfile(page));
        result.contact = await safeExtract('contact', () => extractContact(page));
        // Recommendations often on main page or own tab, but let's grab from main for now or add detail support later
        result.recommendations = await safeExtract('recommendations', () => extractRecommendations(page));
        // Accomplishments (Languages, Honors) - grabbing from main for now as they are small
        result.accomplishments = await safeExtract('accomplishments', () => extractAccomplishments(page));

        // ── 2-7. Detail Pages (Parallel Execution) ──
        // Define all detail extractors
        const detailTasks = [
            { name: 'experience', fn: (p) => extractExperience(p), targetField: 'experience' },
            { name: 'education', fn: (p) => extractEducation(p), targetField: 'education' },
            { name: 'certifications', fn: (p) => extractCertifications(p), targetField: 'certifications' },
            { name: 'skills', fn: (p) => extractSkills(p), targetField: 'skills' },
            { name: 'projects', fn: (p) => extractProjects(p), targetField: 'projects' },
            { name: 'interests', fn: (p) => extractInterests(p), targetField: 'interests' }
        ];

        // Process tasks in batches to manage concurrency
        const CONCURRENCY_LIMIT = 3;
        const taskChunks = [];
        for (let i = 0; i < detailTasks.length; i += CONCURRENCY_LIMIT) {
            taskChunks.push(detailTasks.slice(i, i + CONCURRENCY_LIMIT));
        }

        for (const chunk of taskChunks) {
            logger.info(`Starting parallel batch: ${chunk.map(t => t.name).join(', ')}`);

            const promises = chunk.map(async (task) => {
                let taskPage = null;
                try {
                    // Stagger start times to avoid burst detection
                    await randomDelay(100, 1500);

                    taskPage = await getNewPage();
                    logger.info(`[${task.name}] Tab opened`);

                    await navigateToDetail(taskPage, baseUrl, task.name);

                    const data = await safeExtract(task.name, () => task.fn(taskPage));
                    result[task.targetField] = data;

                    logger.info(`[${task.name}] Done`);
                } catch (err) {
                    logger.error(`[${task.name}] Failed: ${err.message}`);
                } finally {
                    if (taskPage) await taskPage.close();
                }
            });

            await Promise.all(promises);
            await humanDelay(); // Rest between batches
        }

        // ── 8. Posts (Activity) ──
        // extractPosts handles its own navigation to /recent-activity/
        result.posts = await safeExtract('posts', () => extractPosts(page, baseUrl));

        // ── 9. Images (Final Pass) ──
        // Navigate back to main profile to grab any images we missed from the DOM context
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        result.images = await safeExtract('images', () => extractImages(page, result));

        // ── Meta ──
        result.meta = {
            profileUrl: baseUrl,
            scrapedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
            fromCache: false,
        };

        // Cache the result
        cacheService.set(baseUrl, result);
        logger.info(`Scraping complete in ${result.meta.durationMs}ms`);

    } catch (err) {
        logger.error(`Scraping failed: ${err.message}`);
        throw err;
    } finally {
        try { await page.close(); } catch { }
    }

    return result;
}

/**
 * Navigate to a specific detail page.
 */
async function navigateToDetail(page, baseUrl, section) {
    const detailUrl = `${baseUrl}/details/${section}/`;
    logger.info(`Navigating to ${section} details: ${detailUrl}`);

    try {
        await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for a valid indicator (main content or list)
        // If it's a 404 or empty, we might just timeout/fail gracefully
        await page.waitForSelector('main, .scaffold-finite-scroll', { timeout: 10000 });

        await humanDelay();
        await humanScroll(page); // Use human-like scrolling
        await randomDelay(500, 1000);

    } catch (e) {
        logger.warn(`Could not navigate to ${section} detail (might not exist): ${e.message}`);
        // We stay on current page (or error page), extractor will likely return empty
    }
}

async function waitForPageLoad(page, selector) {
    await page.waitForSelector(selector, { timeout: 20000 }).catch(() => logger.warn('Element wait timeout'));
    await randomDelay(2000, 4000);
}

function checkUrlAuth(page) {
    const u = page.url();
    if (u.includes('/login') || u.includes('/authwall')) {
        throw new Error('Not authenticated — session may have expired.');
    }
}

async function safeExtract(name, fn) {
    try {
        return await fn();
    } catch (err) {
        logger.error(`Extractor [${name}] failed: ${err.message}`);
        return name === 'contact' ? null : []; // Basic fallback
    }
}

/**
 * Scrape only posts.
 */
async function scrapePosts(profileUrl, maxPosts = 10) {
    const page = await getPage();
    try {
        const posts = await extractPosts(page, profileUrl, maxPosts);
        return { posts, meta: { profileUrl, scrapedAt: new Date().toISOString() } };
    } finally {
        try { await page.close(); } catch { }
    }
}

/**
 * Scrape only images.
 */
async function scrapeImages(profileUrl) {
    const cached = cacheService.get(profileUrl);
    if (cached?.images) return { images: cached.images, meta: { profileUrl, fromCache: true } };
    const full = await scrapeProfile(profileUrl);
    return { images: full.images, meta: full.meta };
}

module.exports = { scrapeProfile, scrapePosts, scrapeImages };
