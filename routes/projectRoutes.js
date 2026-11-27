const express = require('express');
const router = express.Router();
const { getProjects, getProject, addProject, updateProject, addGalleryImages, removeGalleryImage, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.route('/')
  .get(getProjects)
  .post(protect, upload.single('image'), addProject);

router.route('/:id')
  .get(getProject)
  .put(protect, upload.single('image'), updateProject)
  .delete(protect, deleteProject);

router.route('/:id/gallery')
  .post(protect, upload.array('images', 12), addGalleryImages);

router.route('/:id/gallery/:publicId')
  .delete(protect, removeGalleryImage);

module.exports = router;
