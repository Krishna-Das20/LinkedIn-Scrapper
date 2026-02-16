/**
 * Human-like delay utilities to avoid bot detection.
 */

/**
 * Wait for a random duration between min and max milliseconds.
 */
function randomDelay(min = 800, max = 2500) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type text character by character with random delays between keystrokes.
 */
async function typeWithDelay(page, selector, text, options = {}) {
    const { minDelay = 50, maxDelay = 180 } = options;
    await page.click(selector);
    for (const char of text) {
        await page.keyboard.type(char);
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}

/**
 * Wait for a short random pause (micro-delay between actions).
 */
function microDelay() {
    return randomDelay(300, 900);
}

module.exports = { randomDelay, typeWithDelay, microDelay };
