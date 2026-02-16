/**
 * Profile header & about section extractor — rewritten with robust selectors.
 *
 * Strategy:
 *  1. Try extracting structured data from <script type="application/ld+json"> first
 *  2. Fall back to Playwright Locator API with waitFor + multiple selector strategies
 *  3. Use page.evaluate as last resort
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');

async function extractProfile(page) {
    logger.info('Extracting profile header & about...');

    // ── Strategy 1: JSON-LD structured data in <script> tags ──
    const jsonLd = await extractJsonLd(page);

    // ── Strategy 2: DOM extraction with Locator API ──
    const dom = await extractFromDom(page);

    // Merge: prefer DOM (more complete), fill gaps from JSON-LD
    const profile = {
        name: dom.name || jsonLd.name || null,
        headline: dom.headline || jsonLd.headline || null,
        location: dom.location || jsonLd.location || null,
        profileImage: dom.profileImage || jsonLd.profileImage || null,
        bannerImage: dom.bannerImage || null,
        connections: dom.connections || null,
        followers: dom.followers || null,
        openToWork: dom.openToWork || false,
        about: dom.about || jsonLd.about || null,
    };

    logger.info(`Profile extracted: ${profile.name || 'Unknown'}`);
    return profile;
}

/* ── JSON-LD extraction ── */
async function extractJsonLd(page) {
    try {
        const data = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                try {
                    const json = JSON.parse(script.textContent);
                    if (json['@type'] === 'Person' || json['@type'] === 'ProfilePage') {
                        return json;
                    }
                    // Sometimes it's nested
                    if (json['@graph']) {
                        const person = json['@graph'].find(
                            (item) => item['@type'] === 'Person' || item['@type'] === 'ProfilePage'
                        );
                        if (person) return person;
                    }
                } catch { }
            }
            return null;
        });

        if (!data) return {};

        return {
            name: data.name || null,
            headline: data.jobTitle || data.headline || null,
            location: data.addressLocality || data.address?.addressLocality || null,
            profileImage: data.image?.contentUrl || data.image || null,
            about: data.description || null,
        };
    } catch {
        return {};
    }
}

/* ── DOM extraction with proper waits ── */
async function extractFromDom(page) {
    const result = {
        name: null,
        headline: null,
        location: null,
        profileImage: null,
        bannerImage: null,
        connections: null,
        followers: null,
        openToWork: false,
        about: null,
    };

    // Wait for the main profile content to be present (SDUI selector)
    try {
        await page.waitForSelector('[data-view-name="profile-top-card-member-photo"], [data-view-name="profile-card-about"]', {
            timeout: 15000,
        });
    } catch {
        logger.warn('Profile header did not load in time');
    }

    await randomDelay(1000, 2000);

    // ── Name ──
    const nameSelectors = [
        '[data-view-name="profile-top-card-verified-badge"] h2', // Verified badge container has the name
        'h1', // Fallback
        '.text-heading-xlarge',
        '[data-view-name="profile-top-card-member-photo"] ~ div h2',
    ];
    for (const sel of nameSelectors) {
        try {
            const el = page.locator(sel).first();
            if (await el.isVisible().catch(() => false)) {
                result.name = (await el.textContent())?.trim() || null;
                if (result.name) break;
            }
        } catch { }
    }

    // ── Headline ──
    // Usually immediate sibling p tag after the name block
    try {
        const headlineEl = page.locator('[data-view-name="profile-top-card-verified-badge"] ~ p, [data-view-name="profile-top-card-verified-badge"] + div + p').first();
        if (await headlineEl.isVisible().catch(() => false)) {
            result.headline = (await headlineEl.textContent())?.trim() || null;
        } else {
            // Check based on content hierarchy if specific selector fails
            const topCardText = page.locator('[componentkey*="Topcard"] p');
            const count = await topCardText.count();
            for (let i = 0; i < Math.min(count, 3); i++) {
                const text = await topCardText.nth(i).textContent();
                if (text && text.length > 5 && text !== result.name) {
                    result.headline = text.trim(); // First meaningful p usually headline
                    break;
                }
            }
        }
    } catch { }

    // ── Location ──
    try {
        const locIds = [
            '[data-view-name="profile-top-card-verified-badge"] ~ div p',
            '.text-body-small.t-black--light',
        ];
        // Look for location-like pattern in top card text
        const topCardPs = page.locator('[componentkey*="Topcard"] p');
        const pCount = await topCardPs.count();
        for (let i = 0; i < pCount; i++) {
            const text = (await topCardPs.nth(i).textContent())?.trim();
            // Heuristic: Location usually contains comma and/or is a standard city
            if (text && /[a-zA-Z]+, [a-zA-Z]+/.test(text) && text.length < 50 && text !== result.headline) {
                result.location = text;
                break;
            }
        }
    } catch { }

    // ── Profile Photo ──
    try {
        const img = page.locator('[data-view-name="profile-top-card-member-photo"] img').first();
        result.profileImage = await img.getAttribute('src').catch(() => null);
    } catch { }

    // ── Banner Image ──
    try {
        // Often in a wrapper before the photo
        const banner = page.locator('figure[aria-label="Cover photo"] img').first();
        result.bannerImage = await banner.getAttribute('src').catch(() => null);
    } catch { }

    // ── About / Summary ──
    result.about = await extractAbout(page);

    return result;
}

async function extractAbout(page) {
    try {
        // Wait for potential hydration
        await randomDelay(500, 1000);

        // Locate the about section
        // SDUI selector: [data-view-name="profile-card-about"]
        // Legacy: #about
        const aboutSection = page.locator('[data-view-name="profile-card-about"], #about').first();

        if (await aboutSection.isVisible().catch(() => false)) {

            // Try to find "see more" button
            // It might be an inline button or part of the text truncation
            const seeMore = aboutSection.locator('button.inline-show-more-text__button, button[aria-label*="see more"], .pv-shared-text-with-see-more__full-text-toggle');

            if (await seeMore.isVisible().catch(() => false)) {
                logger.info('Clicking "see more" on About section...');
                await seeMore.click().catch(() => { });
                await randomDelay(500, 1000);
            }

            // Extract text
            // Prefer the span with aria-hidden="true" or innerText
            const textEl = aboutSection.locator('.inline-show-more-text, .pv-shared-text-with-see-more span[aria-hidden="true"]');
            let text = await textEl.first().innerText().catch(() => null);

            if (!text) {
                text = await aboutSection.innerText();
            }

            return text?.replace(/^About\n/i, '').trim() || null;
        }
    } catch (e) {
        logger.warn(`Failed to extract About: ${e.message}`);
    }
    return null;
}

module.exports = { extractProfile };
