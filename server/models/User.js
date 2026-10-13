const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  blood_group: { type: String, required: true, trim: true },
  organ: { type: String, default: '', trim: true },
  location: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
