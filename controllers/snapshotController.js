/**
 * Snapshot controller — generates static JSON files for the public site
 * so it never waits on the backend cold start.
 */
const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Member = require('../models/Member');
const Testimonial = require('../models/Testimonial');

// @desc    Generate a static content snapshot (projects, members, testimonials)
// @route   POST /api/snapshot
// @access  Protected (admin)
const generateSnapshot = asyncHandler(async (req, res) => {
  const [projects, members, testimonials] = await Promise.all([
    Project.find({ published: true }).sort({ createdAt: -1 }).lean(),
    Member.find().sort({ createdAt: -1 }).lean(),
    Testimonial.find().sort({ createdAt: -1 }).lean(),
  ]);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    projects,
    members,
    testimonials,
  };

  res.json({ success: true, data: snapshot });
});

module.exports = { generateSnapshot };
