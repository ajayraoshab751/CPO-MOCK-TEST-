const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
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
  otp: { type: String, default: '' },
  canCall: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Nodemailer SMTP Transporter (Uses Admin Gmail)
const transporter = nodemailer.buildTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'ajayraoshab751@gmail.com',
    pass: process.env.GMAIL_PASS || '' // Set Google App Password in environment variables
  }
});

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

// Real OTP Generation & Email Dispatch
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Email address not found!' });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = generatedOtp;
    await user.save();

    // Send email using SMTP Transporter if App Password configured
    if (process.env.GMAIL_PASS) {
      await transporter.sendMail({
        from: '"CPO AIR 1 Portal" <ajayraoshab751@gmail.com>',
        to: email,
        subject: 'Your Password Reset OTP - CPO AIR 1',
        text: `Your One-Time Password (OTP) for password reset is: ${generatedOtp}`
      });
      return res.json({ success: true, message: 'OTP sent directly to your Gmail inbox!' });
    } else {
      // Fallback display if SMTP credentials are missing on Render environment
      return res.json({ success: true, message: `OTP Generated: ${generatedOtp}. (To receive live emails directly in inbox, add GMAIL_PASS App Password to Render environment variables).`, otpDemo: generatedOtp });
    }
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

// Reset Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp) {
    return res.json({ success: false, message: 'Invalid OTP!' });
  }

  user.password = newPassword;
  user.otp = '';
  await user.save();
  res.json({ success: true, message: 'Password updated successfully! You can now login.' });
});

app.get('/api/admin/users', async (req, res) => {
  const users = await User.find({}, 'email name loginCount canCall');
  res.json({ success: true, users });
});

app.post('/api/admin/toggle-call', async (req, res) => {
  const { email, allow } = req.body;
  await User.updateOne({ email }, { canCall: allow });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
