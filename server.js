const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Aspirant' },
  loginCount: { type: Number, default: 0 },
  canCall: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const mockSchema = new mongoose.Schema({
  title: String,
  subject: String,
  chapter: String,
  questions: Array,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Mock = mongoose.model('Mock', mockSchema);

// Auth Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

  const isAdmin = (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi');

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password, name: name || 'Aspirant', loginCount: 1, isAdmin });
    } else {
      if (user.password !== password) {
        return res.json({ success: false, message: 'Invalid Credentials!' });
      }
      user.loginCount += 1;
    }
    await user.save();
    return res.json({ success: true, isAdmin: user.isAdmin, user });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// Admin Call Permission Toggle
app.post('/api/admin/toggle-call', async (req, res) => {
  const { email, allow } = req.body;
  await User.updateOne({ email }, { canCall: allow });
  res.json({ success: true });
});

// Get User List for Admin
app.get('/api/admin/users', async (req, res) => {
  const users = await User.find({}, 'email name loginCount canCall');
  res.json({ success: true, users });
});

// Convert HTML / Raw Content to CBT Mock Test
app.post('/api/admin/upload-mock', async (req, res) => {
  const { title, subject, chapter, rawContent } = req.body;
  
  // Dynamic parsing logic to build structured CBT JSON from raw upload
  const questions = [];
  const blocks = rawContent.split(/Q\d+:|Question\s*\d+:/gi).filter(Boolean);

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const questionText = lines[0] || `Question ${idx + 1}`;
    const options = lines.filter(l => l.match(/^[A-D][\.\)]/i));
    questions.push({
      id: idx + 1,
      question: questionText,
      options: options.length ? options : ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
      answer: 'A',
      explanation: 'Extracted explanation solution from uploaded document.'
    });
  });

  const newMock = new Mock({ title, subject, chapter, questions });
  await newMock.save();
  res.json({ success: true, count: questions.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Portal running on port ${PORT}`));
