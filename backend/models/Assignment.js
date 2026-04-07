const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  targetDepartment: { type: String, required: true },
  targetSemester: { type: Number, required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedText: String,
    submittedAt: { type: Date, default: Date.now },
    marksObtained: Number,
    feedback: String,
    status: { type: String, enum: ['submitted','graded','late'], default: 'submitted' }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);