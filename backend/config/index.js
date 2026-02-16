require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,

  linkedin: {
    email: process.env.LINKEDIN_EMAIL,
    password: process.env.LINKEDIN_PASSWORD,
  },

  playwright: {
    headless: (process.env.HEADLESS || '').trim() !== 'false',
    userDataDir: process.env.USER_DATA_DIR || './user_data',
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 30,
  },

  cookies: {
    path: process.env.COOKIES_PATH || './cookies/linkedin.json',
  },
};
