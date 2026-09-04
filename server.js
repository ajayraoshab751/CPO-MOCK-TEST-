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

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Aspirant' },
  loginCount: { type: Number, default: 0 },
  otp: { type: String, default: '' },
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

// Auth Login / Register
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

// Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: false, message: 'Email not registered!' });

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = generatedOtp;
  await user.save();

  // Mocking email send for immediate UI responsiveness
  res.json({ success: true, message: 'OTP sent to Gmail!', otpDemo: generatedOtp });
});

// Reset Password with OTP
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp) {
    return res.json({ success: false, message: 'Invalid OTP!' });
  }

  user.password = newPassword;
  user.otp = '';
  await user.save();
  res.json({ success: true, message: 'Password updated successfully!' });
});

// Admin Control - Get Users
app.get('/api/admin/users', async (req, res) => {
  const users = await User.find({}, 'email name loginCount canCall');
  res.json({ success: true, users });
});

// Admin Call Permission Toggle
app.post('/api/admin/toggle-call', async (req, res) => {
  const { email, allow } = req.body;
  await User.updateOne({ email }, { canCall: allow });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Portal running on port ${PORT}`));
