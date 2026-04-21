
require('dotenv').config();
const mongoose = require('mongoose');

async function dropBadIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    try {
      await collection.dropIndex('rollNumber_1');
      console.log(' Dropped rollNumber_1 index');
    } catch (e) {
      console.log('rollNumber_1 index not found (already removed or never existed)');
    }

    // Drop employeeId index if it exists
    try {
      await collection.dropIndex('employeeId_1');
      console.log(' Dropped employeeId_1 index');
    } catch (e) {
      console.log(' employeeId_1 index not found (already removed or never existed)');
    }

    const remaining = await collection.indexes();
    console.log('\nRemaining indexes:', remaining.map(i => i.name));
    console.log('\n Done! You can now create multiple students and staff without duplicate errors.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

dropBadIndexes();