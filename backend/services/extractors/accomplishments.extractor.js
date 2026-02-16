/**
 * Accomplishments extractor — rewritten with proper waits.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractAccomplishments(page) {
    logger.info('Extracting accomplishments...');

    const result = {
        languages: [],
        honors: [],
        publications: [],
        volunteer: [],
        projects: [],
        courses: [],
        organizations: [],
    };

    const sectionMap = {
        languages: {
            sdui: '[data-view-name="profile-card-languages"]',
            legacy: '#languages'
        },
        honors: {
            sdui: '[data-view-name="profile-card-honors"]',
            legacy: '#honors_and_awards, #honors'
        },
        publications: {
            sdui: '[data-view-name="profile-card-publications"]',
            legacy: '#publications'
        },
        volunteer: {
            sdui: '[data-view-name="profile-card-volunteering-experience"]',
            legacy: '#volunteering_experience, #volunteer_experience'
        },
        courses: {
            sdui: '[data-view-name="profile-card-courses"]',
            legacy: '#courses'
        },
        organizations: {
            sdui: '[data-view-name="profile-card-organizations"]',
            legacy: '#organizations'
        },
    };

    for (const [key, mapping] of Object.entries(sectionMap)) {
        try {
            // Check SDUI first
            let containerSelector = mapping.sdui;
            let isSdui = await page.locator(containerSelector).isVisible({ timeout: 1000 }).catch(() => false);

            if (!isSdui) {
                // Check legacy
                const legacySelectors = mapping.legacy.split(',').map(s => s.trim());
                for (const legSel of legacySelectors) {
                    if (await page.locator(legSel).isVisible({ timeout: 500 }).catch(() => false)) {
                        containerSelector = legSel;
                        break;
                    }
                }
            }

            // If still not found, check if sdui exists but just not identifying correctly?
            // Actually, if neither is visible, we skip.
            const visible = await page.locator(containerSelector).isVisible({ timeout: 500 }).catch(() => false);
            if (!visible) continue;

            // Scroll to it
            await page.evaluate((s) => {
                const el = document.querySelector(s);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, containerSelector);
            await randomDelay(500, 1000);

            // Expand "Show all" if needed
            // Generic footer selector works for both usually
            const showAll = page.locator(`${containerSelector} ~ .pvs-list__footer-wrapper a, section:has(${containerSelector}) .pvs-list__footer-wrapper a`).first();
            if (await showAll.isVisible({ timeout: 1500 }).catch(() => false)) {
                await showAll.click();
                await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });
                await randomDelay(1000, 2000);
            }

            const items = await page.evaluate((s) => {
                const container = document.querySelector(s) || document.querySelector('.scaffold-finite-scroll') || document.querySelector('main');
                if (!container) return [];

                // Use robust text extraction for list items
                const lis = container.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item, ul.pvs-list > li');
                return Array.from(lis).map((li) => {
                    const spans = li.querySelectorAll('span[aria-hidden="true"]');
                    return Array.from(spans).map((sp) => sp.innerText.trim()).filter(Boolean);
                }).filter(texts => texts.length > 0);
            }, containerSelector);

            result[key] = items.map((texts) => buildAccomplishment(key, texts));

            // Go back if expanded
            if (await page.url().includes('/details/')) {
                await page.goBack();
                await randomDelay(1000, 1500);
            }

        } catch (err) {
            logger.warn(`Error extracting ${key}: ${err.message}`);
        }
    }

    const total = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    logger.info(`Extracted ${total} accomplishments`);
    return result;
}

function buildAccomplishment(type, texts) {
    switch (type) {
        case 'languages':
            return { name: texts[0], proficiency: texts[1] || null };
        case 'honors':
            return { title: texts[0], issuer: texts[1] || null, date: texts[2] || null, description: texts.slice(3).join(' ') || null };
        case 'publications':
            return { title: texts[0], publisher: texts[1] || null, date: texts[2] || null, url: null };
        case 'volunteer':
            return { role: texts[0], organization: texts[1] || null, dates: texts[2] || null };
        case 'projects':
            return { name: texts[0], dates: texts[1] || null, description: texts.slice(2).join(' ') || null };
        case 'courses':
            return { name: texts[0], number: texts[1] || null };
        case 'organizations':
            return { name: texts[0], position: texts[1] || null, dates: texts[2] || null };
        default:
            return { text: texts.join(' | ') };
    }
}

module.exports = { extractAccomplishments };
