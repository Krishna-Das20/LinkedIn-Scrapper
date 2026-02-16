/**
 * Input validation helpers.
 */

const LINKEDIN_URL_REGEX =
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

/**
 * Validate and normalise a LinkedIn profile URL.
 * Accepts: https://www.linkedin.com/in/username
 * Returns the normalised URL or null if invalid.
 */
function validateLinkedInUrl(url) {
    if (!url || typeof url !== 'string') return null;

    let cleaned = url.trim();
    // Strip trailing slash
    if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
    // Add https if missing
    if (cleaned.startsWith('linkedin.com') || cleaned.startsWith('www.linkedin.com')) {
        cleaned = 'https://' + cleaned;
    }

    if (LINKEDIN_URL_REGEX.test(cleaned + '/') || LINKEDIN_URL_REGEX.test(cleaned)) {
        return cleaned;
    }

    // Maybe they just typed a username
    if (/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
        return `https://www.linkedin.com/in/${cleaned}`;
    }

    return null;
}

module.exports = { validateLinkedInUrl };
