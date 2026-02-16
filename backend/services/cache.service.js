const NodeCache = require('node-cache');
const config = require('../config');
const logger = require('../utils/logger');

const cache = new NodeCache({
    stdTTL: config.cache.ttl,
    checkperiod: 120,
    useClones: true,
});

/**
 * Get cached data for a profile URL.
 */
function get(profileUrl) {
    const key = normalizeKey(profileUrl);
    const data = cache.get(key);
    if (data) logger.info(`Cache HIT for ${key}`);
    return data || null;
}

/**
 * Store data in cache.
 */
function set(profileUrl, data, ttl) {
    const key = normalizeKey(profileUrl);
    cache.set(key, data, ttl);
    logger.info(`Cache SET for ${key} (TTL: ${ttl || config.cache.ttl}s)`);
}

/**
 * Remove cached data.
 */
function invalidate(profileUrl) {
    const key = normalizeKey(profileUrl);
    cache.del(key);
    logger.info(`Cache INVALIDATED for ${key}`);
}

function normalizeKey(url) {
    return url.toLowerCase().replace(/\/+$/, '');
}

module.exports = { get, set, invalidate };
