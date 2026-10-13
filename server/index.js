require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json({ limit: '32kb' }));
app.use(session({
  name: 'organconnect.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-this-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/organ_connect' }),
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(require('./routes/auth'));
app.use('/api', require('./routes/data'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ error: 'An account with that email already exists.' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid identifier.' });
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/organ_connect')
  .then(() => app.listen(port, () => console.log(`Organ Connect API listening on http://localhost:${port}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
