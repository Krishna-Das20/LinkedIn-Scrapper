/**
 * Certifications / Licenses extractor — rewritten with proper waits.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractCertifications(page) {
    logger.info('Extracting certifications...');

    // Scroll to certifications section
    await page.evaluate(() => {
        const el = document.querySelector('[data-view-name="profile-card-licenses-and-certifications"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await randomDelay(800, 1500);

    // Check for section OR generic container (if on detail page)
    const sectionExists = await page.locator('[data-view-name="profile-card-licenses-and-certifications"], .scaffold-finite-scroll, main').first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!sectionExists) {
        logger.info('No certifications content found');
        return [];
    }

    // Try "Show all"
    let navigatedToDetails = false;
    try {
        const showAll = page.locator(
            '[data-view-name="profile-card-licenses-and-certifications"] ~ .pvs-list__footer-wrapper a, section:has([data-view-name="profile-card-licenses-and-certifications"]) .pvs-list__footer-wrapper a'
        ).first();
        if (await showAll.isVisible({ timeout: 2000 }).catch(() => false)) {
            logger.info('Clicking "Show all certifications"...');
            await showAll.click();
            await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
            await randomDelay(2000, 3500);
            navigatedToDetails = true;
        }
    } catch { }

    const certifications = await page.evaluate(() => {
        const results = [];
        const container = document.querySelector('[data-view-name="profile-card-licenses-and-certifications"]') ||
            document.querySelector('.scaffold-finite-scroll') ||
            document.querySelector('main');

        if (!container) return results;

        const items = container.querySelectorAll('li.artdeco-list__item, li.pvs-list__paged-list-item, ul.pvs-list > li');

        items.forEach((item) => {
            try {
                const spans = item.querySelectorAll('span[aria-hidden="true"]');
                const texts = Array.from(spans).map((s) => s.innerText.trim()).filter(Boolean);
                const logo = item.querySelector('img')?.src || null;
                const link = item.querySelector('a[href*="credential"]')?.href || null;

                if (texts.length === 0) return;

                const entry = {
                    name: texts[0] || null,
                    issuingOrganization: null,
                    issueDate: null,
                    expirationDate: null,
                    credentialId: null,
                    credentialUrl: link,
                    logo,
                };

                // Heuristic parsing
                if (texts.length > 1) entry.issuingOrganization = texts[1];

                for (let i = 2; i < texts.length; i++) {
                    const t = texts[i];
                    if (/issued/i.test(t)) {
                        entry.issueDate = t.replace(/^issued\s*/i, '').trim();
                    } else if (/credential\s*id/i.test(t)) {
                        entry.credentialId = t.replace(/^credential\s*id\s*:?\s*/i, '').trim();
                    } else if (/expir/i.test(t)) {
                        entry.expirationDate = t.trim();
                    } else if (!entry.issueDate && /\b\d{4}\b/.test(t)) {
                        entry.issueDate = t; // Fallback date detection
                    }
                }

                results.push(entry);
            } catch (e) { }
        });

        return results;
    });

    if (navigatedToDetails) {
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => { });
        await randomDelay(1500, 2500);
    }

    logger.info(`Extracted ${certifications.length} certifications`);
    return certifications;
}

module.exports = { extractCertifications };
