const asyncHandler = require('express-async-handler');
const Testimonial = require('../models/Testimonial');
const { uploadFixedImage, destroyCloudinaryAssets } = require('../utils/uploadHelper');

const TESTIMONIAL_IMAGE = { folder: 'arkitektur/testimonials', width: 200, height: 200 };

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });
  res.json({ success: true, data: testimonials });
});

// @desc    Add a testimonial (optional image cropped to 200×200)
// @route   POST /api/testimonials
// @access  Protected
const addTestimonial = asyncHandler(async (req, res) => {
  const { name, text, role } = req.body;

  if (!name || !text) {
    res.status(400);
    throw new Error('Name and testimonial text are required');
  }

  let imageUrl = null;
  let publicId = null;

  if (req.file) {
    const result = await uploadFixedImage(req.file, TESTIMONIAL_IMAGE);
    imageUrl = result.imageUrl;
    publicId = result.publicId;
  }

  const testimonial = await Testimonial.create({
    name,
    text,
    role: role || 'Client',
    imageUrl,
    publicId,
  });

  res.status(201).json({ success: true, data: testimonial });
});

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Protected
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  if (testimonial.publicId) {
    await destroyCloudinaryAssets([testimonial.publicId]);
  }

  await Testimonial.findByIdAndDelete(req.params.id);

  res.json({ success: true, data: {} });
});

module.exports = { getTestimonials, addTestimonial, deleteTestimonial };
