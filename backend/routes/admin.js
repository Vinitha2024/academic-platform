const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Announcement = require('../models/Announcement');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');
const { sendAnnouncementEmails } = require('../utils/mailer');

const router = express.Router();
router.use(auth, authorize('admin'));

// ========== USER MANAGEMENT ==========

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, department, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users - Create user
// FIX: Build the user object carefully — never pass empty strings for
//      rollNumber/employeeId; set them to null so uniqueness checks work correctly.
router.post('/users', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['staff', 'student']).withMessage('Role must be staff or student'),
  body('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role, department, phone, address, dateOfBirth } = req.body;

    // --- Duplicate email check ---
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // --- Build user object with only relevant fields ---
    const userData = { name, email, password, role, department };
    if (phone)       userData.phone       = phone;
    if (address)     userData.address     = address;
    if (dateOfBirth) userData.dateOfBirth = dateOfBirth;

    if (role === 'student') {
      const rollNumber = (req.body.rollNumber || '').trim();
      const semester   = req.body.semester;

      if (!rollNumber) {
        return res.status(400).json({ message: 'Roll number is required for students' });
      }
      if (!semester) {
        return res.status(400).json({ message: 'Semester is required for students' });
      }

      // Check roll number uniqueness (only among non-null values)
      const existingRoll = await User.findOne({ rollNumber });
      if (existingRoll) {
        return res.status(400).json({ message: `Roll number "${rollNumber}" is already taken` });
      }

      userData.rollNumber = rollNumber;
      userData.semester   = Number(semester);

    } else if (role === 'staff') {
      const employeeId = (req.body.employeeId || '').trim();

      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required for staff' });
      }

      // Check employee ID uniqueness
      const existingEmp = await User.findOne({ employeeId });
      if (existingEmp) {
        return res.status(400).json({ message: `Employee ID "${employeeId}" is already taken` });
      }

      userData.employeeId = employeeId;
    }

    const user = new User(userData);
    await user.save();
    res.status(201).json({ user: user.toJSON(), message: 'User created successfully' });

  } catch (err) {
    console.error('Create user error:', err);
    if (err.code === 11000) {
      // Decode which field caused the duplicate
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `Duplicate value for ${field}. Please use a unique value.` });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['name', 'department', 'semester', 'phone', 'address', 'isActive', 'dateOfBirth'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: user.toJSON(), message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Deactivate
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/activate
router.put('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User activated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== SUBJECT MANAGEMENT ==========

// GET /api/admin/subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('assignedStaff', 'name email employeeId department');
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/subjects
router.post('/subjects', [
  body('name').trim().notEmpty().withMessage('Subject name required'),
  body('code').trim().notEmpty().withMessage('Subject code required'),
  body('department').notEmpty().withMessage('Department required'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Valid semester required'),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Valid credits required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const code = req.body.code.toUpperCase().trim();
    const existing = await Subject.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: `Subject code "${code}" already exists` });
    }
    const subject = new Subject({ ...req.body, code });
    await subject.save();
    res.status(201).json({ subject, message: 'Subject created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/subjects/:id
router.put('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('assignedStaff', 'name email employeeId');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ subject, message: 'Subject updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/subjects/:id
router.delete('/subjects/:id', async (req, res) => {
  try {
    await Subject.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Subject deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/subjects/:id/assign-staff
// Validation: same subject can have multiple staffs; same staff can handle multiple subjects
router.post('/subjects/:id/assign-staff', async (req, res) => {
  try {
    const { staffIds } = req.body;
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({ message: 'Provide at least one staff ID' });
    }

    // Verify all IDs belong to active staff
    const validStaff = await User.find({ _id: { $in: staffIds }, role: 'staff' });
    if (validStaff.length !== staffIds.length) {
      return res.status(400).json({ message: 'One or more invalid staff IDs' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Add only new (non-duplicate) staff
    const existing = subject.assignedStaff.map(id => id.toString());
    const newIds   = staffIds.filter(id => !existing.includes(id));
    subject.assignedStaff.push(...newIds);
    await subject.save();

    const populated = await Subject.findById(subject._id)
      .populate('assignedStaff', 'name email employeeId department');
    res.json({ subject: populated, message: `${newIds.length} staff member(s) assigned` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/subjects/:id/remove-staff/:staffId
router.delete('/subjects/:id/remove-staff/:staffId', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $pull: { assignedStaff: req.params.staffId } },
      { new: true }
    ).populate('assignedStaff', 'name email employeeId');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ subject, message: 'Staff removed from subject' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ANNOUNCEMENT MANAGEMENT ==========

// GET /api/admin/announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('content').trim().notEmpty().withMessage('Content required'),
  body('targetAudience').isIn(['all', 'students', 'staff']).withMessage('Valid target audience required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const announcement = new Announcement({ ...req.body, postedBy: req.user._id });
    await announcement.save();
    await announcement.populate('postedBy', 'name role');

    // ── Send emails fire-and-forget (never blocks or breaks this route) ──
    const postedByName = req.user.name || 'Admin';
    let recipientQuery = { isActive: true };
    if (announcement.targetAudience === 'students')     recipientQuery.role = 'student';
    else if (announcement.targetAudience === 'staff')   recipientQuery.role = 'staff';
    else                                                 recipientQuery.role = { $in: ['student', 'staff'] };

    User.find(recipientQuery).select('email name').then(recipients => {
      sendAnnouncementEmails(announcement.toObject(), postedByName, recipients);
    }).catch(e => console.error('Recipient fetch error:', e.message));

    res.status(201).json({ announcement, message: 'Announcement created successfully' });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ANALYTICS ==========

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const [totalStudents, totalStaff, totalSubjects, totalAnn, activeStudents, activeStaff] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'staff' }),
      Subject.countDocuments({ isActive: true }),
      Announcement.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'staff',   isActive: true })
    ]);

    const deptStats = await User.aggregate([
      { $match: { role: 'student', isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const attStats = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      overview: { totalStudents, totalStaff, totalSubjects, totalAnn, activeStudents, activeStaff },
      deptStats,
      attStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;