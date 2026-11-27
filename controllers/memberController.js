const asyncHandler = require('express-async-handler');
const Member = require('../models/Member');
const { uploadFixedImage, destroyCloudinaryAssets } = require('../utils/uploadHelper');

const MEMBER_IMAGE = { folder: 'arkitektur/members', width: 400, height: 400 };

// @desc    Get all members
// @route   GET /api/members
// @access  Public
const getMembers = asyncHandler(async (req, res) => {
  const members = await Member.find().sort({ createdAt: -1 });
  res.json({ success: true, data: members });
});

// @desc    Add a member (image cropped to fixed 400×400 square)
// @route   POST /api/members
// @access  Protected
const addMember = asyncHandler(async (req, res) => {
  const { name, role } = req.body;

  if (!name || !role) {
    res.status(400);
    throw new Error('Name and role are required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Image is required');
  }

  const result = await uploadFixedImage(req.file, MEMBER_IMAGE);

  const member = await Member.create({
    name,
    role,
    imageUrl: result.imageUrl,
    publicId: result.publicId,
  });

  res.status(201).json({ success: true, data: member });
});

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Protected
const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);

  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  await destroyCloudinaryAssets([member.publicId]);
  await Member.findByIdAndDelete(req.params.id);

  res.json({ success: true, data: {} });
});

module.exports = { getMembers, addMember, deleteMember };
