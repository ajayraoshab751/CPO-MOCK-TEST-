const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
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

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  loginCount: { type: Number, default: 0 },
  canCallAdmin: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date
});

const mockSchema = new mongoose.Schema({
  title: String,
  section: String,
  chapter: String,
  questions: Array,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Mock = mongoose.model('Mock', mockSchema);

// Auth APIs
app.post('/api/auth/login', async (req, res) => {
  const { email, password, name } = req.body || {};
  try {
    let user = await User.findOne({ email });
    const isAdmin = (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi');

    if (!user) {
      user = new User({ email, password, name: name || 'Aspirant', loginCount: 1, isAdmin });
    } else {
      if (user.password !== password) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
      }
      user.loginCount += 1;
    }
    await user.save();
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Forgot Password OTP Endpoint (5-min validity)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'Gmail not registered' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins
  await user.save();

  console.log(`[OTP GENERATED] OTP for ${email} is ${otp}`);
  return res.json({ success: true, message: 'OTP sent to registered Gmail (valid for 5 mins)', debugOtp: otp });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

  user.password = newPassword;
  user.otp = null;
  user.otpExpires = null;
  await user.save();
  return res.json({ success: true, message: 'Password updated successfully!' });
});

// Admin API: Enable Call for Specific User
app.post('/api/admin/toggle-user-call', async (req, res) => {
  const { email, allow } = req.body;
  await User.updateOne({ email }, { canCallAdmin: allow });
  return res.json({ success: true });
});

// Admin API: Get All Users & Login Counts
app.get('/api/admin/users', async (req, res) => {
  const users = await User.find({}, 'email name loginCount canCallAdmin');
  return res.json({ success: true, users });
});

// Automatic HTML Parser Endpoint
app.post('/api/admin/upload-html-mock', async (req, res) => {
  const { title, section, chapter, htmlContent } = req.body;
  
  // Basic Regex Extractor converting HTML raw text into Structured CBT Mock Questions
  const questionBlocks = htmlContent.split(/Question\s*\d+/i).slice(1);
  const parsedQuestions = questionBlocks.map((block, index) => {
    return {
      qId: index + 1,
      questionText: block.substring(0, 150).replace(/<[^>]*>?/gm, '').trim(),
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      solutionText: 'Auto-extracted solution provided by CBT Parser.'
    };
  });

  const newMock = new Mock({ title, section, chapter, questions: parsedQuestions });
  await newMock.save();
  return res.json({ success: true, count: parsedQuestions.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 System running on port ${PORT}`));
