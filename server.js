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

// Serve Full Portal & Login Interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CPO AIR 1 - CBT Exam Portal</title>
      <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --accent: #38bdf8; --border: #334155; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding-bottom: 70px; }
        header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: var(--card); border-bottom: 1px solid var(--border); }
        .logo-box { display: flex; align-items: center; gap: 12px; }
        .badge-icon { width: 42px; height: 42px; background: #eab308; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; color: #000; border: 2px solid #fff; }
        .logo-title { font-size: 24px; font-weight: 900; letter-spacing: 1px; color: var(--accent); }
        .menu-btn { font-size: 24px; cursor: pointer; background: none; border: none; color: var(--text); }
        
        .view-section { display: none; padding: 20px; max-width: 1000px; margin: 0 auto; }
        .active-view { display: block; }
        
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: var(--card); border-top: 1px solid var(--border); display: flex; justify-content: space-around; align-items: center; z-index: 1000; }
        .nav-item { display: flex; flex-direction: column; align-items: center; font-size: 11px; color: #94a3b8; cursor: pointer; border: none; background: none; }
        .nav-item.active { color: var(--accent); font-weight: bold; }
        .nav-item span { font-size: 18px; margin-bottom: 2px; }
        
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        input, select, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); box-sizing: border-box; }
        button.btn-primary { background: var(--accent); color: #000; font-weight: bold; border: none; cursor: pointer; }
        
        .subject-header { background: var(--border); padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        .chapter-list { display: none; padding-left: 15px; margin-top: 5px; }
        .chapter-item { padding: 8px; border-bottom: 1px solid var(--border); cursor: pointer; font-size: 14px; }
        .chapter-item:hover { color: var(--accent); }
      </style>
    </head>
    <body>

      <header>
        <div class="logo-box">
          <div class="badge-icon">👮</div>
          <div class="logo-title">CPO AIR 1</div>
        </div>
        <button class="menu-btn" onclick="alert('Menu Options: Profile, Targets, Theme, Vault, Logout')">⋮</button>
      </header>

      <!-- AUTH VIEW -->
      <div id="authView" class="view-section active-view">
        <div class="card" style="max-width: 400px; margin: 40px auto;">
          <h2 style="text-align:center;">Aspirant Login / Register</h2>
          <form id="loginForm">
            <input type="email" id="email" placeholder="Enter your email" required />
            <input type="text" id="name" placeholder="Enter your name (Optional)" />
            <button type="submit" class="btn-primary">Login / Register</button>
          </form>
          <div id="message" style="margin-top:15px; text-align:center;"></div>
        </div>
      </div>

      <!-- MAIN PORTAL DASHBOARD VIEW -->
      <div id="portalView" class="view-section">
        <h2>CPO AIR 1 Dashboard & Test Portal</h2>
        
        <!-- Mathematics Chapters -->
        <div class="subject-header" onclick="toggleAccordion('mathChapters')">📐 Quantitative Aptitude (Maths)</div>
        <div id="mathChapters" class="chapter-list">
          <div class="chapter-item">Divisibility, Unit digit, Remainders, LCM & HCF</div>
          <div class="chapter-item">Simplification & BODMAS</div>
          <div class="chapter-item">Percentage</div>
          <div class="chapter-item">Profit, Loss & Discount</div>
          <div class="chapter-item">Ratio and Proportion</div>
          <div class="chapter-item">Averages and Partnership</div>
          <div class="chapter-item">Simple and Compound Interest</div>
          <div class="chapter-item">Time and Work / Pipes & Cisterns</div>
          <div class="chapter-item">Advanced Math: Algebra, Geometry, Mensuration, Trigonometry</div>
        </div>

        <!-- Reasoning Chapters -->
        <div class="subject-header" onclick="toggleAccordion('reasoningChapters')">🧠 Reasoning Ability</div>
        <div id="reasoningChapters" class="chapter-list">
          <div class="chapter-item">Analogy & Classification</div>
          <div class="chapter-item">Coding-Decoding & Series Completion</div>
          <div class="chapter-item">Blood Relations & Direction Sense</div>
          <div class="chapter-item">Syllogism & Venn Diagrams</div>
          <div class="chapter-item">Clock, Calendar & Non-Verbal Figures</div>
        </div>

        <!-- GK GS Chapters -->
        <div class="subject-header" onclick="toggleAccordion('gkChapters')">🌐 GK / GS & Current Affairs</div>
        <div id="gkChapters" class="chapter-list">
          <div class="chapter-item">History (Ancient, Medieval, Modern)</div>
          <div class="chapter-item">Indian Polity & Constitution</div>
          <div class="chapter-item">Geography & Economy</div>
          <div class="chapter-item">General Science (Physics, Chemistry, Biology)</div>
          <div class="chapter-item">Static GK & Current Affairs</div>
        </div>

        <!-- English Chapters -->
        <div class="subject-header" onclick="toggleAccordion('englishChapters')">📖 English Language</div>
        <div id="englishChapters" class="chapter-list">
          <div class="chapter-item">Grammar, Tenses, Voice & Narration</div>
          <div class="chapter-item">Black Book OWS & Idioms</div>
          <div class="chapter-item">Synonyms, Antonyms & Cloze Test</div>
        </div>
      </div>

      <!-- BOTTOM NAVIGATION BAR -->
      <div id="bottomNav" class="bottom-nav" style="display:none;">
        <button class="nav-item active"><span>📝</span>TEST</button>
        <button class="nav-item" onclick="alert('Leaderboard & Performance Analytics')"><span>🏆</span>LEADERBOARD</button>
        <button class="nav-item" onclick="alert('100/60/30 Days Challenge Tracker')"><span>📅</span>CHALLENGE</button>
        <button class="nav-item" onclick="alert('Saved & Wrong Questions Vault')"><span>⭐</span>SAVED QS</button>
        <button class="nav-item" onclick="alert('Doubt Resolution Group')"><span>💬</span>DOUBTS</button>
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
              msg.innerText = 'Login Successful! Loading Portal...';
              setTimeout(() => {
                document.getElementById('authView').classList.remove('active-view');
                document.getElementById('portalView').classList.add('active-view');
                document.getElementById('bottomNav').style.display = 'flex';
              }, 800);
            } else {
              msg.style.color = '#ff4d4d';
              msg.innerText = data.message || 'Login failed';
            }
          } catch (err) {
            msg.style.color = '#ff4d4d';
            msg.innerText = 'Server error. Please try again.';
          }
        });

        function toggleAccordion(id) {
          const el = document.getElementById(id);
          el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        }
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
