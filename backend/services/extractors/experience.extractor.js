/**
 * Experience extractor — rewritten for SDUI with Detail Page support and DIV-based LazyColumn.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractExperience(page) {
    logger.info('Extracting experience...');

    // 1. Check if we are already on a detail page or need to navigate/scroll
    const isDetailPage = page.url().includes('/details/experience');

    if (!isDetailPage) {
        // Scroll to experience section on main profile
        await page.evaluate(() => {
            const el = document.querySelector('[data-view-name="profile-card-experience"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await randomDelay(800, 1500);

        // Try "Show all experiences" to get to the cleaner detail view if possible
        try {
            const showAll = page.locator(
                '[data-view-name="profile-card-experience"] ~ .pvs-list__footer-wrapper a, section:has([data-view-name="profile-card-experience"]) .pvs-list__footer-wrapper a'
            ).first();

            if (await showAll.isVisible({ timeout: 2000 }).catch(() => false)) {
                logger.info('Clicking "Show all experiences"...');
                await showAll.click();
                await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
                await randomDelay(2000, 3500);
            }
        } catch { }
    }

    // 2. Extract Data
    const experience = await page.evaluate(() => {
        const results = [];
        const isDetail = window.location.pathname.includes('/details/experience');

        let container;
        if (isDetail) {
            container = document.querySelector('main');
        } else {
            container = document.querySelector('[data-view-name="profile-card-experience"]') ||
                document.querySelector('#experience')?.closest('section');
        }

        if (!container) return results;

        // Select Items
        // Flexible selector: 
        // 1. Legacy/Detail: li items
        // 2. SDUI Main: div with componentkey="entity-collection-item..."
        const items = Array.from(container.querySelectorAll(
            'li.pvs-list__paged-list-item, li.artdeco-list__item, .pvs-list > li, div[componentkey^="entity-collection-item"]'
        ));

        // Helper to parse a text block (innerText split by lines)
        const parseTexts = (rawText) => {
            if (!rawText) return [];
            return rawText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
        };

        items.forEach((item) => {
            try {
                // Check if grouped (nested list) - mostly for Detail pages or Legacy 
                // SDUI Main often flattens or uses different structures, but let's check basic structure first.
                // Using innerText is robust against p vs span differences.
                const rawText = item.innerText;
                const texts = parseTexts(rawText);
                const logo = item.querySelector('img')?.src || null;

                if (texts.length === 0) return;

                // HEURISTIC PARSING
                // Attempt to identify parts based on content

                // Date Regex (e.g. Jan 2020 - Present, 2015-2019)
                const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|Present)/i;
                const durationRegex = /(\d+\s?(?:yrs?|mos?))/i;

                const entry = {
                    title: null,
                    company: null,
                    dateRange: null,
                    location: null,
                    description: null,
                    companyLogo: logo
                };

                // Strategy: Identify Date Line
                let dateIdx = -1;
                for (let i = 0; i < texts.length; i++) {
                    if (dateRegex.test(texts[i]) && (texts[i].includes('-') || texts[i].includes('·') || durationRegex.test(texts[i]))) {
                        dateIdx = i;
                        break;
                    }
                }

                if (dateIdx !== -1) {
                    // Lines before date are Title and Company
                    // Usually:
                    // 0: Title
                    // 1: Company
                    // 2: Date
                    // OR
                    // 0: Company (Group Header)
                    // (Nested items...)

                    // Simple case: Title, Company, Date
                    if (dateIdx >= 2) {
                        entry.title = texts[0];
                        entry.company = texts[1];
                        entry.dateRange = texts[dateIdx];
                    } else if (dateIdx === 1) {
                        // Title/Company combined or one missing?
                        // Could be "Company Name" then "Date" (Title missing?)
                        // Or "Title" then "Date" (Company implied?)
                        entry.title = texts[0];
                        entry.dateRange = texts[dateIdx];
                    } else {
                        // Date is first? Unlikely.
                        entry.dateRange = texts[dateIdx];
                    }

                    // Location is usually after date
                    if (texts[dateIdx + 1] && !texts[dateIdx + 1].includes('·')) {
                        // Check if it looks like a location (city, country code)
                        // For now, assume next line is location if short
                        if (texts[dateIdx + 1].length < 50) entry.location = texts[dateIdx + 1];
                    }
                } else {
                    // No date found - fallback to 0=Title, 1=Company
                    if (texts.length >= 2) {
                        entry.title = texts[0];
                        entry.company = texts[1];
                    } else {
                        entry.title = texts[0];
                    }
                }

                // Description: Look for long text
                const desc = texts.find(t => t.length > 60);
                if (desc) entry.description = desc;

                // Deduct duplicated company name if it appears in title
                if (entry.title && entry.company && entry.title === entry.company) {
                    entry.company = null; // or try to find another
                }

                results.push(entry);

            } catch (e) { }
        });

        return results;
    });

    // Go back if we navigated
    if (!isDetailPage && page.url().includes('/details/experience')) {
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => { });
        await randomDelay(1500, 2500);
    }

    logger.info(`Extracted ${experience.length} experience entries`);

    if (experience.length === 0) {
        // Debug snapshot if empty
        const debugDir = require('path').resolve(__dirname, '../../debug');
        await page.screenshot({ path: `${debugDir}/debug_experience_empty_${Date.now()}.png` }).catch(() => { });
        const html = await page.content();
        require('fs').writeFileSync(`${debugDir}/debug_experience_empty_${Date.now()}.html`, html);
    }

    return experience;
}

module.exports = { extractExperience };
