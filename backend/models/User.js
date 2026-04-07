const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'student'],
    required: true
  },
  // NO unique index on these fields.
  // Uniqueness is enforced manually in routes (only when value is non-empty).
  // Empty strings are coerced to null in the pre-save hook below.
  rollNumber: { type: String, default: null, trim: true },
  employeeId: { type: String, default: null, trim: true },
  department:  { type: String, trim: true },
  semester:    { type: Number, min: 1, max: 10 },
  isActive:    { type: Boolean, default: true },
  phone:       { type: String, trim: true },
  address:     { type: String, trim: true },
  dateOfBirth: Date,
  joinDate:    { type: Date, default: Date.now }
}, { timestamps: true });

// Convert empty strings → null so uniqueness checks work correctly.
// Without this, rollNumber:"" for 2 staff members would collide if
// a unique index ever exists on the field.
userSchema.pre('save', function(next) {
  if (this.rollNumber === '' || this.rollNumber === undefined) this.rollNumber = null;
  if (this.employeeId === '' || this.employeeId === undefined) this.employeeId = null;
  next();
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);