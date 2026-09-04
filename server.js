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

// User Schema with Login Counter & Selective Call Permission
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  loginCount: { type: Number, default: 0 },
  canCallAdmin: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  savedQuestions: Array,
  wrongQuestions: Array,
  challengeData: { type: Object, default: { plan: 100, attendance: {}, circles: 0 } }
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

// Auth Endpoint with Login Counter
app.post('/api/auth', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    let user = await User.findOne({ email });
    const isAdmin = (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi');

    if (!user) {
      user = new User({ email, password, name: name || 'Aspirant', loginCount: 1, isAdmin });
    } else {
      if (user.password !== password) return res.status(400).json({ success: false, message: 'Invalid Password' });
      user.loginCount += 1;
    }
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Route: Specific User Call Permission Toggle
app.post('/api/admin/toggle-user-call', async (req, res) => {
  const { userEmail, canCall } = req.body;
  await User.updateOne({ email: userEmail }, { canCallAdmin: canCall });
  res.json({ success: true, message: `Call permissions updated for ${userEmail}` });
});

// Automated Mock Converter (HTML/PDF Text Processing)
app.post('/api/admin/convert-mock', async (req, res) => {
  const { rawContent, subject, chapter, title } = req.body;
  
  // Basic regex parser to convert raw html/text pages to structured CBT questions
  const parsedQuestions = [];
  const blocks = rawContent.split(/Q\d+\.|Question \d+:/g).filter(b => b.trim());

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      parsedQuestions.push({
        id: idx + 1,
        question: lines[0],
        options: lines.slice(1, 5).length === 4 ? lines.slice(1, 5) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        solution: 'Detailed solution auto-generated from text source.'
      });
    }
  });

  const mock = new Mock({ title, subject, chapter, questions: parsedQuestions });
  await mock.save();
  res.json({ success: true, count: parsedQuestions.length, mockId: mock._id });
});

// Fetch Mock Tests by Chapter
app.get('/api/mocks/:subject/:chapter', async (req, res) => {
  const mocks = await Mock.find({ subject: req.params.subject, chapter: req.params.chapter });
  res.json({ success: true, mocks });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
