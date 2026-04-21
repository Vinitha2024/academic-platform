const express = require('express');
const Announcement = require('../models/Announcement');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/common/announcements - All relevant announcements
router.get('/announcements', async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.user.role === 'student') {
      // Students only see announcements meant for them or everyone
      query.$or = [{ targetAudience: 'all' }, { targetAudience: 'students' }];
    }
    // Staff and Admin see ALL announcements regardless of targetAudience
    // so staff can see what admin posted, what they themselves posted, everything

    const announcements = await Announcement.find(query)
      .populate('postedBy', 'name role department')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/common/departments - Get all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await User.distinct('department');
    res.json({ departments: departments.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/common/subjects - Browse subjects
router.get('/subjects', async (req, res) => {
  try {
    const { department, semester } = req.query;
    let query = { isActive: true };
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query)
      .populate('assignedStaff', 'name employeeId department');
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;