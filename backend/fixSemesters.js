/**
 * One-time migration: coerce semester field from string to Number
 * for all existing user documents in the database.
 *
 * Run once:  node fixSemesters.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

 
  const users = await User.find({ role: 'student', semester: { $type: 'string' } });
  console.log(`Found ${users.length} students with string semester`);

  let fixed = 0;
  for (const u of users) {
    const numSem = Number(u.semester);
    if (!isNaN(numSem)) {
      await User.updateOne({ _id: u._id }, { $set: { semester: numSem } });
      fixed++;
    }
  }

  console.log(` Fixed ${fixed} records`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
