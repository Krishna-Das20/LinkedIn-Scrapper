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
        const container = document.querySelector('.scaffold-finite-scroll') ||
            document.querySelector('[data-testid="lazy-column"]') ||
            document.querySelector('main');

        if (!container) return [];

        // Strategy: Get all direct children of the lazy list or container
        // Filter those that actually contain content (not just dividers)
        const items = Array.from(container.children);

        items.forEach((item) => {
            try {
                // Skip dividers/separators
                if (item.tagName === 'HR' || item.clientHeight < 10) return;

                // Get all text content efficiently
                const textRaw = item.innerText || '';
                const lines = textRaw.split('\n').map(l => l.trim()).filter(Boolean);

                // Filter out common UI noise
                const cleanLines = lines.filter(l =>
                    !['Show more', 'Show less', 'Projects', 'Skills:'].includes(l) &&
                    !l.match(/^See .* members/)
                );

                if (cleanLines.length < 2) return; // Need at least Title and something else

                // Heuristic Mapping
                // 0: Title
                // 1: Date or Subtitle
                // ... Description ...

                const entry = {
                    title: cleanLines[0],
                    dateRange: null,
                    description: null,
                    link: item.querySelector('a')?.href || null,
                    skills: null
                };

                // Remove Title from lines to process rest
                cleanLines.shift();

                // Check for Date in remaining lines
                const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}.*|Present)/i;
                if (cleanLines.length > 0 && dateRegex.test(cleanLines[0])) {
                    entry.dateRange = cleanLines[0];
                    cleanLines.shift();
                }

                // Check for Skills (often starts with "Skills:")
                const skillsIndex = cleanLines.findIndex(l => l.startsWith('Skills:'));
                if (skillsIndex !== -1) {
                    entry.skills = cleanLines[skillsIndex].replace('Skills:', '').trim();
                    cleanLines.splice(skillsIndex, 1);
                }

                // Remaining is description
                if (cleanLines.length > 0) {
                    entry.description = cleanLines.join('\n');
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
