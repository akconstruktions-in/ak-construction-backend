const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 120,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: 30,
  },
  service: {
    type: String,
    trim: true,
    default: 'Architecture',
    maxlength: 120,
  },
  location: {
    type: String,
    trim: true,
    default: '',
    maxlength: 160,
  },
  message: {
    type: String,
    trim: true,
    default: '',
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'archived'],
    default: 'new',
  },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
