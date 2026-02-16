/**
 * Skills section extractor — rewritten with robust SDUI selectors.
 */
const { randomDelay } = require('../../utils/delay');
const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

async function extractSkills(page) {
    logger.info('Extracting skills...');
    const debugDir = path.resolve(__dirname, '../../debug');

    // 1. Check if we are already on a detail page or need to navigate/scroll
    const isDetailPage = page.url().includes('/details/skills');

    if (!isDetailPage) {
        // Scroll to skills section
        await page.evaluate(() => {
            const el = document.querySelector('[data-view-name="profile-card-skills"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await randomDelay(800, 1500);

        // Try "Show all skills"
        try {
            const showAll = page.locator(
                '[data-view-name="profile-card-skills"] ~ .pvs-list__footer-wrapper a, section:has([data-view-name="profile-card-skills"]) .pvs-list__footer-wrapper a'
            ).first();

            if (await showAll.isVisible({ timeout: 2000 }).catch(() => false)) {
                logger.info('Clicking "Show all skills"...');
                await showAll.click();
                await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
                await randomDelay(2000, 3500);
            }
        } catch { }
    }

    const skills = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        const isDetail = window.location.pathname.includes('/details/skills');

        let container;
        if (isDetail) {
            container = document.querySelector('main');
        } else {
            container = document.querySelector('[data-view-name="profile-card-skills"]') ||
                document.querySelector('.scaffold-finite-scroll');
        }

        if (!container) return results;

        // Select Items
        // SDUI uses [role="listitem"] divs instead of lis in many places
        // Select both for robustness
        const items = container.querySelectorAll('li, div[role="listitem"]');

        items.forEach((item) => {
            // Skill text usually in the first text node or span
            // Sometimes followed by "Endorsed by..."

            const rawText = item.innerText;
            if (!rawText) return;

            // Clean text
            const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

            if (lines.length === 0) return;

            // First line is generally the skill name
            let skillName = lines[0];

            // Validation
            if (skillName.length < 2 || skillName.match(/^\d+$/) || skillName.includes('Endorsed') || skillName.includes('Show all')) return;

            if (seen.has(skillName)) return;
            seen.add(skillName);

            results.push({ name: skillName, endorsements: null });
        });

        return results;
    });

    if (!isDetailPage && page.url().includes('/details/skills')) {
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => { });
        await randomDelay(1500, 2500);
    }

    logger.info(`Extracted ${skills.length} skills`);

    if (skills.length === 0) {
        logger.warn('Skills extraction returned 0 items. Capturing debug info...');
        await page.screenshot({ path: `${debugDir}/debug_skills_failed_${Date.now()}.png` }).catch(() => { });
        // Note: we can't save HTML here easily as we are not in browser context fully, but screenshot helps
    }

    return skills;
}

module.exports = { extractSkills };
