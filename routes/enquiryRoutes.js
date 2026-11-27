const express = require('express');
const router = express.Router();
const { submitEnquiry, getEnquiries, updateEnquiryStatus, deleteEnquiry } = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');
const { enquiryLimiter } = require('../middleware/rateLimitMiddleware');

router.route('/')
  .get(protect, getEnquiries)
  .post(enquiryLimiter, submitEnquiry);

router.route('/:id')
  .patch(protect, updateEnquiryStatus)
  .delete(protect, deleteEnquiry);

module.exports = router;
