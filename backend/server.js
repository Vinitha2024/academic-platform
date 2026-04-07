const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'https://*.vercel.app', 'https://*.onrender.com'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/staff',   require('./routes/staff'));
app.use('/api/student', require('./routes/student'));
app.use('/api/common',  require('./routes/common'));

app.get('/', (req, res) => {
  res.json({ message: 'Academic Platform API Running', status: 'ok' });
});

// Auto-drop stale indexes that cause "duplicate" errors for rollNumber/employeeId.
// These were created by an earlier version of the User model that used sparse+unique.
// This runs automatically every time the server starts — safe to leave in permanently.
async function dropStaleIndexes() {
  try {
    const col = mongoose.connection.collection('users');
    const indexes = await col.indexes();
    const indexNames = indexes.map(i => i.name);

    const toDrop = ['rollNumber_1', 'employeeId_1'];
    for (const name of toDrop) {
      if (indexNames.includes(name)) {
        await col.dropIndex(name);
        console.log(` Dropped stale index: ${name}`);
      }
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.warn('  Could not drop stale indexes:', err.message);
  }
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    // Drop old bad indexes before starting server
    await dropStaleIndexes();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;