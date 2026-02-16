/**
 * Contact info extractor — rewritten with proper waits.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractContact(page) {
    logger.info('Extracting contact info...');

    // Find and click the "Contact info" link
    const contactSelectors = [
        'a[href*="overlay/contact-info"]',
        '#top-card-text-details-contact-info',
        'a[data-control-name*="contact_see_more"]',
        'a:has-text("Contact info")',
        'a:has-text("contact info")',
    ];

    let clicked = false;
    for (const sel of contactSelectors) {
        try {
            const link = page.locator(sel).first();
            if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
                await link.click();
                clicked = true;
                break;
            }
        } catch { }
    }

    if (!clicked) {
        logger.warn('Contact info link not found');
        return null;
    }

    await randomDelay(1500, 3000);

    // Wait for the modal/overlay
    try {
        await page.waitForSelector(
            '.pv-contact-info, .artdeco-modal, [role="dialog"]',
            { timeout: 8000 }
        );
    } catch {
        logger.warn('Contact info overlay did not appear');
        return null;
    }

    await randomDelay(500, 1000);

    const contact = await page.evaluate(() => {
        const result = {
            email: null,
            phone: null,
            websites: [],
            twitter: null,
            birthday: null,
            connectedDate: null,
            address: null,
            im: null,
        };

        // Get the modal/dialog
        const modal = document.querySelector('.artdeco-modal, [role="dialog"], .pv-contact-info');
        if (!modal) return result;

        // Email
        const emailLink = modal.querySelector('a[href^="mailto:"]');
        if (emailLink) result.email = emailLink.href.replace('mailto:', '').trim();

        // Phone
        const phoneLink = modal.querySelector('a[href^="tel:"]');
        if (phoneLink) result.phone = phoneLink.href.replace('tel:', '').trim();

        // Look for all sections in the contact modal
        const sections = modal.querySelectorAll('section, .pv-contact-info__contact-type');

        sections.forEach((section) => {
            const headerText = (section.querySelector('header, h3, h2')?.innerText || '').toLowerCase();
            const links = section.querySelectorAll('a');
            const spans = section.querySelectorAll('span[aria-hidden="true"], .t-14, .t-black--light');

            if (headerText.includes('website') || headerText.includes('url')) {
                links.forEach((a) => {
                    if (a.href && !a.href.startsWith('mailto:') && !a.href.startsWith('tel:')) {
                        result.websites.push({
                            label: a.querySelector('span')?.innerText?.trim() || 'Website',
                            url: a.href,
                        });
                    }
                });
            } else if (headerText.includes('twitter') || headerText.includes('x.com')) {
                const val = links[0]?.href || spans[0]?.innerText?.trim() || null;
                if (val) result.twitter = val;
            } else if (headerText.includes('birthday')) {
                const val = spans[0]?.innerText?.trim() || null;
                if (val) result.birthday = val;
            } else if (headerText.includes('connected')) {
                const val = spans[0]?.innerText?.trim() || null;
                if (val) result.connectedDate = val;
            } else if (headerText.includes('address')) {
                const val = spans[0]?.innerText?.trim() || null;
                if (val) result.address = val;
            } else if (headerText.includes('email') && !result.email) {
                const emailA = section.querySelector('a[href^="mailto:"]');
                if (emailA) result.email = emailA.href.replace('mailto:', '').trim();
            } else if (headerText.includes('phone') && !result.phone) {
                const phoneA = section.querySelector('a[href^="tel:"]');
                if (phoneA) result.phone = phoneA.href.replace('tel:', '').trim();
                else {
                    const val = spans[0]?.innerText?.trim();
                    if (val && /[\d+\-()]+/.test(val)) result.phone = val;
                }
            }
        });

        return result;
    });

    // Close overlay
    try {
        const closeSelectors = [
            '.artdeco-modal__dismiss',
            'button[aria-label="Dismiss"]',
            '[data-test-modal-close-btn]',
            'button[aria-label="Close"]',
        ];
        for (const sel of closeSelectors) {
            const btn = document.querySelector?.(sel); // won't work in node
            // Use Playwright instead — this will be handled below
        }
    } catch { }

    // Close via Playwright
    try {
        const closeBtn = page.locator(
            '.artdeco-modal__dismiss, button[aria-label="Dismiss"], button[aria-label="Close"]'
        ).first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
            await randomDelay(300, 600);
        }
    } catch { }

    logger.info('Contact info extracted');
    return contact;
}

module.exports = { extractContact };
