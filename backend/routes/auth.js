const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

const genToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('role').isIn(['admin','staff','student'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) return res.status(400).json({ message: 'Invalid credentials or wrong role' });
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: genToken(user._id), user: user.toJSON() });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/me', auth, (req, res) => res.json({ user: req.user }));

router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(req.body.currentPassword);
    if (!match) return res.status(400).json({ message: 'Current password wrong' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password changed' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const fields = ['name','phone','address','dateOfBirth'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ user: user.toJSON(), message: 'Profile updated' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;