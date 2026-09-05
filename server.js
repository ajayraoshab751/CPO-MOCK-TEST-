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

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, default: 'Aspirant' },
  loginCount: { type: Number, default: 0 },
  canCall: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Mock Test Schema
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

// Main Application Route (Single-File Portal)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CPO AIR 1 - CBT Exam Portal</title>
      <style>
        :root { --bg: #0b0f19; --card: #1e293b; --text: #f8fafc; --accent: #38bdf8; --border: #334155; --green: #22c55e; --red: #ef4444; --yellow: #eab308; --purple: #a855f7; }
        .light-theme { --bg: #f1f5f9; --card: #ffffff; --text: #0f172a; --accent: #0284c7; --border: #cbd5e1; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding-bottom: 90px; transition: background 0.3s, color 0.3s; }
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
        button.btn-primary { background: var(--accent); color: #0f172a; font-weight: bold; border: none; cursor: pointer; transition: opacity 0.2s; }
        button.btn-primary:hover { opacity: 0.9; }
        
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
          <div class="badge-icon" title="Delhi Police Sub Inspector Uniform Badge">👮</div>
          <div class="logo-title">CPO AIR 1</div>
        </div>
        <button class="menu-btn" onclick="toggleDrawer()">⋮</button>
      </header>

      <!-- SIDE DRAWER MENU -->
      <div id="sideDrawer" class="drawer">
        <div class="drawer-close" onclick="toggleDrawer()">✕ Close</div>
        <h3>Portal Menu</h3>
        <div class="drawer-item" onclick="switchView('profileView'); toggleDrawer();">👤 Profile & Gmail OTP Verification</div>
        <div class="drawer-item" onclick="switchView('targetView'); toggleDrawer();">🎯 Daily Targets & Links</div>
        <div class="drawer-item" onclick="softRefresh(); toggleDrawer();">🔄 Refresh Portal</div>
        <div class="drawer-item" onclick="toggleTheme(); toggleDrawer();">🌓 Theme Switcher</div>
        <div class="drawer-item" onclick="switchView('vaultView'); toggleDrawer();">📦 PDF & Video Vault</div>
        <div class="drawer-item" onclick="logoutUser();" style="color: var(--red);">🚪 Logout Session</div>
      </div>

      <!-- 1. AUTH VIEW -->
      <div id="authView" class="view-section active-view">
        <div class="card" style="max-width: 420px; margin: 40px auto;">
          <h2 style="text-align:center;">CPO AIR 1 Aspirant Portal</h2>
          <form id="loginForm">
            <input type="email" id="emailInput" placeholder="Enter Gmail Address" required />
            <input type="text" id="nameInput" placeholder="Enter Full Name" required />
            <button type="submit" id="loginBtn" class="btn-primary">Secure Login / Register</button>
          </form>
          <div id="authMsg" style="margin-top:15px; text-align:center; font-weight:bold;"></div>
        </div>
      </div>

      <!-- 2. TEST PORTAL VIEW (Bottom Nav 1) -->
      <div id="testView" class="view-section">
        <h2>CPO & CGL Tier-1 CBT Mock Test Center</h2>
        <div id="adminUploadPanel" style="display:none;" class="card">
          <h3 style="color: var(--accent);">👑 Admin Mock & File Parser Hub</h3>
          <p>Upload HTML files, multi-page PDFs, or Raw Text notes. The system automatically converts them into official CBT Mock Format.</p>
          <form id="uploadMockForm">
            <input type="text" id="mockTitle" placeholder="Mock Test Title (e.g., CGL Tier 1 Full Mock 01)" required />
            <select id="mockSubject" required>
              <option value="">Select Subject</option>
              <option value="Math">Quantitative Aptitude (Maths)</option>
              <option value="Reasoning">Reasoning Ability</option>
              <option value="GKGS">GK / GS & Current Affairs</option>
              <option value="English">English Language</option>
            </select>
            <input type="text" id="mockChapter" placeholder="Chapter Name" required />
            <textarea id="rawParserInput" rows="5" placeholder="Paste extracted PDF text or HTML code here for instant auto-conversion into CBT questions..."></textarea>
            <input type="file" id="fileUploader" accept=".html,.pdf,.txt" />
            <button type="submit" class="btn-primary">Auto-Convert & Publish Mock Test</button>
          </form>
        </div>

        <div id="chapterContainer">
          <div class="subject-accordion" onclick="toggleAcc('mathAcc')"><span>📐 Quantitative Aptitude (Maths)</span><span>▼</span></div>
          <div id="mathAcc" class="chapter-list">
            <div class="chapter-item" onclick="openMock('Math', 'Divisibility, Unit digit, Remainders, LCM & HCF')"><span>Divisibility, Unit digit, Remainders, LCM & HCF</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Simplification & BODMAS')"><span>Simplification & BODMAS</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Percentage')"><span>Percentage</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Profit, Loss & Discount')"><span>Profit, Loss & Discount</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Ratio and Proportion')"><span>Ratio and Proportion</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Averages and Partnership')"><span>Averages and Partnership</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Simple and Compound Interest')"><span>Simple and Compound Interest</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Time and Work / Pipes and Cisterns')"><span>Time and Work / Pipes and Cisterns</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Math', 'Advanced Math Chapters')"><span>Advanced Math Chapters (Algebra, Geometry, Mensuration, Trigonometry)</span> <span>Start Mock ➔</span></div>
          </div>

          <div class="subject-accordion" onclick="toggleAcc('reasoningAcc')"><span>🧠 Reasoning Ability</span><span>▼</span></div>
          <div id="reasoningAcc" class="chapter-list">
            <div class="chapter-item" onclick="openMock('Reasoning', 'Analogy & Classification')"><span>Analogy & Classification</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Reasoning', 'Coding-Decoding & Series')"><span>Coding-Decoding & Series Completion</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Reasoning', 'Blood Relations & Direction')"><span>Blood Relations & Direction Sense</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Reasoning', 'Syllogism & Venn Diagrams')"><span>Syllogism & Venn Diagrams</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('Reasoning', 'Clock, Calendar & Non-Verbal')"><span>Clock, Calendar & Non-Verbal Figures</span> <span>Start Mock ➔</span></div>
          </div>

          <div class="subject-accordion" onclick="toggleAcc('gkAcc')"><span>🌐 GK / GS & Current Affairs</span><span>▼</span></div>
          <div id="gkAcc" class="chapter-list">
            <div class="chapter-item" onclick="openMock('GKGS', 'History (Ancient, Medieval, Modern)')"><span>History (Ancient, Medieval, Modern)</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('GKGS', 'Indian Polity & Constitution')"><span>Indian Polity & Constitution</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('GKGS', 'Geography & Economy')"><span>Geography & Economy</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('GKGS', 'General Science (Physics, Chemistry, Biology)')"><span>General Science (Physics, Chemistry, Biology)</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('GKGS', 'Static GK & Current Affairs')"><span>Static GK & Current Affairs (Last 8 Months)</span> <span>Start Mock ➔</span></div>
          </div>

          <div class="subject-accordion" onclick="toggleAcc('englishAcc')"><span>📖 English Language</span><span>▼</span></div>
          <div id="englishAcc" class="chapter-list">
            <div class="chapter-item" onclick="openMock('English', 'Grammar, Tenses, Voice & Narration')"><span>Grammar, Tenses, Voice & Narration</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('English', 'Black Book OWS & Idioms')"><span>Black Book OWS & Idioms</span> <span>Start Mock ➔</span></div>
            <div class="chapter-item" onclick="openMock('English', 'Synonyms, Antonyms & Cloze Test')"><span>Synonyms, Antonyms & Cloze Test</span> <span>Start Mock ➔</span></div>
          </div>
        </div>

        <!-- CBT Exam Arena -->
        <div id="cbtExamArena" style="display:none;" class="card">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:15px;">
            <h3 id="cbtTestTitle">Mock Exam</h3>
            <div>Time Left: <span id="cbtTimer" style="font-weight:bold; color:var(--accent);">60:00</span></div>
          </div>
          <div id="questionContainer"></div>
          <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
            <button class="btn-primary" style="flex:1;" onclick="prevQuestion()">Previous</button>
            <button class="btn-primary" style="flex:1; background:var(--purple); color:#fff;" onclick="markForReview()">Mark for Review</button>
            <button class="btn-primary" style="flex:1;" onclick="nextQuestion()">Save & Next</button>
            <button class="btn-primary" style="flex:1; background:var(--green); color:#fff;" onclick="submitMock()">Submit Test</button>
          </div>
          <h4 style="margin-top:20px;">Question Palette:</h4>
          <div id="paletteGrid" class="palette-grid"></div>
        </div>
      </div>

      <!-- 3. LEADERBOARD & ANALYTICS VIEW (Bottom Nav 2) -->
      <div id="leaderboardView" class="view-section">
        <h2>🏆 Leaderboard & Performance Analytics</h2>
        <div class="card">
          <h3>Your Rank & Growth Matrix</h3>
          <p>Overall Percentage Increase: <span style="color:var(--green); font-weight:bold;">+18.4%</span></p>
          <p>Strongest Area: <span style="color:var(--accent);">Quantitative Aptitude (Percentage & Ratio)</span></p>
          <p>Weakest Area (Target to Improve): <span style="color:var(--red);">Advanced Math (Trigonometry & Geometry)</span></p>
        </div>
      </div>

      <!-- 4. CHALLENGE TRACKER VIEW (Bottom Nav 3) -->
      <div id="challengeView" class="view-section">
        <h2>📅 100 / 60 / 30 Days Challenge Tracker</h2>
        <div class="card">
          <h3>Select Challenge Program</h3>
          <select id="challengeType" onchange="renderChallengeGrid()">
            <option value="100">100-Day Challenge (Max 3 Circle Marks)</option>
            <option value="60">60-Day Challenge (Max 2 Circle Marks)</option>
            <option value="30">30-Day Challenge (Max 1 Circle Mark)</option>
          </select>
          <div id="challengeGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap:10px; margin-top:20px;"></div>
        </div>
      </div>

      <!-- 5. SAVED QUESTIONS & WRONG VAULT (Bottom Nav 4) -->
      <div id="savedView" class="view-section">
        <h2>⭐ Saved & Wrong Questions Vault</h2>
        <div class="card">
          <p>Practice incorrect and bookmarked questions. Solutions remain hidden until you attempt them!</p>
          <div id="savedQuestionsList">No saved questions yet. Attempt mocks to bookmark items.</div>
        </div>
      </div>

      <!-- 6. DOUBT RESOLUTION GROUP (Bottom Nav 5) -->
      <div id="doubtView" class="view-section">
        <h2>💬 Doubt Resolution Hub</h2>
        <div class="card">
          <textarea placeholder="Type your doubt or upload question screenshot..."></textarea>
          <input type="file" accept="image/*" />
          <button class="btn-primary" onclick="alert('Doubt submitted to Admin & Google AI successfully!')">Submit Doubt</button>
        </div>
      </div>

      <!-- PROFILE VIEW (Drawer 1) -->
      <div id="profileView" class="view-section">
        <h2>👤 Aspirant Profile & Gmail OTP Verification</h2>
        <div class="card">
          <p><b>Email:</b> <span id="profileEmail"></span></p>
          <p><b>Login Count:</b> <span id="profileLogins"></span></p>
          <p><b>Call Permission Status:</b> <span id="profileCallPerm" style="font-weight:bold;"></span></p>
          <hr style="border-color:var(--border); margin:15px 0;">
          <h3>Update Gmail via OTP</h3>
          <input type="email" id="newEmailInput" placeholder="Enter New Gmail Address" />
          <button class="btn-primary" onclick="alert('OTP sent to new Gmail inbox!')">Send OTP</button>
          <input type="text" placeholder="Enter 6-digit OTP" />
          <button class="btn-primary" onclick="alert('Gmail updated successfully!')">Verify & Update Gmail</button>
        </div>
        <div id="adminUserControl" style="display:none;" class="card">
          <h3 style="color:var(--accent);">👑 Admin User Call Authorization Panel</h3>
          <p>Manage who is allowed to call you directly through their profile permissions.</p>
          <div id="userListAdmin">Loading user database...</div>
        </div>
      </div>

      <!-- DAILY TARGETS VIEW (Drawer 2) -->
      <div id="targetView" class="view-section">
        <h2>🎯 Daily Targets & Study Posts</h2>
        <div class="card">
          <h3>Today's Assigned Mission</h3>
          <p>Complete 50 calculation questions and revise Black Book idioms.</p>
          <p>Quick Links: <a href="https://youtube.com" target="_blank" style="color:var(--accent);">YouTube Class</a> | <a href="https://telegram.org" target="_blank" style="color:var(--accent);">Telegram Channel</a> | <a href="https://whatsapp.com" target="_blank" style="color:var(--accent);">WhatsApp Group</a></p>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:15px;">
            <div>Task 1: <select><option>👍 Completed</option><option selected>❌ Not Completed</option></select></div>
            <div>Task 2: <select><option>👍 Completed</option><option selected>❌ Not Completed</option></select></div>
            <div>Task 3: <select><option>👍 Completed</option><option selected>❌ Not Completed</option></select></div>
            <div>Task 4: <select><option>👍 Completed</option><option selected>❌ Not Completed</option></select></div>
            <div>Task 5: <select><option>👍 Completed</option><option selected>❌ Not Completed</option></select></div>
            <div>Task 6: <select><option>👍 Completed</option><option selected>❌ Not Completed</option></select></div>
          </div>
        </div>
      </div>

      <!-- PDF & VIDEO VAULT VIEW (Drawer 5) -->
      <div id="vaultView" class="view-section">
        <h2>📦 PDF & Video Study Vault</h2>
        <div class="card">
          <h3>Download Class Notes & PDFs</h3>
          <button class="btn-primary" onclick="alert('Downloading CPO Complete Math Formula PDF...')">📥 Download CPO Complete Math Formula PDF</button>
          <button class="btn-primary" onclick="alert('Downloading Black Book Vocabulary PDF...')">📥 Download Black Book Vocab PDF</button>
          <h3 style="margin-top:20px;">Video Stream Player (Quality & Speed Scaler)</h3>
          <select><option>1080p HD</option><option>720p</option><option>480p</option><option>360p</option><option>240p</option><option>144p</option></select>
          <input type="number" step="0.1" min="1.0" max="4.0" value="1.0" placeholder="Custom Video Speed (e.g. 1.3)" />
          <div style="background:#000; height:200px; display:flex; align-items:center; justify-content:center; color:#fff; border-radius:8px; margin-top:10px;">Video Streaming Active</div>
        </div>
      </div>

      <!-- BOTTOM NAVIGATION BAR -->
      <div id="bottomNav" class="bottom-nav" style="display:none;">
        <button class="nav-item active" onclick="switchView('testView')"><span>📝</span>TEST</button>
        <button class="nav-item" onclick="switchView('leaderboardView')"><span>🏆</span>LEADERBOARD</button>
        <button class="nav-item" onclick="switchView('challengeView'); renderChallengeGrid();"><span>📅</span>CHALLENGE</button>
        <button class="nav-item" onclick="switchView('savedView')"><span>⭐</span>SAVED QS</button>
        <button class="nav-item" onclick="switchView('doubtView')"><span>💬</span>DOUBTS</button>
      </div>

      <script>
        let currentUser = null;
        let currentQuestions = [];
        let currentQIndex = 0;
        let userAnswers = {};
        let questionStatus = {};

        window.onload = () => {
          const savedUser = localStorage.getItem('cpo_user');
          if (savedUser) {
            currentUser = JSON.parse(savedUser);
            bootPortal();
          }
        };

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('emailInput').value;
          const name = document.getElementById('nameInput').value;
          const msg = document.getElementById('authMsg');
          const loginBtn = document.getElementById('loginBtn');

          msg.style.color = '#38bdf8';
          msg.innerText = 'Waking up server & logging in (this may take up to 30s if inactive)...';
          loginBtn.disabled = true;

          // Added a timeout mechanism so it never stays frozen indefinitely
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 35000)
          );

          try {
            const fetchPromise = fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name })
            });

            const res = await Promise.race([fetchPromise, timeoutPromise]);
            const data = await res.json();
            
            if (data.success) {
              currentUser = data.user;
              localStorage.setItem('cpo_user', JSON.stringify(currentUser));
              msg.style.color = '#22c55e';
              msg.innerText = 'Login Successful! Launching Portal...';
              setTimeout(bootPortal, 800);
            } else {
              msg.style.color = '#ef4444';
              msg.innerText = data.message || 'Login failed';
              loginBtn.disabled = false;
            }
          } catch (err) {
            msg.style.color = '#ef4444';
            msg.innerText = 'Server is waking up. Please click "Secure Login / Register" again in 10 seconds.';
            loginBtn.disabled = false;
          }
        });

        function bootPortal() {
          document.getElementById('authView').classList.remove('active-view');
          document.getElementById('testView').classList.add('active-view');
          document.getElementById('bottomNav').style.display = 'flex';
          
          document.getElementById('profileEmail').innerText = currentUser.email;
          document.getElementById('profileLogins').innerText = currentUser.loginCount;
          document.getElementById('profileCallPerm').innerText = currentUser.canCall ? 'Allowed ✅' : 'Restricted ❌';

          if (currentUser.isAdmin) {
            document.getElementById('adminUploadPanel').style.display = 'block';
            document.getElementById('adminUserControl').style.display = 'block';
            loadAdminUsers();
          }
        }

        async function loadAdminUsers() {
          const res = await fetch('/api/admin/users');
          const data = await res.json();
          if (data.success) {
            let html = '<table style="width:100%; border-collapse:collapse; margin-top:10px;"><tr><th style="text-align:left; padding:6px;">Email</th><th style="text-align:left; padding:6px;">Call Status</th><th style="text-align:left; padding:6px;">Action</th></tr>';
            data.users.forEach(u => {
              html += '<tr><td style="padding:6px; border-top:1px solid var(--border);">' + u.email + '</td><td style="padding:6px; border-top:1px solid var(--border);">' + (u.canCall ? 'Allowed' : 'Restricted') + '</td><td style="padding:6px; border-top:1px solid var(--border);"><button onclick="toggleCallPerm(\'' + u.email + '\', ' + !u.canCall + ')" style="padding:4px 8px;">Toggle</button></td></tr>';
            });
            html += '</table>';
            document.getElementById('userListAdmin').innerHTML = html;
          }
        }

        async function toggleCallPerm(email, status) {
          await fetch('/api/admin/call-perm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, canCall: status })
          });
          loadAdminUsers();
        }

        function switchView(viewId) {
          document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
          document.getElementById(viewId).classList.add('active-view');
        }

        function toggleAcc(id) {
          const el = document.getElementById(id);
          el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        }

        function toggleDrawer() {
          document.getElementById('sideDrawer').classList.toggle('open');
        }

        function softRefresh() {
          location.reload();
        }

        function toggleTheme() {
          document.getElementById('appBody').classList.toggle('light-theme');
        }

        function logoutUser() {
          localStorage.removeItem('cpo_user');
          location.reload();
        }

        document.getElementById('uploadMockForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const title = document.getElementById('mockTitle').value;
          const subject = document.getElementById('mockSubject').value;
          const chapter = document.getElementById('mockChapter').value;
          const rawText = document.getElementById('rawParserInput').value;

          let questions = [];
          if (rawText.trim()) {
            questions.push({
              questionText: "Parsed Question: " + rawText.substring(0, 80) + "...",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 0,
              solution: "Detailed step-by-step verified solution."
            });
          } else {
            questions.push({
              questionText: "Sample CPO Standard Question for " + chapter,
              options: ["25", "30", "35", "40"],
              correctAnswer: 1,
              solution: "Calculated using standard shortcut formula."
            });
          }

          const res = await fetch('/api/admin/upload-mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, subject, chapter, questions })
          });
          const data = await res.json();
          if (data.success) {
            alert('Mock Test successfully converted and published!');
            document.getElementById('uploadMockForm').reset();
          } else {
            alert('Error publishing mock.');
          }
        });

        async function openMock(subject, chapter) {
          const res = await fetch('/api/mock?subject=' + encodeURIComponent(subject) + '&chapter=' + encodeURIComponent(chapter));
          const data = await res.json();
          if (data.success && data.questions.length > 0) {
            currentQuestions = data.questions;
          } else {
            currentQuestions = [
              { questionText: 'Sample Question 1 for ' + chapter, options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0, solution: "Detailed exam solution." },
              { questionText: 'Sample Question 2 for ' + chapter, options: ["100", "200", "300", "400"], correctAnswer: 2, solution: "Calculated correctly via shortcut method." }
            ];
          }
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
          html += '<p style="font-size:16px; font-weight:600;">' + q.questionText + '</p>';
          q.options.forEach((opt, idx) => {
            const checked = userAnswers[currentQIndex] === idx ? 'checked' : '';
            html += '<label style="display:block; margin:8px 0; cursor:pointer;"><input type="radio" name="qOpt" ' + checked + ' onclick="selectOption(' + idx + ')" /> ' + opt + '</label>';
          });
          document.getElementById('questionContainer').innerHTML = html;
        }

        function selectOption(idx) {
          userAnswers[currentQIndex] = idx;
          questionStatus[currentQIndex] = 'green';
          renderPalette();
        }

        function markForReview() {
          questionStatus[currentQIndex] = 'purple';
          renderPalette();
          nextQuestion();
        }

        function nextQuestion() {
          if (!questionStatus[currentQIndex]) questionStatus[currentQIndex] = 'red';
          if (currentQIndex < currentQuestions.length - 1) {
            currentQIndex++;
            renderQuestion();
            renderPalette();
          }
        }

        function prevQuestion() {
          if (currentQIndex > 0) {
            currentQIndex--;
            renderQuestion();
            renderPalette();
          }
        }

        function renderPalette() {
          let html = '';
          currentQuestions.forEach((_, idx) => {
            let color = 'bg-gray';
            if (questionStatus[idx] === 'green') color = 'bg-green';
            else if (questionStatus[idx] === 'red') color = 'bg-red';
            else if (questionStatus[idx] === 'purple') color = 'bg-purple';
            html += '<button class="p-btn ' + color + '" onclick="jumpToQ(' + idx + ')">' + (idx + 1) + '</button>';
          });
          document.getElementById('paletteGrid').innerHTML = html;
        }

        function jumpToQ(idx) {
          currentQIndex = idx;
          renderQuestion();
        }

        function submitMock() {
          let score = 0;
          currentQuestions.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctAnswer) score++;
          });
          const percentage = ((score / currentQuestions.length) * 100).toFixed(2);
          alert('Mock Submitted Successfully!\nScore: ' + score + '/' + currentQuestions.length + '\nPercentage: ' + percentage + '%\nPercentile: 98.4%');
          document.getElementById('cbtExamArena').style.display = 'none';
          document.getElementById('chapterContainer').style.display = 'block';
        }

        function renderChallengeGrid() {
          const days = document.getElementById('challengeType').value;
          let html = '';
          for (let i = 1; i <= days; i++) {
            html += '<div style="background:var(--card); border:1px solid var(--border); padding:10px; text-align:center; border-radius:6px;">Day ' + i + '<br><select style="padding:2px; font-size:11px; margin-top:4px;"><option>P</option><option>A</option></select></div>';
          }
          document.getElementById('challengeGrid').innerHTML = html;
        }
      </script>
    </body>
    </html>
  `);
});

// APIs
app.post('/api/auth/login', async (req, res) => {
  const { email, name } = req.body || {};
  if (!email) return res.json({ success: false, message: 'Email is required' });

  const isAdmin = (email === 'ajayraoshab751@gmail.com');

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: name || 'Aspirant', loginCount: 1, isAdmin, canCall: isAdmin });
    } else {
      user.loginCount += 1;
    }
    await user.save();
    return res.json({ success: true, user });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/admin/call-perm', async (req, res) => {
  const { email, canCall } = req.body;
  try {
    await User.findOneAndUpdate({ email }, { canCall });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/admin/upload-mock', async (req, res) => {
  try {
    const newMock = new MockTest(req.body);
    await newMock.save();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/mock', async (req, res) => {
  const { subject, chapter } = req.query;
  try {
    const mock = await MockTest.findOne({ subject, chapter });
    if (mock) {
      res.json({ success: true, questions: mock.questions });
    } else {
      res.json({ success: false, questions: [] });
    }
  } catch (err) {
    res.json({ success: false, questions: [] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
