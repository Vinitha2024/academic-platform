const express = require('express');
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Assignment = require('../models/Assignment');
const Announcement = require('../models/Announcement');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth, authorize('staff'));

// GET /api/staff/my-subjects - Staff's assigned subjects
// VALIDATION: Staff can handle multiple subjects
router.get('/my-subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ 
      assignedStaff: req.user._id, 
      isActive: true 
    }).populate('assignedStaff', 'name email employeeId');
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/students - All active students, optionally filtered
// NOTE: Filters are optional — if subject dept/sem doesn't match students exactly,
//       staff can still see all students to avoid empty dropdowns.
router.get('/students', async (req, res) => {
  try {
    const { department, semester, all } = req.query;
    let query = { role: 'student', isActive: true };

    // Only apply filters if 'all' is not requested
    if (all !== 'true') {
      if (department) query.department = department;
      if (semester) query.semester = parseInt(semester);
    }

    const students = await User.find(query).sort({ name: 1 });
    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ATTENDANCE MANAGEMENT ==========

// POST /api/staff/attendance - Mark attendance
router.post('/attendance', [
  body('subjectId').notEmpty().withMessage('Subject ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('attendanceData').isArray({ min: 1 }).withMessage('Attendance data required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { subjectId, date, attendanceData } = req.body;

    // Verify staff is assigned to this subject
    const subject = await Subject.findOne({ _id: subjectId, assignedStaff: req.user._id });
    if (!subject) {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = { success: 0, updated: 0, failed: 0 };

    for (const record of attendanceData) {
      try {
        await Attendance.findOneAndUpdate(
          { student: record.studentId, subject: subjectId, date: attendanceDate },
          {
            student: record.studentId,
            subject: subjectId,
            markedBy: req.user._id,
            date: attendanceDate,
            status: record.status,
            remarks: record.remarks || ''
          },
          { upsert: true, new: true }
        );
        results.success++;
      } catch (e) {
        results.failed++;
      }
    }

    res.json({ message: `Attendance marked: ${results.success} records`, results });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/attendance - Get attendance records
router.get('/attendance', async (req, res) => {
  try {
    const { subjectId, date, studentId } = req.query;
    let query = { markedBy: req.user._id };
    if (subjectId) query.subject = subjectId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    }
    if (studentId) query.student = studentId;

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber')
      .populate('subject', 'name code')
      .sort({ date: -1 });
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/attendance/summary/:subjectId - Attendance summary for a subject
router.get('/attendance/summary/:subjectId', async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      { $match: { subject: require('mongoose').Types.ObjectId.createFromHexString(req.params.subjectId) } },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' }
      },
      { $unwind: '$student' },
      {
        $project: {
          student: { name: 1, rollNumber: 1, email: 1 },
          total: 1, present: 1, absent: 1, late: 1,
          percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
        }
      }
    ]);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== GRADES MANAGEMENT ==========

// POST /api/staff/grades - Add/update grade
router.post('/grades', [
  body('studentId').notEmpty().withMessage('Student ID required'),
  body('subjectId').notEmpty().withMessage('Subject ID required'),
  body('examType').isIn(['internal1', 'internal2', 'midterm', 'final', 'assignment', 'quiz']).withMessage('Valid exam type required'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('Valid marks required'),
  body('totalMarks').isFloat({ min: 1 }).withMessage('Valid total marks required'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Valid semester required'),
  body('academicYear').notEmpty().withMessage('Academic year required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { studentId, subjectId, examType, marksObtained, totalMarks } = req.body;

    if (marksObtained > totalMarks) {
      return res.status(400).json({ message: 'Marks obtained cannot exceed total marks' });
    }

    // Verify staff is assigned to subject
    const subject = await Subject.findOne({ _id: subjectId, assignedStaff: req.user._id });
    if (!subject) {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    const grade = await Grade.findOneAndUpdate(
      { student: studentId, subject: subjectId, examType: req.body.examType, semester: req.body.semester, academicYear: req.body.academicYear },
      { ...req.body, student: studentId, subject: subjectId, gradedBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ grade, message: 'Grade saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/grades - Get grades by subject
router.get('/grades', async (req, res) => {
  try {
    const { subjectId, studentId, examType } = req.query;
    let query = { gradedBy: req.user._id };
    if (subjectId) query.subject = subjectId;
    if (studentId) query.student = studentId;
    if (examType) query.examType = examType;

    const grades = await Grade.find(query)
      .populate('student', 'name rollNumber')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ASSIGNMENT MANAGEMENT ==========

// POST /api/staff/assignments
router.post('/assignments', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('subjectId').notEmpty().withMessage('Subject ID required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks required'),
  body('targetDepartment').notEmpty().withMessage('Target department required'),
  body('targetSemester').isInt({ min: 1, max: 10 }).withMessage('Target semester required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const subject = await Subject.findOne({ _id: req.body.subjectId, assignedStaff: req.user._id });
    if (!subject) return res.status(403).json({ message: 'You are not assigned to this subject' });

    const assignment = new Assignment({
      ...req.body,
      subject: req.body.subjectId,
      createdBy: req.user._id
    });
    await assignment.save();
    res.status(201).json({ assignment, message: 'Assignment created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/assignments
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.user._id })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/assignments/:id/submissions
router.get('/assignments/:id/submissions', async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('submissions.student', 'name rollNumber email')
      .populate('subject', 'name code');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/staff/assignments/:id/grade-submission - Grade a submission
router.put('/assignments/:id/grade-submission', [
  body('studentId').notEmpty().withMessage('Student ID required'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('Marks required'),
  body('feedback').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { studentId, marksObtained, feedback } = req.body;
    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (marksObtained > assignment.totalMarks) {
      return res.status(400).json({ message: 'Marks cannot exceed total marks' });
    }

    const submission = assignment.submissions.find(s => s.student.toString() === studentId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    submission.marksObtained = marksObtained;
    submission.feedback = feedback;
    submission.status = 'graded';
    await assignment.save();

    res.json({ message: 'Submission graded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/staff/announcements - Staff can post announcements
router.post('/announcements', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('content').trim().notEmpty().withMessage('Content required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const announcement = new Announcement({
      ...req.body,
      postedBy: req.user._id,
      targetAudience: req.body.targetAudience || 'students'
    });
    await announcement.save();
    res.status(201).json({ announcement, message: 'Announcement posted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/staff/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const mySubjects = await Subject.find({ assignedStaff: req.user._id, isActive: true });
    const subjectIds = mySubjects.map(s => s._id);

    const [totalAttendance, totalGrades, totalAssignments] = await Promise.all([
      Attendance.countDocuments({ markedBy: req.user._id }),
      Grade.countDocuments({ gradedBy: req.user._id }),
      Assignment.countDocuments({ createdBy: req.user._id })
    ]);

    res.json({
      mySubjectsCount: mySubjects.length,
      totalAttendanceMarked: totalAttendance,
      totalGradesEntered: totalGrades,
      totalAssignmentsCreated: totalAssignments,
      mySubjects
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;