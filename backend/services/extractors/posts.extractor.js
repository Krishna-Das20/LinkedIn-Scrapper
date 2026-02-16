/**
 * Posts / Activity feed extractor — rewritten with proper waits.
 */
const { randomDelay } = require('../../utils/delay');
const { scrollToBottom } = require('../../utils/scroll');
const logger = require('../../utils/logger');

async function extractPosts(page, profileUrl, maxPosts = 10) {
    logger.info(`Extracting posts (max: ${maxPosts})...`);

    // Navigate to the activity page
    const activityUrl = profileUrl.replace(/\/$/, '') + '/recent-activity/all/';
    try {
        await page.goto(activityUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 20000,
        });
        await randomDelay(1000, 2500); // Turbo: Faster navigation wait
    } catch (err) {
        logger.warn(`Failed to navigate to activity page: ${err.message}`);
        return [];
    }

    // Wait for posts to appear
    try {
        await page.waitForSelector(
            '.feed-shared-update-v2, .occludable-update, .profile-creator-shared-feed-update__container',
            { timeout: 10000 }
        );
    } catch {
        logger.info('No posts found on activity page');
        return [];
    }

    // Scroll to load more posts
    await scrollToBottom(page, Math.min(maxPosts / 2, 3)); // Turbo: limit scroll depth
    await randomDelay(500, 1000); // Turbo: shorter wait

    const posts = await page.evaluate((max) => {
        const results = [];

        const postContainers = document.querySelectorAll(
            '.feed-shared-update-v2, .occludable-update, .profile-creator-shared-feed-update__container'
        );

        for (let i = 0; i < Math.min(postContainers.length, max); i++) {
            const post = postContainers[i];

            // ── Post Text ──
            let text = null;
            const textSelectors = [
                '.feed-shared-update-v2__description .break-words span[dir="ltr"]',
                '.feed-shared-inline-show-more-text span[dir="ltr"]',
                '.feed-shared-text span[aria-hidden="true"]',
                '.update-components-text span[dir="ltr"]',
                '.feed-shared-update-v2__description span[aria-hidden="true"]',
            ];
            for (const sel of textSelectors) {
                const el = post.querySelector(sel);
                if (el && el.innerText.trim().length > 5) {
                    text = el.innerText.trim();
                    break;
                }
            }

            // ── Post Images ──
            const imageEls = post.querySelectorAll(
                '.feed-shared-image__container img, .update-components-image img, .feed-shared-carousel img, .ivm-image-view-model img'
            );
            const images = Array.from(imageEls)
                .map((img) => img.src || img.getAttribute('data-delayed-url'))
                .filter(Boolean);

            // ── Video ──
            const videoEl = post.querySelector('video source, video');
            const video = videoEl ? videoEl.src || videoEl.querySelector('source')?.src : null;

            // ── Engagement Metrics ──
            const reactionsEl = post.querySelector(
                '.social-details-social-counts__reactions-count, button[aria-label*="reaction"] span, .social-details-social-counts__social-proof-text'
            );
            const reactions = reactionsEl ? reactionsEl.innerText.trim() : null;

            const commentsEl = post.querySelector(
                'button[aria-label*="comment"] span, .social-details-social-counts__comments'
            );
            const comments = commentsEl ? commentsEl.innerText.trim() : null;

            const repostsEl = post.querySelector(
                'button[aria-label*="repost"] span'
            );
            const reposts = repostsEl ? repostsEl.innerText.trim() : null;

            // ── Date ──
            const dateEl = post.querySelector(
                '.feed-shared-actor__sub-description span[aria-hidden="true"], time, .update-components-actor__sub-description span[aria-hidden="true"]'
            );
            const date = dateEl ? dateEl.innerText.trim() : null;

            // ── Post Type ──
            let type = 'post';
            if (post.querySelector('.feed-shared-article')) type = 'article';
            if (post.querySelector('.feed-shared-poll')) type = 'poll';
            if (video) type = 'video';
            if (images.length > 1) type = 'carousel';

            if (text || images.length > 0 || video) {
                results.push({ text, images, video, reactions, comments, reposts, date, type });
            }
        }

        return results;
    }, maxPosts);

    logger.info(`Extracted ${posts.length} posts`);
    return posts;
}

module.exports = { extractPosts };
