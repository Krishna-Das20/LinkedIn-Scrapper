require('dotenv').config();
const { getPage, closeBrowser } = require('./services/browser.service');
const { randomDelay } = require('./utils/delay');
const fs = require('fs');
const path = require('path');

const targetProfileUrl = 'https://www.linkedin.com/in/hardik-gupta-b528072b3/';
const debugDir = path.resolve(__dirname, '../debug');

if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
}

async function debugDetailPages() {
    const page = await getPage();

    try {
        // 1. Visit Profile first (warmup)
        console.log(`Navigating to profile: ${targetProfileUrl}...`);
        await page.goto(targetProfileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await randomDelay(3000, 5000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await randomDelay(1000, 2000);

        const sections = [
            { name: 'experience', url: `${targetProfileUrl}details/experience/` },
            { name: 'education', url: `${targetProfileUrl}details/education/` },
            { name: 'skills', url: `${targetProfileUrl}details/skills/` }
        ];

        for (const section of sections) {
            console.log(`Navigating to ${section.name} detail page: ${section.url}...`);
            await page.goto(section.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for SDUI list to likely load
            await page.waitForSelector('.scaffold-finite-scroll, main', { timeout: 10000 }).catch(() => { });
            await randomDelay(3000, 5000);

            const screenshotPath = path.join(debugDir, `debug_${section.name}_page.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Saved screenshot: ${screenshotPath}`);

            const htmlPath = path.join(debugDir, `debug_${section.name}_page.html`);
            const content = await page.content();
            fs.writeFileSync(htmlPath, content);
            console.log(`Saved HTML: ${htmlPath}`);
        }

    } catch (err) {
        console.error('Debug execution failed:', err);
    } finally {
        await closeBrowser();
    }
}

debugDetailPages();
