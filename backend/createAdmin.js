require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const existing = await User.findOne({ email: 'admin@university.edu' });
    if (existing) { console.log('Admin already exists!'); return process.exit(); }
    const admin = new User({
      name: 'Super Admin', email: 'admin@university.edu',
      password: 'admin123', role: 'admin', department: 'Administration', isActive: true
    });
    await admin.save();
    console.log(' Admin created!\nEmail: admin@university.edu\nPassword: admin123');
  } catch (e) { console.error(e); }
  process.exit();
});