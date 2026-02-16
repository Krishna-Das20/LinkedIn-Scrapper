require('dotenv').config();
console.log('--- ENV DEBUG ---');
console.log(`HEADLESS env var raw: "${process.env.HEADLESS}"`);
console.log(`HEADLESS env var type: ${typeof process.env.HEADLESS}`);

const config = require('./config');
console.log('--- CONFIG DEBUG ---');
console.log(`config.playwright.headless: ${config.playwright.headless}`);
