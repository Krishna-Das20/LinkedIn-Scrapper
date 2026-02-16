/**
 * Education section extractor — rewritten for SDUI with Detail Page support and DIV-based LazyColumn.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractEducation(page) {
    logger.info('Extracting education...');

    // 1. Check if we are already on a detail page or need to navigate/scroll
    const isDetailPage = page.url().includes('/details/education');

    if (!isDetailPage) {
        // Scroll to education section
        await page.evaluate(() => {
            const el = document.querySelector('[data-view-name="profile-card-education"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await randomDelay(800, 1500);

        // Try to click "Show all education"
        try {
            const showAll = page.locator('[data-view-name="education-see-all-education-button"], #education ~ .pvs-list__footer-wrapper a, [data-view-name="profile-card-education"] ~ .pvs-list__footer-wrapper a').first();
            if (await showAll.isVisible({ timeout: 2000 }).catch(() => false)) {
                logger.info('Clicking "Show all education"...');
                await showAll.click();
                await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
                await randomDelay(2000, 3500);
            }
        } catch { }
    }

    const education = await page.evaluate(() => {
        const results = [];
        const isDetail = window.location.pathname.includes('/details/education');

        let container;
        if (isDetail) {
            container = document.querySelector('main');
        } else {
            container = document.querySelector('[data-view-name="profile-card-education"]') ||
                document.querySelector('#education')?.closest('section');
        }

        if (!container) return results;

        // Select Items
        const items = Array.from(container.querySelectorAll(
            'li.pvs-list__paged-list-item, li.artdeco-list__item, .pvs-list > li, div[componentkey^="entity-collection-item"]'
        ));

        // Helper
        const parseTexts = (rawText) => {
            if (!rawText) return [];
            return rawText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
        };

        items.forEach((item) => {
            try {
                const rawText = item.innerText;
                const texts = parseTexts(rawText);
                const logo = item.querySelector('img')?.src || null;

                if (texts.length === 0) return;

                const entry = {
                    school: null,
                    schoolLogo: logo,
                    degree: null,
                    fieldOfStudy: null,
                    dates: null,
                    grade: null,
                    activities: null,
                    description: null,
                };

                // Heuristics
                // 1. School Name: Usually 1st line.
                entry.school = texts[0];

                // 2. Scan remaining lines
                for (let i = 1; i < texts.length; i++) {
                    const t = texts[i];

                    // Dates: "2018 - 2022" or "2018"
                    if (/\b\d{4}\b/.test(t) && (/[-–]/.test(t) || t.length < 15) && !entry.dates) {
                        entry.dates = t;
                    }
                    // Grade
                    else if (/grade|cgpa|gpa|percentage|score/i.test(t) && !entry.grade) {
                        entry.grade = t;
                    }
                    // Activities
                    else if (/activit|societ|club|sport/i.test(t) && text.length < 150 && !entry.activities) {
                        entry.activities = t;
                    }
                    // Degree / Field
                    else if (!entry.degree && t.length < 100 && !t.includes('·')) {
                        // "Bachelor of Technology, Computer Science"
                        if (t.includes(',')) {
                            const parts = t.split(',');
                            entry.degree = parts[0].trim();
                            entry.fieldOfStudy = parts.slice(1).join(',').trim();
                        } else {
                            entry.degree = t;
                        }
                    }
                    // Description
                    else {
                        // Concatenate description
                        if (t.length > 30 || (!entry.dates && !entry.degree)) {
                            entry.description = (entry.description ? entry.description + '\n' : '') + t;
                        }
                    }
                }

                if (entry.school) results.push(entry);

            } catch (e) { }
        });

        return results;
    });

    if (!isDetailPage && page.url().includes('/details/education')) {
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => { });
        await randomDelay(1500, 2500);
    }

    logger.info(`Extracted ${education.length} education entries`);

    if (education.length === 0) {
        const debugDir = require('path').resolve(__dirname, '../../debug');
        await page.screenshot({ path: `${debugDir}/debug_education_empty_${Date.now()}.png` }).catch(() => { });
    }

    return education;
}

module.exports = { extractEducation };
