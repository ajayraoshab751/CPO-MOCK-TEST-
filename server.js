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

// User Schema with call permissions and Gmail login counting
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  loginCount: { type: Number, default: 0 },
  canCallAdmin: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Auth Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, name } = req.body || {};
  const isAdmin = (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi');

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password, name: name || 'Aspirant', loginCount: 1, isAdmin });
    } else {
      user.loginCount += 1;
    }
    await user.save();

    return res.status(200).json({
      success: true,
      isAdmin,
      user: {
        email: user.email,
        name: user.name,
        loginCount: user.loginCount,
        canCallAdmin: user.canCallAdmin,
        isAdmin
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Admin endpoint to toggle call permissions for specific users
app.post('/api/admin/toggle-user-call', async (req, res) => {
  const { email, allow } = req.body;
  try {
    await User.updateOne({ email }, { canCallAdmin: allow });
    return res.json({ success: true, message: `Call permission updated for ${email}` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get all users for Admin Panel
app.get('/api/admin/users', async (req, res) => {
  const users = await User.find({}, 'email name loginCount canCallAdmin');
  res.json({ success: true, users });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
