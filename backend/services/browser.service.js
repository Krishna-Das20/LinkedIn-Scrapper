const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');
const { randomDelay, typeWithDelay } = require('../utils/delay');

// Apply stealth plugin
chromium.use(stealth());

let browserContext = null;

/**
 * Get the singleton persistent browser context.
 * Launches it if not already running.
 */
async function getContext() {
    if (browserContext) return browserContext;

    const userDataDir = path.resolve(config.playwright.userDataDir);

    // Ensure directory exists? Playwright creates it.
    logger.info(`Launching persistent browser context (Headless: ${config.playwright.headless})`);
    logger.info(`User Data Dir: ${userDataDir}`);

    try {
        browserContext = await chromium.launchPersistentContext(userDataDir, {
            headless: config.playwright.headless,
            viewport: { width: 1280 + Math.floor(Math.random() * 100), height: 720 + Math.floor(Math.random() * 100) },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York',
            permissions: ['geolocation'],
            acceptDownloads: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
            ignoreDefaultArgs: ['--enable-automation'], // Stealth: Hides "Chrome is being controlled by automated test software"
        });

        // Stealth: Spoof navigator.webdriver
        await browserContext.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        browserContext.on('close', () => {
            logger.warn('Browser context closed');
            browserContext = null;
        });

        return browserContext;
    } catch (err) {
        logger.error(`Failed to launch browser: ${err.message}`);
        throw err;
    }
}

/**
 * Get a page from the persistent context.
 * Reuses the first page if available, creating a tab-like experience.
 */
async function getPage() {
    const context = await getContext();
    const pages = context.pages();
    if (pages.length > 0) {
        const page = pages[0];
        await page.bringToFront();
        return page;
    }
    return await context.newPage();
}

/**
 * Close the browser context.
 */
async function closeBrowser() {
    if (browserContext) {
        await browserContext.close();
        browserContext = null;
        logger.info('Browser context closed');
    }
}

/**
 * Ensure the browser is logged in to LinkedIn.
 * If not, it attempts to log in using credentials from config,
 * or waits for manual login if running non-headless.
 */
async function ensureLoggedIn() {
    const page = await getPage();

    logger.info('Checking login status...');
    try {
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (e) {
        logger.warn('Initial navigation timeout, checking URL...');
    }

    if (page.url().includes('/feed')) {
        logger.info('Already logged in (session persisted).');
        return true;
    }

    logger.info('Not logged in. Attempting login flow...');

    // Go to login page
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });

    // Check if we are already redirected to feed (sometimes happens)
    if (page.url().includes('/feed')) {
        logger.info('Redirected to feed directly.');
        return true;
    }

    // Try automated login if credentials exist
    if (config.linkedin.email && config.linkedin.password) {
        logger.info('Attempting automated login...');
        try {
            await typeWithDelay(page, '#username', config.linkedin.email);
            await randomDelay(500, 1000);
            await typeWithDelay(page, '#password', config.linkedin.password);
            await randomDelay(500, 1500);
            await page.click('button[type="submit"]');

            await page.waitForURL('**/feed/**', { timeout: 15000 });
            logger.info('Automated login successful.');
            return true;
        } catch (e) {
            logger.warn(`Automated login failed/challenged: ${e.message}`);
        }
    }

    // If automated login failed or no credentials, and we are HEADLESS, we fail.
    // If NOT headless, we wait for user.
    if (!config.playwright.headless) {
        logger.warn('Manual login required. Waiting for user to reach Feed...');
        try {
            await page.waitForURL('**/feed/**', { timeout: 300000 }); // 5 mins
            logger.info('Manual login detected.');
            return true;
        } catch (e) {
            throw new Error('Timeout waiting for manual login.');
        }
    } else {
        throw new Error('Login failed and running in Headless mode. Cannot create session.');
    }
}

/**
 * Login function alias for controller.
 */
async function login() {
    return { success: await ensureLoggedIn() };
}

/**
 * Check session status.
 */
async function checkSession() {
    try {
        const context = await getContext();
        if (!context) return { valid: false };
        const pages = context.pages();
        const page = pages.length > 0 ? pages[0] : await context.newPage();

        // Quick check if we are on Feed or Login
        if (page.url().includes('/feed')) return { valid: true };

        return { valid: false };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

/**
 * Simulates human-like scrolling behavior.
 * Scrolls down in variable steps with pauses.
 */
async function humanScroll(page) {
    try {
        const height = await page.evaluate(() => document.body.scrollHeight);
        let currentScroll = 0;

        while (currentScroll < height) {
            const step = 300 + Math.floor(Math.random() * 400); // Scroll 300-700px
            currentScroll += step;
            await page.mouse.wheel(0, step);

            // Random pause between scrolls (reading time)
            if (Math.random() > 0.7) {
                await randomDelay(800, 2000);
            } else {
                await randomDelay(100, 400);
            }

            // Occasionally scroll up a bit (micro-browsing)
            if (Math.random() > 0.9) {
                await page.mouse.wheel(0, -100);
                await randomDelay(300, 600);
            }
        }
    } catch (e) {
        logger.warn(`Human scroll failed: ${e.message}`);
    }
}

/**
 * Enhanced random delay.
 */
async function humanDelay() {
    await randomDelay(1000, 4000);
}

module.exports = {
    getContext,
    getPage,
    closeBrowser,
    ensureLoggedIn,
    login,
    checkSession,
    humanScroll,
    humanDelay
};
