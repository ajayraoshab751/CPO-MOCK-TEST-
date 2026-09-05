const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));
}

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, default: 'Aspirant' },
  loginCount: { type: Number, default: 0 },
  canCall: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const mockSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String, required: true },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    solution: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const MockTest = mongoose.model('MockTest', mockSchema);

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CPO AIR 1 - CBT Exam Portal</title>
  <style>
    :root { --bg: #0b0f19; --card: #1e293b; --text: #f8fafc; --accent: #38bdf8; --border: #334155; --green: #22c55e; --red: #ef4444; --yellow: #eab308; --purple: #a855f7; }
    .light-theme { --bg: #f1f5f9; --card: #ffffff; --text: #0f172a; --accent: #0284c7; --border: #cbd5e1; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding-bottom: 90px; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .badge-icon { width: 45px; height: 45px; background: #eab308; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .logo-title { font-size: 26px; font-weight: 900; letter-spacing: 1.5px; color: var(--accent); text-transform: uppercase; }
    .menu-btn { font-size: 26px; cursor: pointer; background: none; border: none; color: var(--text); padding: 5px 10px; }
    
    .view-section { display: none; padding: 20px; max-width: 1100px; margin: 0 auto; }
    .active-view { display: block; }
    
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 65px; background: var(--card); border-top: 1px solid var(--border); display: flex; justify-content: space-around; align-items: center; z-index: 1000; }
    .nav-item { display: flex; flex-direction: column; align-items: center; font-size: 11px; color: #94a3b8; cursor: pointer; border: none; background: none; }
    .nav-item.active { color: var(--accent); font-weight: bold; }
    .nav-item span { font-size: 20px; margin-bottom: 2px; }
    
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    input, select, textarea, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px; }
    button.btn-primary { background: var(--accent); color: #0f172a; font-weight: bold; border: none; cursor: pointer; }
    
    .subject-accordion { background: var(--border); padding: 14px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 12px; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
    .chapter-list { display: none; padding-left: 15px; margin-top: 8px; }
    .chapter-item { padding: 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
    .chapter-item:hover { color: var(--accent); background: rgba(56, 189, 248, 0.05); border-radius: 6px; }

    .drawer { position: fixed; top: 0; right: -320px; width: 300px; height: 100%; background: var(--card); border-left: 1px solid var(--border); z-index: 2000; transition: right 0.3s ease; padding: 20px; box-sizing: border-box; overflow-y: auto; }
    .drawer.open { right: 0; }
    .drawer-close { font-size: 22px; cursor: pointer; text-align: right; margin-bottom: 15px; font-weight: bold; }
    .drawer-item { padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    
    .palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 15px 0; }
    .p-btn { padding: 10px; border-radius: 6px; border: none; font-weight: bold; cursor: pointer; color: white; }
    .bg-green { background: var(--green); }
    .bg-red { background: var(--red); }
    .bg-yellow { background: var(--yellow); color: #000; }
    .bg-purple { background: var(--purple); }
    .bg-gray { background: #475569; }
  </style>
</head>
<body id="appBody">

  <header>
    <div class="logo-box">
      <div class="badge-icon">👮</div>
      <div class="logo-title">CPO AIR 1</div>
    </div>
    <button class="menu-btn" id="menuToggleBtn">⋮</button>
  </header>

  <div id="sideDrawer" class="drawer">
    <div class="drawer-close" id="drawerCloseBtn">✕ Close</div>
    <h3>Portal Menu</h3>
    <div class="drawer-item" id="menuProfile">👤 Profile & Gmail OTP Verification</div>
    <div class="drawer-item" id="menuTargets">🎯 Daily Targets & Links</div>
    <div class="drawer-item" id="menuRefresh">🔄 Refresh Portal</div>
    <div class="drawer-item" id="menuTheme">🌓 Theme Switcher</div>
    <div class="drawer-item" id="menuVault">📦 PDF & Video Vault</div>
    <div class="drawer-item" id="menuLogout" style="color: var(--red);">🚪 Logout Session</div>
  </div>

  <!-- AUTH VIEW -->
  <div id="authView" class="view-section active-view">
    <div class="card" style="max-width: 420px; margin: 40px auto;">
      <h2 style="text-align:center;">CPO AIR 1 Aspirant Portal</h2>
      <div id="loginForm">
        <input type="email" id="emailInput" placeholder="Enter Gmail Address" />
        <input type="text" id="nameInput" placeholder="Enter Full Name" />
        <button type="button" id="loginBtn" class="btn-primary">Secure Login / Register</button>
      </div>
      <div id="authMsg" style="margin-top:15px; text-align:center; font-weight:bold;"></div>
    </div>
  </div>

  <!-- TEST VIEW -->
  <div id="testView" class="view-section">
    <h2>CPO & CGL Tier-1 CBT Mock Test Center</h2>
    <div id="adminUploadPanel" style="display:none;" class="card">
      <h3 style="color: var(--accent);">👑 Admin Mock & File Parser Hub</h3>
      <form id="uploadMockForm">
        <input type="text" id="mockTitle" placeholder="Mock Test Title" />
        <select id="mockSubject">
          <option value="">Select Subject</option>
          <option value="Math">Quantitative Aptitude (Maths)</option>
          <option value="Reasoning">Reasoning Ability</option>
          <option value="GKGS">GK / GS & Current Affairs</option>
          <option value="English">English Language</option>
        </select>
        <input type="text" id="mockChapter" placeholder="Chapter Name" />
        <textarea id="rawParserInput" rows="4" placeholder="Paste questions or notes here..."></textarea>
        <button type="submit" class="btn-primary">Publish Mock Test</button>
      </form>
    </div>

    <div id="chapterContainer">
      <div class="subject-accordion" data-target="mathAcc"><span>📐 Quantitative Aptitude (Maths)</span><span>▼</span></div>
      <div id="mathAcc" class="chapter-list">
        <div class="chapter-item" data-sub="Math" data-chap="Divisibility, Unit digit, Remainders, LCM & HCF"><span>Divisibility, Unit digit, Remainders, LCM & HCF</span> <span>Start ➔</span></div>
        <div class="chapter-item" data-sub="Math" data-chap="Percentage"><span>Percentage</span> <span>Start ➔</span></div>
        <div class="chapter-item" data-sub="Math" data-chap="Profit, Loss & Discount"><span>Profit, Loss & Discount</span> <span>Start ➔</span></div>
      </div>
      <div class="subject-accordion" data-target="reasoningAcc"><span>🧠 Reasoning Ability</span><span>▼</span></div>
      <div id="reasoningAcc" class="chapter-list">
        <div class="chapter-item" data-sub="Reasoning" data-chap="Analogy & Classification"><span>Analogy & Classification</span> <span>Start ➔</span></div>
      </div>
    </div>

    <div id="cbtExamArena" style="display:none;" class="card">
      <h3 id="cbtTestTitle">Mock Exam</h3>
      <div id="questionContainer"></div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-primary" id="prevQBtn">Previous</button>
        <button class="btn-primary" id="nextQBtn" style="background:var(--accent);">Save & Next</button>
        <button class="btn-primary" id="submitMockBtn" style="background:var(--green); color:#fff;">Submit Test</button>
      </div>
      <div id="paletteGrid" class="palette-grid"></div>
    </div>
  </div>

  <!-- LEADERBOARD VIEW -->
  <div id="leaderboardView" class="view-section">
    <h2>🏆 Leaderboard & Performance Analytics</h2>
    <div class="card"><p>Your Rank Matrix & Score Analytics</p></div>
  </div>

  <!-- CHALLENGE VIEW -->
  <div id="challengeView" class="view-section">
    <h2>📅 Challenge Tracker</h2>
    <div class="card"><div id="challengeGrid"></div></div>
  </div>

  <!-- SAVED VIEW -->
  <div id="savedView" class="view-section">
    <h2>⭐ Saved Questions Vault</h2>
    <div class="card"><p>No saved questions yet.</p></div>
  </div>

  <!-- DOUBT VIEW -->
  <div id="doubtView" class="view-section">
    <h2>💬 Doubt Resolution Hub</h2>
    <div class="card"><textarea placeholder="Type your doubt..."></textarea><button class="btn-primary">Submit</button></div>
  </div>

  <!-- PROFILE VIEW -->
  <div id="profileView" class="view-section">
    <h2>👤 Aspirant Profile</h2>
    <div class="card">
      <p><b>Email:</b> <span id="profileEmail"></span></p>
      <p><b>Login Count:</b> <span id="profileLogins"></span></p>
      <p><b>Call Permission:</b> <span id="profileCallPerm"></span></p>
    </div>
  </div>

  <!-- TARGET VIEW -->
  <div id="targetView" class="view-section">
    <h2>🎯 Daily Targets</h2>
    <div class="card"><p>Complete daily assignments.</p></div>
  </div>

  <!-- VAULT VIEW -->
  <div id="vaultView" class="view-section">
    <h2>📦 PDF Vault</h2>
    <div class="card"><button class="btn-primary">Download Formula PDF</button></div>
  </div>

  <div id="bottomNav" class="bottom-nav" style="display:none;">
    <button class="nav-item active" data-view="testView"><span>📝</span>TEST</button>
    <button class="nav-item" data-view="leaderboardView"><span>🏆</span>LEADERBOARD</button>
    <button class="nav-item" data-view="challengeView"><span>📅</span>CHALLENGE</button>
    <button class="nav-item" data-view="savedView"><span>⭐</span>SAVED</button>
    <button class="nav-item" data-view="doubtView"><span>💬</span>DOUBTS</button>
  </div>

  <script>
    let currentUser = null;
    let currentQuestions = [];
    let currentQIndex = 0;
    let userAnswers = {};
    let questionStatus = {};

    window.addEventListener('DOMContentLoaded', () => {
      const savedUser = localStorage.getItem('cpo_user');
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        bootPortal();
      }

      // Safe Login Button Handler (No Form Postback Freeze)
      document.getElementById('loginBtn').addEventListener('click', () => {
        const email = document.getElementById('emailInput').value.trim();
        const name = document.getElementById('nameInput').value.trim();
        const msg = document.getElementById('authMsg');

        if (!email || !name) {
          msg.style.color = '#ef4444';
          msg.innerText = 'Please enter both Email and Name.';
          return;
        }

        const isAdmin = (email === 'ajayraoshab751@gmail.com');
        currentUser = { email, name, loginCount: 1, isAdmin, canCall: isAdmin };
        localStorage.setItem('cpo_user', JSON.stringify(currentUser));

        msg.style.color = '#22c55e';
        msg.innerText = 'Login successful! Launching portal...';

        setTimeout(bootPortal, 300);
      });

      // UI Navigation Events
      document.getElementById('menuToggleBtn').addEventListener('click', toggleDrawer);
      document.getElementById('drawerCloseBtn').addEventListener('click', toggleDrawer);
      document.getElementById('menuProfile').addEventListener('click', () => { switchView('profileView'); toggleDrawer(); });
      document.getElementById('menuTargets').addEventListener('click', () => { switchView('targetView'); toggleDrawer(); });
      document.getElementById('menuRefresh').addEventListener('click', () => location.reload());
      document.getElementById('menuTheme').addEventListener('click', () => document.getElementById('appBody').classList.toggle('light-theme'));
      document.getElementById('menuVault').addEventListener('click', () => { switchView('vaultView'); toggleDrawer(); });
      document.getElementById('menuLogout').addEventListener('click', () => { localStorage.removeItem('cpo_user'); location.reload(); });

      document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          switchView(btn.getAttribute('data-view'));
        });
      });

      document.querySelectorAll('.subject-accordion').forEach(acc => {
        acc.addEventListener('click', () => {
          const el = document.getElementById(acc.getAttribute('data-target'));
          el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        });
      });

      document.querySelectorAll('.chapter-item').forEach(item => {
        item.addEventListener('click', () => {
          openMock(item.getAttribute('data-sub'), item.getAttribute('data-chap'));
        });
      });

      document.getElementById('nextQBtn').addEventListener('click', nextQuestion);
      document.getElementById('prevQBtn').addEventListener('click', prevQuestion);
      document.getElementById('submitMockBtn').addEventListener('click', submitMock);
    });

    function bootPortal() {
      document.getElementById('authView').classList.remove('active-view');
      document.getElementById('testView').classList.add('active-view');
      document.getElementById('bottomNav').style.display = 'flex';
      
      document.getElementById('profileEmail').innerText = currentUser.email;
      document.getElementById('profileLogins').innerText = currentUser.loginCount || 1;
      document.getElementById('profileCallPerm').innerText = currentUser.canCall ? 'Allowed ✅' : 'Restricted ❌';

      if (currentUser.isAdmin) {
        document.getElementById('adminUploadPanel').style.display = 'block';
      }
    }

    function switchView(viewId) {
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
      document.getElementById(viewId).classList.add('active-view');
    }

    function toggleDrawer() {
      document.getElementById('sideDrawer').classList.toggle('open');
    }

    function openMock(subject, chapter) {
      currentQuestions = [
        { questionText: 'Sample Question 1 for ' + chapter, options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0, solution: "Verified solution." },
        { questionText: 'Sample Question 2 for ' + chapter, options: ["100", "200", "300", "400"], correctAnswer: 2, solution: "Calculated correctly." }
      ];
      currentQIndex = 0;
      userAnswers = {};
      questionStatus = {};
      document.getElementById('chapterContainer').style.display = 'none';
      document.getElementById('cbtExamArena').style.display = 'block';
      document.getElementById('cbtTestTitle').innerText = chapter;
      renderQuestion();
      renderPalette();
    }

    function renderQuestion() {
      const q = currentQuestions[currentQIndex];
      let html = '<h4>Question ' + (currentQIndex + 1) + ' of ' + currentQuestions.length + '</h4>';
      html += '<p style="font-weight:600;">' + q.questionText + '</p>';
      q.options.forEach((opt, idx) => {
        const checked = userAnswers[currentQIndex] === idx ? 'checked' : '';
        html += '<label style="display:block; margin:8px 0; cursor:pointer;"><input type="radio" name="qOpt" ' + checked + ' onclick="userAnswers[' + currentQIndex + ']=' + idx + '" /> ' + opt + '</label>';
      });
      document.getElementById('questionContainer').innerHTML = html;
    }

    function nextQuestion() {
      if (currentQIndex < currentQuestions.length - 1) {
        currentQIndex++;
        renderQuestion();
      }
    }

    function prevQuestion() {
      if (currentQIndex > 0) {
        currentQIndex--;
        renderQuestion();
      }
    }

    function renderPalette() {
      let html = '';
      currentQuestions.forEach((_, idx) => {
        html += '<button class="p-btn bg-gray" onclick="currentQIndex=' + idx + ';renderQuestion();">' + (idx + 1) + '</button>';
      });
      document.getElementById('paletteGrid').innerHTML = html;
    }

    function submitMock() {
      alert('Mock Test Submitted Successfully!');
      document.getElementById('cbtExamArena').style.display = 'none';
      document.getElementById('chapterContainer').style.display = 'block';
    }
  </script>
</body>
</html>`);
});

app.post('/api/auth/login', async (req, res) => {
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
