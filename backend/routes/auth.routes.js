const express = require('express');
const router = express.Router();
const { loginHandler, statusHandler } = require('../controllers/auth.controller');

router.post('/login', loginHandler);
router.get('/status', statusHandler);

module.exports = router;
