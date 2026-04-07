const express = require('express');
const Announcement = require('../models/Announcement');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.use(auth);

router.get('/announcements', async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.user.role === 'student') query.$or = [{ targetAudience: 'all' }, { targetAudience: 'students' }];
    else if (req.user.role === 'staff') query.$or = [{ targetAudience: 'all' }, { targetAudience: 'staff' }];
    const ann = await Announcement.find(query).populate('postedBy', 'name role').sort({ createdAt: -1 }).limit(30);
    res.json({ announcements: ann });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/departments', async (req, res) => {
  try {
    const departments = await User.distinct('department');
    res.json({ departments: departments.filter(Boolean) });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/subjects', async (req, res) => {
  try {
    const { department, semester } = req.query;
    let query = { isActive: true };
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    const subjects = await Subject.find(query).populate('assignedStaff', 'name employeeId');
    res.json({ subjects });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;