const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  remarks: String
}, { timestamps: true });

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('Attendance', attendanceSchema);