const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  specialization: {
    type: String,
    required: [true, 'Please add a specialization']
  },
  experience: {
    type: Number,
    required: [true, 'Please add years of experience']
  },
  qualification: {
    type: String,
    required: [true, 'Please add qualifications']
  },
  fees: {
    type: Number,
    required: [true, 'Please add consultation fees']
  },
  biography: {
    type: String
  },
  slots: {
    type: [String],
    default: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
  },
  days: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Doctor', DoctorSchema);
