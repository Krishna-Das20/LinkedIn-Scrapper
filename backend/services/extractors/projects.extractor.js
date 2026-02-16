/**
 * Projects extractor — Dedicated for /details/projects/ page.
 */
const logger = require('../../utils/logger');
const { randomDelay } = require('../../utils/delay');

async function extractProjects(page) {
    logger.info('Extracting projects from detail page...');

    // We assume the scraper service has already navigated us to /details/projects/

    // Wait for content (either list items or empty state)
    try {
        await page.waitForSelector('.scaffold-finite-scroll, main', { timeout: 10000 });
        await randomDelay(1000, 2000);
    } catch {
        logger.info('No projects content found (timeout)');
        return [];
    }

    const projects = await page.evaluate(() => {
        const results = [];
        // Support both main structure and finite scroll container
        const container = document.querySelector('.scaffold-finite-scroll') || document.querySelector('main');
        if (!container) return [];

        // Select items (robust against SDUI changes)
        // Usually li with pvs-list classes or divs
        // Added .pvs-list__container for broader match
        // Added componentkey for SDUI items
        const items = container.querySelectorAll(
            'li.pvs-list__paged-list-item, li.artdeco-list__item, div[role="listitem"], .pvs-list__container > div, div[componentkey^="entity-collection-item"]'
        );

        items.forEach((item) => {
            try {
                // Extract text content recursively
                const spans = item.querySelectorAll('span[aria-hidden="true"]');
                const texts = Array.from(spans).map(s => s.innerText.trim()).filter(Boolean);

                if (texts.length === 0) return;

                // Typical structure:
                // 0: Project Name
                // 1: Date Range (e.g. "Jan 2023 - Present")
                // 2+: Description or Associated with...

                const entry = {
                    title: texts[0],
                    dateRange: null,
                    description: null,
                    link: item.querySelector('a.link-without-visited-state')?.href || null
                };

                // Heuristic Parsing
                if (texts.length > 1) {
                    // Check if second item looks like a date
                    const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|Present)/i;
                    if (dateRegex.test(texts[1])) {
                        entry.dateRange = texts[1];
                        // Description is everything after
                        if (texts.length > 2) {
                            entry.description = texts.slice(2).join('\n');
                        }
                    } else {
                        // Maybe no date? assume description
                        entry.description = texts.slice(1).join('\n');
                    }
                }

                results.push(entry);
            } catch (e) { }
        });

        return results;
    });

    logger.info(`Extracted ${projects.length} projects`);
    return projects;
}

module.exports = { extractProjects };
