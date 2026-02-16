/**
 * Images aggregator extractor — collects all image URLs from previously scraped data.
 */
const logger = require('../../utils/logger');

async function extractImages(page, scraped) {
    logger.info('Aggregating images...');

    const result = {
        profilePhoto: scraped.profile?.profileImage || null,
        bannerImage: scraped.profile?.bannerImage || null,
        companyLogos: [],
        schoolLogos: [],
        certificationLogos: [],
        postImages: [],
        recommendationPhotos: [],
        allUrls: [],
    };

    // Company logos
    if (scraped.experience) {
        for (const exp of scraped.experience) {
            if (exp.companyLogo) result.companyLogos.push(exp.companyLogo);
        }
    }

    // School logos
    if (scraped.education) {
        for (const edu of scraped.education) {
            if (edu.schoolLogo) result.schoolLogos.push(edu.schoolLogo);
        }
    }

    // Certification logos
    if (scraped.certifications) {
        for (const cert of scraped.certifications) {
            if (cert.logo) result.certificationLogos.push(cert.logo);
        }
    }

    // Post images
    if (scraped.posts) {
        for (const post of scraped.posts) {
            if (post.images) result.postImages.push(...post.images);
        }
    }

    // Recommendation photos
    if (scraped.recommendations?.received) {
        for (const rec of scraped.recommendations.received) {
            if (rec.photo) result.recommendationPhotos.push(rec.photo);
        }
    }

    // Aggregate all unique URLs
    const allSet = new Set();
    Object.entries(result).forEach(([key, val]) => {
        if (key === 'allUrls') return;
        if (typeof val === 'string' && val) allSet.add(val);
        if (Array.isArray(val)) val.forEach((u) => allSet.add(u));
    });

    // Also try to scrape images directly from the page
    try {
        const pageImages = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('img'))
                .map((img) => img.src)
                .filter((src) => src && src.startsWith('https://media.licdn.com'));
        });
        pageImages.forEach((u) => allSet.add(u));
    } catch { }

    result.allUrls = [...allSet];

    logger.info(`Aggregated ${result.allUrls.length} image URLs`);
    return result;
}

module.exports = { extractImages };
