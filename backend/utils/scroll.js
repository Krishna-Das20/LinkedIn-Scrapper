/**
 * Smart scrolling helpers that mimic human scroll behaviour.
 */
const { randomDelay } = require('./delay');

/**
 * Scroll the page to the bottom incrementally, triggering lazy-loaded content.
 * @param {import('playwright').Page} page
 * @param {number} maxScrolls - Maximum number of scroll steps
 */
async function scrollToBottom(page, maxScrolls = 15) {
    let previousHeight = 0;

    for (let i = 0; i < maxScrolls; i++) {
        try {
            const currentHeight = await page.evaluate(() => document.body.scrollHeight);
            if (currentHeight === previousHeight) break;
            previousHeight = currentHeight;

            const viewportHeight = await page.evaluate(() => window.innerHeight);
            const scrollAmount = Math.floor(viewportHeight * (0.6 + Math.random() * 0.3));

            await page.evaluate((amount) => {
                window.scrollBy({ top: amount, behavior: 'smooth' });
            }, scrollAmount);

            await randomDelay(1000, 2500);
        } catch (err) {
            // Context destroyed by navigation — stop scrolling gracefully
            break;
        }
    }
}

/**
 * Scroll to a specific section by its ID anchor.
 * @param {import('playwright').Page} page
 * @param {string} sectionId - e.g. 'experience', 'education', 'skills'
 */
async function scrollToSection(page, sectionId) {
    try {
        const exists = await page.$(`#${sectionId}`);
        if (exists) {
            await page.evaluate((id) => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, sectionId);
            await randomDelay(800, 1500);
        }
    } catch {
        // Section may not exist on this profile
    }
}

/**
 * Click all "Show more" / "Show all" buttons in the current view to expand content.
 * @param {import('playwright').Page} page
 */
async function expandAllSections(page) {
    const showMoreSelectors = [
        'button.inline-show-more-text__button',
        'button[aria-label*="Show more"]',
        'button[aria-label*="show more"]',
        '.pvs-list__footer-wrapper button',
        '.inline-show-more-text__button--light',
    ];

    for (const selector of showMoreSelectors) {
        const buttons = await page.$$(selector);
        for (const btn of buttons) {
            try {
                const isVisible = await btn.isVisible();
                if (isVisible) {
                    await btn.click();
                    await randomDelay(500, 1200);
                }
            } catch {
                // Button may have become stale
            }
        }
    }
}

module.exports = { scrollToBottom, scrollToSection, expandAllSections };
