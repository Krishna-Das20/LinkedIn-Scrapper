require('dotenv').config();
const { login, closeBrowser } = require('./services/browser.service');

async function runLogin() {
    console.log('Triggering login flow...');
    try {
        const result = await login();
        console.log('Login Result:', result);
    } catch (error) {
        console.error('Login failed:', error);
    } finally {
        // process.exit(0); // Don't force exit, let browser close naturally if needed
    }
}

runLogin();
