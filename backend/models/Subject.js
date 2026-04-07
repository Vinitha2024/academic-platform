const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  department: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 10 },
  credits: { type: Number, required: true, min: 1, max: 6 },

  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);