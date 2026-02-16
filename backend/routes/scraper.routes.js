const express = require('express');
const router = express.Router();
const {
    scrapeProfile,
    scrapePosts,
    scrapeImages,
    scrapeComplete,
} = require('../controllers/scraper.controller');

router.get('/profile', scrapeProfile);
router.get('/posts', scrapePosts);
router.get('/images', scrapeImages);
router.get('/complete', scrapeComplete);

module.exports = router;
