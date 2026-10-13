const express = require('express');
const User = require('../models/User');
const Request = require('../models/Request');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/users', async (req, res, next) => {
  try {
    const query = {};
    if (req.query.blood_group) query.blood_group = req.query.blood_group;
    if (req.query.organ) query.organ = req.query.organ;
    if (req.query.location) query.location = new RegExp(escapeRegex(String(req.query.location)), 'i');
    const users = await User.find(query).select('name email phone blood_group organ location notes').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) { next(err); }
});

router.get('/requests', async (req, res, next) => {
  try {
    const query = {};
    if (req.query.blood_group) query.blood_group = req.query.blood_group;
    if (req.query.user_id) {
      if (!req.session.userId || req.session.userId !== String(req.query.user_id)) return res.status(403).json({ error: 'You can only view your own requests.' });
      query.owner = req.session.userId;
    }
    const requests = await Request.find(query).populate('owner', 'name email phone').sort({ createdAt: -1 }).lean();
    res.json(requests.map(r => ({
      ...r,
      user_id: r.owner?._id?.toString(),
      contact: { name: r.owner?.name, email: r.owner?.email, phone: r.owner?.phone }
    })));
  } catch (err) { next(err); }
});

router.post('/requests', requireAuth, async (req, res, next) => {
  try {
    const { patient_name, hospital, location, blood_group, organ = '', date_needed, urgency = 'Normal' } = req.body;
    if (![patient_name, hospital, location, blood_group, date_needed].every(v => typeof v === 'string' && v.trim())) {
      return res.status(400).json({ error: 'Please complete all required fields.' });
    }
    const request = await Request.create({ patient_name, hospital, location, blood_group, organ, date_needed, urgency, owner: req.session.userId });
    res.status(201).json(request);
  } catch (err) { next(err); }
});

router.delete('/requests/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await Request.findOneAndDelete({ _id: req.params.id, owner: req.session.userId });
    if (!deleted) return res.status(404).json({ error: 'Request not found.' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
