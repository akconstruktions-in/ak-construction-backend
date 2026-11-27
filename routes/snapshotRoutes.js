const express = require('express');
const router = express.Router();
const { generateSnapshot } = require('../controllers/snapshotController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, generateSnapshot);

module.exports = router;
