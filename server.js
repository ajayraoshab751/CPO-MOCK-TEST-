const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));
}

// Schemas
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
  subject: String, // Math, Reasoning, GK GS, English, Full Mock
  chapter: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    solution: String,
    avgTime: { type: Number, default: 45 },
    correctPercentage: { type: Number, default: 72 }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Mock = mongoose.model('Mock', mockSchema);

// Transporter
const transporter = nodemailer.buildTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'ajayraoshab751@gmail.com',
    pass: process.env.GMAIL_PASS || ''
  }
});

// Serve Full Integrated Single-Page App (SPA)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CPO AIR 1 - High Performance CBT Portal</title>
  <style>
    :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --accent: #38bdf8; --border: #334155; }
    .light-theme { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --accent: #0284c7; --border: #e2e8f0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding-bottom: 70px; transition: all 0.3s; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: var(--card); border-bottom: 1px solid var(--border); }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .badge-icon { width: 42px; height: 42px; background: #eab308; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; color: #000; border: 2px solid #fff; }
    .logo-title { font-size: 24px; font-weight: 900; letter-spacing: 1px; color: var(--accent); }
    .menu-btn { font-size: 24px; cursor: pointer; background: none; border: none; color: var(--text); }
    
    /* Navigation Drawers & Views */
    .view-section { display: none; padding: 20px; max-width: 1000px; margin: 0 auto; }
    .active-view { display: block; }
    
    /* Bottom Navigation */
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: var(--card); border-top: 1px solid var(--border); display: flex; justify-content: space-around; align-items: center; z-index: 1000; }
    .nav-item { display: flex; flex-direction: column; align-items: center; font-size: 11px; color: #94a3b8; cursor: pointer; border: none; background: none; }
    .nav-item.active { color: var(--accent); font-weight: bold; }
    .nav-item span { font-size: 18px; margin-bottom: 2px; }
    
    /* Cards & UI Controls */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    input, select, button, textarea { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); box-sizing: border-box; }
    button.btn-primary { background: var(--accent); color: #000; font-weight: bold; border: none; cursor: pointer; }
    
    /* CBT Question Palette Status Colors */
    .q-btn { width: 38px; height: 38px; border-radius: 6px; border: 1px solid var(--border); color: #fff; font-weight: bold; margin: 4px; }
    .q-green { background: #22c55e !important; } /* Answered */
    .q-red { background: #ef4444 !important; }   /* Not Answered */
    .q-yellow { background: #eab308 !important; color: #000 !important; } /* Answered & Mark for Review */
    .q-purple { background: #a855f7 !important; } /* Marked for Review */

    /* Side Menu Drawer */
    .drawer { position: fixed; top: 0; right: -300px; width: 280px; height: 100%; background: var(--card); border-left: 1px solid var(--border); transition: 0.3s; z-index: 2000; padding: 20px; box-sizing: border-box; }
    .drawer.open { right: 0; }
    .drawer-item { padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; gap: 10px; }
    
    /* Accordion Chapters */
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
    <button class="menu-btn" onclick="toggleDrawer()">⋮</button>
  </header>

  <!-- Side Drawer Menu -->
  <div id="sideDrawer" class="drawer">
    <div style="display:flex; justify-size:space-between; align-items:center; margin-bottom:20px;">
      <h3 style="margin:0;">Menu</h3>
      <button onclick="toggleDrawer()" style="width:auto; padding:5px 10px;">✕</button>
    </div>
    <div class="drawer-item" onclick="showView('profileView')">👤 Profile Details</div>
    <div class="drawer-item" onclick="showView('targetView')">🎯 Daily Targets</div>
    <div class="drawer-item" onclick="window.location.reload()">🔄 Refresh Portal</div>
    <div class="drawer-item" onclick="toggleTheme()">🌓 Dark / Light Theme</div>
    <div class="drawer-item" onclick="showView('vaultView')">📁 PDF & Video Vault</div>
    <div class="drawer-item" onclick="logout()" style="color:#ef4444;">🚪 Logout</div>
  </div>

  <!-- AUTH VIEW -->
  <div id="authView" class="view-section active-view">
    <div class="card" style="max-width: 400px; margin: 40px auto;">
      <h2 style="text-align:center;">Aspirant Portal Access</h2>
      <input type="email" id="authEmail" placeholder="Gmail Address" required />
      <input type="password" id="authPass" placeholder="Password" required />
      <input type="text" id="authName" placeholder="Full Name (for new register)" />
      <button class="btn-primary" onclick="handleAuth()">Login / Register</button>
      <div style="text-align:center; margin-top:10px;">
        <a href="#" onclick="triggerOTP()" style="color:var(--accent); font-size:13px;">Forgot / Reset Password via Email OTP</a>
      </div>
    </div>
  </div>

  <!-- ADMIN VIEW -->
  <div id="adminView" class="view-section">
    <h2>Admin Management Dashboard</h2>
    <div class="card">
      <h3>User Call Approvals & Login Tracking</h3>
      <div id="userAdminList">Loading users...</div>
    </div>

    <div class="card">
      <h3>Auto Parser: Convert HTML / PDF Files to CBT Mocks</h3>
      <label>Select Target Subject & Chapter:</label>
      <select id="adminSubject">
        <option>Math</option>
        <option>Reasoning</option>
        <option>GK GS</option>
        <option>English</option>
        <option>Full Mock CGL Tier 1</option>
      </select>
      <input type="text" id="adminChapter" placeholder="Chapter Name (e.g., Divisibility, Unit digit)" />
      
      <label>Upload HTML / PDF File from Storage:</label>
      <input type="file" id="mockFile" accept=".html,.pdf,.txt" />
      <button class="btn-primary" onclick="parseAndUploadMock()">Auto-Detect & Create Mock Test</button>
    </div>
  </div>

  <!-- VIEW 1: TEST NAVIGATION -->
  <div id="testView" class="view-section">
    <h2>Chapter-wise Mock Tests</h2>
    
    <!-- Mathematics Sub-sections -->
    <div class="subject-header" onclick="toggleAccordion('mathChapters')">📐 Quantitative Aptitude (Maths)</div>
    <div id="mathChapters" class="chapter-list">
      <div class="chapter-item" onclick="openChapterMock('Number System (Divisibility, Unit digit, Remainders, LCM & HCF)')">Number System (Divisibility, Unit digit, Remainders, LCM & HCF)</div>
      <div class="chapter-item" onclick="openChapterMock('Simplification & BODMAS')">Simplification & BODMAS</div>
      <div class="chapter-item" onclick="openChapterMock('Percentage')">Percentage</div>
      <div class="chapter-item" onclick="openChapterMock('Profit, Loss & Discount')">Profit, Loss & Discount</div>
      <div class="chapter-item" onclick="openChapterMock('Ratio and Proportion')">Ratio and Proportion</div>
      <div class="chapter-item" onclick="openChapterMock('Averages and Partnership')">Averages and Partnership</div>
      <div class="chapter-item" onclick="openChapterMock('Mixture and Alligation')">Mixture and Alligation</div>
      <div class="chapter-item" onclick="openChapterMock('Simple and Compound Interest')">Simple and Compound Interest</div>
      <div class="chapter-item" onclick="openChapterMock('Time and Work / Pipes and Cisterns')">Time and Work / Pipes and Cisterns</div>
      <div class="chapter-item" onclick="openChapterMock('Time, Speed and Distance / Boats and Streams')">Time, Speed and Distance / Boats and Streams</div>
      <div class="chapter-item" onclick="openChapterMock('Algebra')">Algebra (Identities, Surds, Equations)</div>
      <div class="chapter-item" onclick="openChapterMock('Geometry')">Geometry (Triangles, Circles, Lines)</div>
      <div class="chapter-item" onclick="openChapterMock('Mensuration 2D & 3D')">Mensuration (2D/3D figures)</div>
      <div class="chapter-item" onclick="openChapterMock('Trigonometry')">Trigonometry (Ratios, Heights & Distances)</div>
      <div class="chapter-item" onclick="openChapterMock('Data Interpretation (DI)')">Data Interpretation (DI)</div>
      <div class="chapter-item" onclick="openChapterMock('Statistics and Probability')">Statistics and Probability</div>
    </div>

    <!-- Reasoning Sub-sections -->
    <div class="subject-header" onclick="toggleAccordion('reasoningChapters')">🧠 Reasoning Ability</div>
    <div id="reasoningChapters" class="chapter-list">
      <div class="chapter-item" onclick="openChapterMock('Analogy')">Analogy (Word, Number, Alphabet)</div>
      <div class="chapter-item" onclick="openChapterMock('Classification / Odd One Out')">Classification / Odd One Out</div>
      <div class="chapter-item" onclick="openChapterMock('Coding-Decoding')">Coding-Decoding</div>
      <div class="chapter-item" onclick="openChapterMock('Series Completion')">Series Completion</div>
      <div class="chapter-item" onclick="openChapterMock('Missing Number / Matrix')">Missing Number / Matrix</div>
      <div class="chapter-item" onclick="openChapterMock('Blood Relations')">Blood Relations</div>
      <div class="chapter-item" onclick="openChapterMock('Direction and Distance')">Direction and Distance</div>
      <div class="chapter-item" onclick="openChapterMock('Syllogism')">Syllogism</div>
      <div class="chapter-item" onclick="openChapterMock('Venn Diagrams')">Venn Diagrams</div>
      <div class="chapter-item" onclick="openChapterMock('Clock and Calendar')">Clock and Calendar</div>
      <div class="chapter-item" onclick="openChapterMock('Non-Verbal & Figures')">Mirror Images, Paper Folding, Embedded Shapes</div>
    </div>

    <!-- GK GS Sub-sections -->
    <div class="subject-header" onclick="toggleAccordion('gkChapters')">🌐 GK / GS & Current Affairs</div>
    <div id="gkChapters" class="chapter-list">
      <div class="chapter-item" onclick="openChapterMock('History: Ancient, Medieval, Modern')">History (Ancient, Medieval, Modern)</div>
      <div class="chapter-item" onclick="openChapterMock('Indian Polity')">Indian Polity & Constitution</div>
      <div class="chapter-item" onclick="openChapterMock('Geography')">Geography (Indian & World)</div>
      <div class="chapter-item" onclick="openChapterMock('Economy')">Economy & Five-Year Plans</div>
      <div class="chapter-item" onclick="openChapterMock('General Science')">Physics, Chemistry, Biology</div>
      <div class="chapter-item" onclick="openChapterMock('Static GK & Current Affairs')">Static GK & Current Affairs (Last 6-8 Months)</div>
    </div>

    <!-- English Sub-sections -->
    <div class="subject-header" onclick="toggleAccordion('englishChapters')">📖 English Language</div>
    <div id="englishChapters" class="chapter-list">
      <div class="chapter-item" onclick="openChapterMock('Grammar & Parts of Speech')">Grammar, Voice, Narration</div>
      <div class="chapter-item" onclick="openChapterMock('Black Book OWS')">Black Book One-Word Substitutions (OWS)</div>
      <div class="chapter-item" onclick="openChapterMock('Black Book Idioms')">Black Book Idioms & Phrases</div>
      <div class="chapter-item" onclick="openChapterMock('Synonyms & Antonyms')">Synonyms & Antonyms</div>
      <div class="chapter-item" onclick="openChapterMock('Comprehension & Cloze Test')">Reading Comprehension & Cloze Test</div>
      <div class="chapter-item" onclick="openChapterMock('Rani Mam Special Mocks')">Rani Mam Special Practice Sets</div>
    </div>
  </div>

  <!-- VIEW 2: LEADERBOARD & ANALYTICS -->
  <div id="leaderboardView" class="view-section">
    <h2>Performance Analytics & Leaderboard</h2>
    <div class="card">
      <h3>Overall Percentile & Score Analysis</h3>
      <p>Rank: <strong>#4 / 1,280 Aspirants</strong></p>
      <p>Average Accuracy: <strong>88.4%</strong></p>
      <p>Performance Growth: <span style="color:#22c55e;">▲ +14% this week</span></p>
    </div>
    <div class="card">
      <h3>Weak & Strong Chapter Breakdown</h3>
      <p>🟢 <strong>Strongest Topics:</strong> Percentage, Syllogism, Indian Polity</p>
      <p>🔴 <strong>Weakest Topics (Requires Practice):</strong> Trigonometry Heights & Distances, Phrasal Verbs</p>
    </div>
  </div>

  <!-- VIEW 3: TARGET CHALLENGE -->
  <div id="challengeView" class="view-section">
    <h2>Daily Target Tracker & Attendance Challenge</h2>
    <div class="card">
      <h3>100-Day / 60-Day / 30-Day Preparation Tracker</h3>
      <p>Mark Status: <strong>P</strong> (Present) / <strong>A</strong> (Absent)</p>
      <p>Custom Circle Target Limits: Max 3 Circles for 100-Day | Max 2 for 60-Day | Max 1 for 30-Day</p>
      <div id="challengeGrid" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; margin-top:15px;"></div>
    </div>
  </div>

  <!-- VIEW 4: SAVED & WRONG QUESTIONS -->
  <div id="savedView" class="view-section">
    <h2>Saved & Incorrect Questions Vault</h2>
    <div class="card">
      <button class="btn-primary" onclick="toggleAnswerHidden()">Toggle Hide / Show Answers First</button>
      <div id="savedQuestionsList" style="margin-top:15px;">
        <div style="border-bottom:1px solid var(--border); padding:10px 0;">
          <p><strong>[Math - Algebra]</strong> If x + 1/x = 3, find x³ + 1/x³.</p>
          <div class="ans-block" style="display:none; color:#22c55e; font-weight:bold;">Solution: 3³ - 3(3) = 18</div>
        </div>
      </div>
    </div>
  </div>

  <!-- VIEW 5: DOUBT RESOLUTION -->
  <div id="doubtView" class="view-section">
    <h2>AI & Admin Doubt Community</h2>
    <div class="card">
      <textarea id="doubtText" placeholder="Write your question or paste query details..."></textarea>
      <input type="file" id="doubtImage" accept="image/*" />
      <button class="btn-primary" onclick="submitDoubt()">Ask AI / Admin Resolution</button>
      <div id="doubtResponse" style="margin-top:15px; color:var(--accent);"></div>
    </div>
  </div>

  <!-- DRAWER SECTION VIEWS -->
  <div id="profileView" class="view-section">
    <h2>Profile & Credentials</h2>
    <div class="card">
      <p>Email: <strong id="profileEmail">ajayraoshab751@gmail.com</strong></p>
      <p>Name: <strong id="profileName">Aspirant</strong></p>
      <hr style="border-color:var(--border);">
      <h3>Update Gmail via OTP Verification</h3>
      <input type="email" id="newEmail" placeholder="New Gmail Address" />
      <button class="btn-primary" onclick="sendGmailOTP()">Request OTP</button>
    </div>
  </div>

  <div id="targetView" class="view-section">
    <h2>Daily Admin Posts & YouTube/Telegram Targets</h2>
    <div class="card">
      <h3>Today's Task by Admin</h3>
      <p>1. Complete Rani Mam OWS Video #4</p>
      <p>2. Solve 50 Questions from Percentage Chapter</p>
      <div style="display:flex; gap:10px; margin:15px 0;">
        <a href="https://youtube.com" target="_blank" style="color:red; text-decoration:none;">▶ YouTube Target</a>
        <a href="https://t.me" target="_blank" style="color:#38bdf8; text-decoration:none;">✈ Telegram Group</a>
      </div>
      <h4>Mark Completion Status (6 Target Checkboxes):</h4>
      <div style="display:grid; grid-template-columns: repeat(6, 1fr); gap:8px;">
        <select><option>👍</option><option>❌</option></select>
        <select><option>👍</option><option>❌</option></select>
        <select><option>👍</option><option>❌</option></select>
        <select><option>👍</option><option>❌</option></select>
        <select><option>👍</option><option>❌</option></select>
        <select><option>👍</option><option>❌</option></select>
      </div>
    </div>
  </div>

  <div id="vaultView" class="view-section">
    <h2>PDF & Video Resource Vault</h2>
    <div class="card">
      <h3>Video Streaming Engine</h3>
      <video id="vaultVideo" controls style="width:100%; border-radius:8px;">
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
      </video>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <label>Speed (1x to 4x):</label>
        <input type="number" id="speedInput" value="1.0" step="0.1" min="1" max="4" onchange="setVideoSpeed()" style="width:80px;" />
        <label>Quality Resolution:</label>
        <select style="width:120px;">
          <option>1080p</option>
          <option>720p</option>
          <option>480p</option>
          <option>360p</option>
          <option>240p</option>
          <option>144p</option>
        </select>
      </div>
    </div>
  </div>

  <!-- BOTTOM NAVIGATION BAR -->
  <div class="bottom-nav">
    <button class="nav-item active" onclick="showNavView('testView', this)"><span>📝</span>TEST</button>
    <button class="nav-item" onclick="showNavView('leaderboardView', this)"><span>🏆</span>LEADERBOARD</button>
    <button class="nav-item" onclick="showNavView('challengeView', this)"><span>📅</span>CHALLENGE</button>
    <button class="nav-item" onclick="showNavView('savedView', this)"><span>⭐</span>SAVED QS</button>
    <button class="nav-item" onclick="showNavView('doubtView', this)"><span>💬</span>DOUBTS</button>
  </div>

  <script>
    // Navigation Routing
    function showView(viewId) {
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
      document.getElementById(viewId).classList.add('active-view');
      closeDrawer();
    }

    function showNavView(viewId, btn) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      showView(viewId);
    }

    function toggleDrawer() {
      document.getElementById('sideDrawer').classList.toggle('open');
    }

    function closeDrawer() {
      document.getElementById('sideDrawer').classList.remove('open');
    }

    function toggleTheme() {
      document.body.classList.toggle('light-theme');
      closeDrawer();
    }

    function toggleAccordion(id) {
      const el = document.getElementById(id);
      el.style.display = (el.style.display === 'block') ? 'none' : 'block';
    }

    // Auth Engine
    async function handleAuth() {
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPass').value;
      const name = document.getElementById('authName').value;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('cpo_user', JSON.stringify(data.user));
        alert('Welcome ' + data.user.name + '!');
        document.getElementById('authView').classList.remove('active-view');
        if (data.isAdmin) {
          showView('adminView');
          loadAdminUsers();
        } else {
          showView('testView');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    }

    function logout() {
      localStorage.removeItem('cpo_user');
      showView('authView');
    }

    // Video Vault Controls
    function setVideoSpeed() {
      const speed = document.getElementById('speedInput').value;
      document.getElementById('vaultVideo').playbackRate = parseFloat(speed);
    }

    // Initialize 100-Day Challenge Grid
    const challengeGrid = document.getElementById('challengeGrid');
    for (let i = 1; i <= 30; i++) {
      const div = document.createElement('div');
      div.style.border = '1px solid var(--border)';
      div.style.padding = '8px';
      div.style.textAlign = 'center';
      div.style.borderRadius = '6px';
      div.innerHTML = \`<div style="font-size:10px; color:#94a3b8;">Day \${i}</div>
                       <select style="padding:2px; font-size:12px; margin-top:4px;">
                         <option>P</option>
                         <option>A</option>
                       </select>\`;
      challengeGrid.appendChild(div);
    }

    function toggleAnswerHidden() {
      document.querySelectorAll('.ans-block').forEach(el => {
        el.style.display = (el.style.display === 'none') ? 'block' : 'none';
      });
    }

    function submitDoubt() {
      document.getElementById('doubtResponse').innerText = 'Google AI Response: "The correct formula is (a+b)³ - 3ab(a+b). Applying values yields option B."';
    }
  </script>
</body>
</html>
  `);
});

// Admin Call & Login API Engine
app.post('/api/auth/login', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

  const isAdmin = (email === 'ajayraoshab751@gmail.com');

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password, name: name || 'Aspirant', loginCount: 1, isAdmin });
    } else {
      if (user.password !== password) return res.json({ success: false, message: 'Invalid Credentials!' });
      user.loginCount += 1;
    }
    await user.save();
    return res.json({ success: true, isAdmin: user.isAdmin, user });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
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
app.listen(PORT, () => console.log(`CPO AIR 1 Portal running on port ${PORT}`));
