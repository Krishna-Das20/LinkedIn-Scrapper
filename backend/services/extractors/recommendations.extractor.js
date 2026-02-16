/**
 * Recommendations extractor — rewritten with proper waits.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractRecommendations(page) {
    logger.info('Extracting recommendations...');

    await page.evaluate(() => {
        const el = document.querySelector('#recommendations');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await randomDelay(800, 1500);

    const sectionExists = await page.locator('#recommendations').isVisible({ timeout: 3000 }).catch(() => false);
    if (!sectionExists) {
        logger.info('No recommendations section found');
        return { received: [], given: [] };
    }

    const result = await page.evaluate(() => {
        const output = { received: [], given: [] };
        const section = document.querySelector('#recommendations')?.closest('section');
        if (!section) return output;

        // LinkedIn shows tabs: received / given
        const tabPanels = section.querySelectorAll('[role="tabpanel"]');
        const listItems = tabPanels.length > 0
            ? tabPanels[0].querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item')
            : section.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item');

        listItems.forEach((item) => {
            const spans = item.querySelectorAll('span[aria-hidden="true"]');
            const texts = Array.from(spans).map((s) => s.innerText.trim()).filter(Boolean);
            const photo = item.querySelector('img')?.src || null;

            if (texts.length === 0) return;

            // Find the longest text as the recommendation text
            let recText = null;
            let name = texts[0];
            let title = texts.length > 1 ? texts[1] : null;

            for (const t of texts) {
                if (t.length > 80) {
                    recText = t;
                    break;
                }
            }

            output.received.push({ name, title, photo, text: recText });
        });

        return output;
    });

    logger.info(`Extracted ${result.received.length} received recommendations`);
    return result;
}

module.exports = { extractRecommendations };
