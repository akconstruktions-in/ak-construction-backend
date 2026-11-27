const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    trim: true,
    default: '',
  },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required'],
  },
  gallery: {
    type: [galleryItemSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['completed', 'ongoing'],
    default: 'ongoing',
  },
  category: {
    type: String,
    trim: true,
    default: 'Architecture',
  },
  place: {
    type: String,
    trim: true,
  },
  ownerName: {
    type: String,
    trim: true,
  },
  timeline: {
    type: String,
    trim: true,
  },
  scope: {
    type: String,
    trim: true,
    default: '',
  },
  published: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
