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
        let items = [];

        // Strategy 1: Find by Header Text
        const headers = Array.from(document.querySelectorAll('h2, span, p, div'));
        const header = headers.find(el => el.innerText && el.innerText.trim() === 'Licenses & certifications');

        if (header) {
            let parent = header.parentElement;
            console.log('Traversal: Starting from header');
            for (let i = 0; i < 6; i++) {
                if (parent) {
                    console.log(`Traversal: Level ${i}, Tag: ${parent.tagName}, Children: ${parent.children.length}, Class: ${parent.className}`);
                    if (parent.children.length > 5) { // Increased threshold to be safe
                        console.log('Traversal: Found valid container');
                        items = Array.from(parent.children);
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
        }

        // Strategy 2: Fallback to known containers if Step 1 failed
        if (items.length === 0) {
            console.log('Traversal: Failed, using fallback containers');
            const container = document.querySelector('[data-testid="lazy-column"]') ||
                document.querySelector('.scaffold-finite-scroll') ||
                document.querySelector('[data-view-name="profile-card-licenses-and-certifications"]') ||
                document.querySelector('main');

            if (container) {
                items = Array.from(container.children);

                // Descent logic: If few items, look for a wrapper with many children
                if (items.length < 5) {
                    const wrapper = items.find(el => el.children.length > 5);
                    if (wrapper) {
                        console.log('Traversal: Descending into wrapper');
                        items = Array.from(wrapper.children);
                    }
                }
            }
        }

        console.log(`Found ${items.length} items to process`);

        items.forEach((item, index) => {
            try {
                if (item.tagName === 'HR') return;

                // Check if this item likely contains a certification (has image or dates)
                // or if it's just a spacer/header
                const textRaw = item.innerText || '';
                if (!textRaw.trim()) return;

                const lines = textRaw.split('\n').map(l => l.trim()).filter(Boolean);

                // Skip the header itself if it's in the list
                if (lines.includes('Licenses & certifications')) return;

                const cleanLines = lines.filter(l => !['Show more', 'Show less', 'Back'].includes(l));

                if (cleanLines.length === 0) return;

                const logo = item.querySelector('img')?.src || null;
                const link = item.querySelector('a')?.href || null;

                const entry = {
                    name: cleanLines[0],
                    issuingOrganization: null,
                    issueDate: null,
                    expirationDate: null,
                    credentialId: null,
                    credentialUrl: link,
                    logo,
                };

                if (cleanLines.length > 1) entry.issuingOrganization = cleanLines[1];

                // Heuristic parsing for remaining lines
                for (let i = 2; i < cleanLines.length; i++) {
                    const t = cleanLines[i];
                    if (/issued/i.test(t)) {
                        entry.issueDate = t.replace(/^issued\s*/i, '').trim();
                    } else if (/credential\s*id/i.test(t)) {
                        entry.credentialId = t.replace(/^credential\s*id\s*:?\s*/i, '').trim();
                    } else if (/expir/i.test(t)) {
                        entry.expirationDate = t.trim();
                    } else if (!entry.issueDate && /\b\d{4}\b/.test(t)) {
                        entry.issueDate = t;
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
