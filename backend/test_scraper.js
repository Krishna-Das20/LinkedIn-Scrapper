require('dotenv').config();
const { scrapeProfile } = require('./services/scraper.service');

const targetUrl = 'https://www.linkedin.com/in/hardik-gupta-b528072b3/';

// Check for CLI arguments
const args = process.argv.slice(2);
if (args.includes('--cdp') || args.includes('--stealth')) {
    console.log('Running in STEALTH MODE (CDP Port 9222)');
    process.env.CDP_PORT = '9222';
}

async function runTest() {
    console.log(`Testing scraper on ${targetUrl}...`);
    try {
        const data = await scrapeProfile(targetUrl);
        console.log('---------------------------------------------------');
        console.log('SCRAPING RESULT:');
        console.log(JSON.stringify(data, null, 2));
        console.log('---------------------------------------------------');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
