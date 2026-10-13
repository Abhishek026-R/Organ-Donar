const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  patient_name: { type: String, required: true, trim: true },
  hospital: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  blood_group: { type: String, required: true, trim: true },
  organ: { type: String, default: '', trim: true },
  date_needed: { type: String, required: true },
  urgency: { type: String, enum: ['Normal', 'High', 'Critical'], default: 'Normal' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
