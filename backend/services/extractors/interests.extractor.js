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
        const container = document.querySelector('.scaffold-finite-scroll') || document.querySelector('main');
        if (!container) return [];

        // Interests might be in a list or grid
        // Interests might be in a list or grid
        // Added componentkey for SDUI items
        const items = container.querySelectorAll(
            'li.pvs-list__paged-list-item, li.artdeco-list__item, div[role="listitem"], .entity-result, div[componentkey^="entity-collection-item"]'
        );

        items.forEach((item) => {
            try {
                // Name is usually the first strong text or aria-hidden span
                const nameEl = item.querySelector('span[aria-hidden="true"]');
                const name = nameEl ? nameEl.innerText.trim() : null;

                if (!name) return;

                const link = item.querySelector('a[data-field="image_link"], a.app-aware-link')?.href || null;

                // Sometimes the "subtitle" (e.g. Followers count) is separated
                const subtitleEl = item.querySelector('.entity-result__secondary-subtitle, .pvs-entity__sub-components');
                const subtitle = subtitleEl ? subtitleEl.innerText.trim() : null;

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
