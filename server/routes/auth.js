const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const publicUser = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  blood_group: user.blood_group,
  organ: user.organ,
  location: user.location,
  notes: user.notes
});
const startUserSession = (req, user) => new Promise((resolve, reject) => {
  req.session.regenerate(err => {
    if (err) return reject(err);
    req.session.userId = user._id.toString();
    req.session.save(saveErr => saveErr ? reject(saveErr) : resolve());
  });
});

router.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, phone, blood_group, organ = '', location, password, notes = '' } = req.body;
    if (![name, email, phone, blood_group, location, password].every(v => typeof v === 'string' && v.trim())) {
      return res.status(400).json({ error: 'Please complete all required fields.' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    const exists = await User.exists({ email: email.trim().toLowerCase() });
    if (exists) return res.status(409).json({ error: 'An account with that email already exists.' });
    const user = await User.create({ name, email, phone, blood_group, organ, location, notes, passwordHash: await bcrypt.hash(password, 12) });
    await startUserSession(req, user);
    res.status(201).json({ success: true, message: 'Account created successfully.', user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/api/auth/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    await startUserSession(req, user);
    res.json({ success: true, message: 'Login successful.', user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/api/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Session expired.' });
    res.json(publicUser(user));
  } catch (err) { next(err); }
});

router.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('organconnect.sid');
    res.json({ success: true });
  });
});

module.exports = router;
