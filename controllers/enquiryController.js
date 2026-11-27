const asyncHandler = require('express-async-handler');
const Enquiry = require('../models/Enquiry');

// @desc    Submit a new enquiry
// @route   POST /api/enquiries
// @access  Public
const submitEnquiry = asyncHandler(async (req, res) => {
  const { name, phone, service, location, message, _honeypot } = req.body;

  // Honeypot field — bots fill hidden fields
  if (_honeypot) {
    // Silently accept but don't save
    return res.status(201).json({ success: true, message: 'Thank you! We will get back to you soon.' });
  }

  if (!name || !phone) {
    res.status(400);
    throw new Error('Name and phone number are required');
  }

  if (phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 10) {
    res.status(400);
    throw new Error('Please provide a valid phone number');
  }

  const enquiry = await Enquiry.create({
    name: String(name).trim().slice(0, 120),
    phone: String(phone).trim().slice(0, 30),
    service: service ? String(service).trim().slice(0, 120) : 'General',
    location: location ? String(location).trim().slice(0, 160) : '',
    message: message ? String(message).trim().slice(0, 2000) : '',
  });

  res.status(201).json({ success: true, message: 'Thank you! We will get back to you soon.', data: { id: enquiry._id } });
});

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Protected
const getEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find().sort({ createdAt: -1 });
  res.json({ success: true, data: enquiries });
});

// @desc    Update enquiry status
// @route   PATCH /api/enquiries/:id
// @access  Protected
const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'archived'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }
  res.json({ success: true, data: enquiry });
});

// @desc    Delete an enquiry
// @route   DELETE /api/enquiries/:id
// @access  Protected
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }
  await Enquiry.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: {} });
});

module.exports = { submitEnquiry, getEnquiries, updateEnquiryStatus, deleteEnquiry };
