const express = require('express');
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Assignment = require('../models/Assignment');
const Announcement = require('../models/Announcement');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(auth, authorize('student'));

router.get('/my-subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ department: req.user.department, semester: Number(req.user.semester), isActive: true })
      .populate('assignedStaff', 'name email employeeId');
    res.json({ subjects });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/attendance', async (req, res) => {
  try {
    const { subjectId } = req.query;
    let query = { student: req.user._id };
    if (subjectId) query.subject = subjectId;
    const attendance = await Attendance.find(query)
      .populate('subject', 'name code').populate('markedBy', 'name').sort({ date: -1 });
    const subjectMap = {};
    attendance.forEach(a => {
      const id = a.subject._id.toString();
      if (!subjectMap[id]) subjectMap[id] = { subject: a.subject, total: 0, present: 0, absent: 0, late: 0 };
      subjectMap[id].total++;
      subjectMap[id][a.status]++;
    });
    const summaryBySubject = Object.values(subjectMap).map(s => ({ ...s, percentage: s.total > 0 ? ((s.present/s.total)*100).toFixed(1) : 0 }));
    res.json({ attendance, summaryBySubject });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/grades', async (req, res) => {
  try {
    const { subjectId, semester } = req.query;
    let query = { student: req.user._id };
    if (subjectId) query.subject = subjectId;
    if (semester) query.semester = parseInt(semester);
    const grades = await Grade.find(query)
      .populate('subject', 'name code credits').populate('gradedBy', 'name').sort({ createdAt: -1 });
    
    console.log('=== GPA Debug Info ===');
    console.log('Total grades found:', grades.length);
    console.log('Grades data:', JSON.stringify(grades.map(g => ({
      id: g._id,
      grade: g.grade,
      subject: g.subject?.name,
      credits: g.subject?.credits
    })), null, 2));
    
    const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0 };
    let totalCredits = 0, weightedPoints = 0;
    grades.forEach(g => {
      const credits = g.subject?.credits || 0;
      const points = gradePoints[g.grade] || 0;
      totalCredits += credits;
      weightedPoints += points * credits;
      console.log(`Grade: ${g.grade}, Credits: ${credits}, Points: ${points}, Contribution: ${points * credits}`);
    });
    console.log('Total Credits:', totalCredits, 'Weighted Points:', weightedPoints);
    
    const gpa = totalCredits > 0 ? (weightedPoints/totalCredits).toFixed(2) : 0;
    console.log('Final GPA:', gpa);
    console.log('==================');
    
    res.json({ grades, gpa, totalCredits });
  } catch (err) { 
    console.error('Error in /grades:', err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

router.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find({ targetDepartment: req.user.department, targetSemester: Number(req.user.semester), isActive: true })
      .populate('subject', 'name code').populate('createdBy', 'name').sort({ dueDate: 1 });
    const enriched = assignments.map(a => {
      const sub = a.submissions.find(s => s.student?.toString() === req.user._id.toString());
      return { ...a.toObject(), mySubmission: sub || null, isSubmitted: !!sub, isOverdue: new Date() > new Date(a.dueDate) && !sub };
    });
    res.json({ assignments: enriched });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/assignments/:id/submit', [
  body('submittedText').trim().isLength({ min: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, targetDepartment: req.user.department, targetSemester: req.user.semester });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const already = assignment.submissions.find(s => s.student?.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Already submitted' });
    const isLate = new Date() > new Date(assignment.dueDate);
    assignment.submissions.push({ student: req.user._id, submittedText: req.body.submittedText, submittedAt: new Date(), status: isLate ? 'late' : 'submitted' });
    await assignment.save();
    res.json({ message: isLate ? 'Submitted (late)' : 'Submitted successfully' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true, $or: [{ targetAudience: 'all' }, { targetAudience: 'students' }] })
      .populate('postedBy', 'name role').sort({ createdAt: -1 }).limit(20);
    res.json({ announcements });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/dashboard-stats', async (req, res) => {
  try {
    const [subjects, attendance, grades, assignments] = await Promise.all([
      Subject.countDocuments({ department: req.user.department, semester: Number(req.user.semester), isActive: true }),
      Attendance.find({ student: req.user._id }),
      Grade.find({ student: req.user._id }),
      Assignment.find({ targetDepartment: req.user.department, targetSemester: Number(req.user.semester), isActive: true })
    ]);
    const totalAtt = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attPct = totalAtt > 0 ? ((presentCount/totalAtt)*100).toFixed(1) : 0;
    const submitted = assignments.filter(a => a.submissions.some(s => s.student?.toString() === req.user._id.toString())).length;
    res.json({ totalSubjects: subjects, attendancePercentage: attPct, totalGrades: grades.length, totalAssignments: assignments.length, submittedAssignments: submitted, pendingAssignments: assignments.length - submitted });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;