const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examType: { type: String, enum: ['internal1','internal2','midterm','final','assignment','quiz'], required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  totalMarks: { type: Number, required: true, min: 1 },
  grade: { type: String, enum: ['O','A+','A','B+','B','C','D','F'] },
  remarks: String,
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true }
}, { timestamps: true });

gradeSchema.pre('save', function(next) {
  const pct = (this.marksObtained / this.totalMarks) * 100;
  if (pct >= 90) this.grade = 'O';
  else if (pct >= 85) this.grade = 'A+';
  else if (pct >= 75) this.grade = 'A';
  else if (pct >= 65) this.grade = 'B+';
  else if (pct >= 55) this.grade = 'B';
  else if (pct >= 45) this.grade = 'C';
  else if (pct >= 35) this.grade = 'D';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);