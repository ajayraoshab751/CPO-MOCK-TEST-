const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));
}

// User Schema (No password required)
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, default: 'Aspirant' },
  loginCount: { type: Number, default: 0 },
  canCall: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Serve Web Page (No Password Field)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CPO AIR 1 Portal</title>
      <style>
        body { font-family: Arial, sans-serif; background: #121212; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e1e1e; padding: 30px; border-radius: 8px; width: 90%; max-width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        h2 { margin-bottom: 20px; font-size: 22px; text-align: center; }
        input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 4px; border: 1px solid #333; background: #2a2a2a; color: #fff; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        button:hover { background: #0056b3; }
        .msg { margin-top: 15px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Aspirant Login / Register</h2>
        <form id="loginForm">
          <input type="email" id="email" placeholder="Enter your email" required />
          <input type="text" id="name" placeholder="Enter your name (Optional)" />
          <button type="submit">Login / Register</button>
        </form>
        <div id="message" class="msg"></div>
      </div>
      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const name = document.getElementById('name').value;
          const msg = document.getElementById('message');

          msg.style.color = '#fff';
          msg.innerText = 'Logging in...';

          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name })
            });
            const data = await res.json();

            if (data.success) {
              msg.style.color = '#00ff7f';
              msg.innerText = 'Login Successful!';
            } else {
              msg.style.color = '#ff4d4d';
              msg.innerText = data.message || 'Login failed';
            }
          } catch (err) {
            msg.style.color = '#ff4d4d';
            msg.innerText = 'Server error. Please try again.';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Login API
app.post('/api/auth/login', async (req, res) => {
  const { email, name } = req.body || {};
  if (!email) return res.json({ success: false, message: 'Email is required' });

  const isAdmin = (email === 'ajayraoshab751@gmail.com');

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: name || 'Aspirant', loginCount: 1, isAdmin });
    } else {
      user.loginCount += 1;
    }
    await user.save();
    return res.json({ success: true, isAdmin: user.isAdmin, user });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
