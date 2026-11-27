const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const { uploadFixedImage, destroyCloudinaryAssets, safeUnlink } = require('../utils/uploadHelper');

// Fixed image dimensions for projects
const PROJECT_COVER = { folder: 'arkitektur/projects', width: 1200, height: 800 };
const PROJECT_GALLERY = { folder: 'arkitektur/projects/gallery', width: 1200, height: 800 };

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.published === 'true') filter.published = true;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.featured = true;

  const projects = await Project.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: projects });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  res.json({ success: true, data: project });
});

// @desc    Add a project (single cover image, all images cropped to fixed 1200×800)
// @route   POST /api/projects
// @access  Protected
const addProject = asyncHandler(async (req, res) => {
  const { title, description, status, place, ownerName, timeline, category, scope, published, featured } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Cover image is required');
  }

  const cover = await uploadFixedImage(req.file, PROJECT_COVER);

  const project = await Project.create({
    title,
    description,
    status: status || 'ongoing',
    place,
    ownerName,
    timeline,
    category: category || 'Architecture',
    scope: scope || '',
    published: published !== 'false',
    featured: featured === 'true',
    imageUrl: cover.imageUrl,
    publicId: cover.publicId,
  });

  res.status(201).json({ success: true, data: project });
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Protected
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const { title, description, status, place, ownerName, timeline, category, scope, published, featured } = req.body;

  // If a new cover image is uploaded, replace the old one
  if (req.file) {
    const cover = await uploadFixedImage(req.file, PROJECT_COVER);
    await destroyCloudinaryAssets([project.publicId]);
    project.imageUrl = cover.imageUrl;
    project.publicId = cover.publicId;
  }

  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (place !== undefined) project.place = place;
  if (ownerName !== undefined) project.ownerName = ownerName;
  if (timeline !== undefined) project.timeline = timeline;
  if (category !== undefined) project.category = category;
  if (scope !== undefined) project.scope = scope;
  if (published !== undefined) project.published = published === 'true' || published === true;
  if (featured !== undefined) project.featured = featured === 'true' || featured === true;

  await project.save();
  res.json({ success: true, data: project });
});

// @desc    Add gallery images to a project (all cropped to fixed 1200×800)
// @route   POST /api/projects/:id/gallery
// @access  Protected
const addGalleryImages = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('At least one image is required');
  }

  const uploadedItems = [];
  for (const file of req.files) {
    try {
      const result = await uploadFixedImage(file, PROJECT_GALLERY);
      if (result) {
        uploadedItems.push({
          imageUrl: result.imageUrl,
          publicId: result.publicId,
          caption: '',
        });
      }
    } catch (err) {
      // Skip invalid files but continue with others
      console.error('Gallery upload error:', err.message);
    }
  }

  project.gallery.push(...uploadedItems);
  await project.save();
  res.json({ success: true, data: project });
});

// @desc    Remove a gallery image from a project
// @route   DELETE /api/projects/:id/gallery/:publicId
// @access  Protected
const removeGalleryImage = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const pubId = decodeURIComponent(req.params.publicId);
  const idx = project.gallery.findIndex((g) => g.publicId === pubId);
  if (idx === -1) {
    res.status(404);
    throw new Error('Gallery image not found');
  }

  await destroyCloudinaryAssets([pubId]);
  project.gallery.splice(idx, 1);
  await project.save();
  res.json({ success: true, data: project });
});

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Protected
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const idsToDestroy = [project.publicId, ...project.gallery.map((g) => g.publicId)];
  await destroyCloudinaryAssets(idsToDestroy);
  await Project.findByIdAndDelete(req.params.id);

  res.json({ success: true, data: {} });
});

module.exports = { getProjects, getProject, addProject, updateProject, addGalleryImages, removeGalleryImage, deleteProject };
