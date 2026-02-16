/**
 * Interests extractor — Dedicated for /details/interests/ page.
 */
const logger = require('../../utils/logger');
const { randomDelay } = require('../../utils/delay');

async function extractInterests(page) {
    logger.info('Extracting interests from detail page...');

    // Wait for content
    try {
        await page.waitForSelector('.scaffold-finite-scroll, main', { timeout: 10000 });
        await randomDelay(1000, 2000);
    } catch {
        logger.info('No interests content found (timeout)');
        return [];
    }

    const interests = await page.evaluate(() => {
        const results = [];
        const container = document.querySelector('.scaffold-finite-scroll') ||
            document.querySelector('[data-testid="lazy-column"]') ||
            document.querySelector('main');

        if (!container) return [];

        const items = Array.from(container.children);

        items.forEach((item) => {
            try {
                if (item.tagName === 'HR' || item.clientHeight < 10) return;

                const textRaw = item.innerText || '';
                const lines = textRaw.split('\n').map(l => l.trim()).filter(Boolean);

                // Filter noise
                const cleanLines = lines.filter(l => !['Show more', 'Show less', 'Interests'].includes(l));

                if (cleanLines.length === 0) return;

                const link = item.querySelector('a')?.href || null;
                const name = cleanLines[0];
                const subtitle = cleanLines.length > 1 ? cleanLines[1] : null;

                results.push({
                    name,
                    link,
                    subtitle
                });
            } catch (e) { }
        });

        return results;
    });

    logger.info(`Extracted ${interests.length} interests`);
    return interests;
}

module.exports = { extractInterests };
