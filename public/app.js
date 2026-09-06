let currentLang = 'en';
let currentUser = JSON.parse(localStorage.getItem('cpo_user')) || null;

// CBT Test State
let activeQuestions = [];
let currentQIndex = 0;
let userResponses = {};
let questionStatus = {};
let questionTimes = {};
let globalTimerSeconds = 0;
let timerInterval = null;
let qTimerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
    loadChapters();
    loadTargets();
});

function checkAuthState() {
    if (currentUser && currentUser.email) {
        document.getElementById('authView').classList.remove('active');
        document.getElementById('dashboardView').classList.add('active');
        document.getElementById('logoutBtn').style.display = 'inline-block';
        
        if (currentUser.role === 'admin') {
            document.getElementById('navAdminBtn').style.display = 'block';
        }
    } else {
        document.getElementById('authView').classList.add('active');
        document.getElementById('dashboardView').classList.remove('active');
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('navAdminBtn').style.display = 'none';
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    alert("Language switched to: " + currentLang.toUpperCase());
    if (document.getElementById('cbtWorkspaceView').classList.contains('active')) {
        renderQuestion();
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    if (current === 'light') html.setAttribute('data-theme', 'dark');
    else if (current === 'dark') html.setAttribute('data-theme', 'reading');
    else html.setAttribute('data-theme', 'light');
}

function toggleReadingMode() {
    document.documentElement.setAttribute('data-theme', 'reading');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Please enter both email and password!");
        return;
    }

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    currentUser = data;
    localStorage.setItem('cpo_user', JSON.stringify(data));

    alert(data.role === 'admin' ? "Admin Logged In Successfully!" : "Student Logged In Successfully!");
    checkAuthState();
    switchTab('test');
}

function handleLogout() {
    localStorage.removeItem('cpo_user');
    currentUser = null;
    checkAuthState();
    alert("Logged out successfully!");
}

function switchTab(tabName) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('dashboardView').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    if (tabName === 'challenge') renderAttendance(30);
}

function loadChapters() {
    const chaptersData = {
        "Math": ["Number System", "Percentage", "Profit & Loss", "Discount", "Ratio & Proportion", "Averages", "Algebra", "Geometry", "Mensuration", "Trigonometry"],
        "Reasoning": ["Analogy", "Coding-Decoding", "Series", "Blood Relations", "Direction", "Syllogism", "Clock & Calendar"],
        "GK/GS": ["Ancient History", "Medieval & Modern History", "Indian Polity", "Indian & World Geography", "Economy", "Physics, Chemistry, Biology", "Static GK & Current Affairs"],
        "English": ["Grammar Parts of Speech", "Subject-Verb Agreement", "Vocabulary (Synonyms/Antonyms, OWS)", "Reading Comprehension & Cloze Test"]
    };

    let html = '';
    for (let sec in chaptersData) {
        html += `<h3>📌 ${sec} Section</h3><ul>`;
        chaptersData[sec].forEach(chap => {
            html += `<li style="margin: 8px 0;"><button onclick="startChapterMock('${sec}', '${chap}')">📝 ${chap} Mock Test</button></li>`;
        });
        html += `</ul>`;
    }
    document.getElementById('chapterContainer').innerHTML = html;
}

// --- CBT MOCK ENGINE ---
function startChapterMock(section, chapter) {
    activeQuestions = [];
    for (let i = 1; i <= 5; i++) {
        activeQuestions.push({
            id: i,
            en: {
                q: `[${chapter}] Sample Question ${i} for SSC CPO Exam?`,
                options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
                ans: 0,
                exp: `Detailed explanation for Question ${i}: The correct choice is Option A based on standard SSC CPO guidelines.`
            },
            hi: {
                q: `[${chapter}] एसएससी सीपीओ परीक्षा के लिए नमूना प्रश्न ${i}?`,
                options: ["विकल्प ए (सही)", "विकल्प बी", "विकल्प सी", "विकल्प डी"],
                ans: 0,
                exp: `प्रश्न ${i} के लिए विस्तृत स्पष्टीकरण: मानक दिशानिर्देशों के अनुसार विकल्प ए सही है।`
            },
            pyq: "SSC CPO 2024 (Tier-1)"
        });
    }

    currentQIndex = 0;
    userResponses = {};
    questionStatus = {};
    questionTimes = {};
    activeQuestions.forEach((_, idx) => {
        questionStatus[idx] = 'not-visited';
        questionTimes[idx] = 0;
    });

    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('cbtWorkspaceView').classList.add('active');
    document.getElementById('cbtTestTitle').innerText = `${section} - ${chapter} Mock Test`;

    startGlobalTimer();
    renderQuestion();
    renderPalette();
}

function startGlobalTimer() {
    globalTimerSeconds = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        globalTimerSeconds++;
        let mins = Math.floor(globalTimerSeconds / 60).toString().padStart(2, '0');
        let secs = (globalTimerSeconds % 60).toString().padStart(2, '0');
        document.getElementById('globalTimer').innerText = `⏱️ Time: ${mins}:${secs}`;
    }, 1000);

    if (qTimerInterval) clearInterval(qTimerInterval);
    qTimerInterval = setInterval(() => {
        if (questionTimes[currentQIndex] !== undefined) {
            questionTimes[currentQIndex]++;
        }
    }, 1000);
}

function renderQuestion() {
    if (questionStatus[currentQIndex] === 'not-visited') {
        questionStatus[currentQIndex] = 'not-answered';
    }

    const qData = activeQuestions[currentQIndex][currentLang];
    let html = `
        <div class="question-box">
            <span style="font-size:12px; color:#e67e22; background:#fef5e7; padding:3px 6px; border-radius:4px;">📌 PYQ: ${activeQuestions[currentQIndex].pyq}</span>
            <p>Q.${currentQIndex + 1} ${qData.q}</p>
        </div>
        <div class="options-group">
    `;

    qData.options.forEach((opt, oIdx) => {
        let checked = userResponses[currentQIndex] === oIdx ? 'checked' : '';
        html += `
            <label class="option-label">
                <input type="radio" name="qOpt" value="${oIdx}" ${checked} onchange="selectOption(${oIdx})">
                ${String.fromCharCode(65 + oIdx)}. ${opt}
            </label>
        `;
    });

    html += `</div>`;
    document.getElementById('questionContainer').innerHTML = html;
    renderPalette();
}

function selectOption(oIdx) {
    userResponses[currentQIndex] = oIdx;
    questionStatus[currentQIndex] = 'answered';
    renderPalette();
}

function nextQuestion() {
    if (currentQIndex < activeQuestions.length - 1) {
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

function markForReview() {
    questionStatus[currentQIndex] = 'marked';
    renderPalette();
    nextQuestion();
}

function jumpToQuestion(idx) {
    currentQIndex = idx;
    renderQuestion();
}

function renderPalette() {
    let html = '';
    activeQuestions.forEach((_, idx) => {
        let statusClass = 'status-not-visited';
        let st = questionStatus[idx];
        if (st === 'answered') statusClass = 'status-answered';
        else if (st === 'marked') statusClass = 'status-marked';
        else if (st === 'not-answered') statusClass = 'status-not-answered';

        html += `<button class="palette-btn ${statusClass}" onclick="jumpToQuestion(${idx})">${idx + 1}</button>`;
    });
    document.getElementById('questionPalette').innerHTML = html;
}

function submitTest() {
    if (confirm("Are you sure you want to submit the test?")) {
        clearInterval(timerInterval);
        clearInterval(qTimerInterval);

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;

        activeQuestions.forEach((q, idx) => {
            let userAns = userResponses[idx];
            if (userAns === undefined) unattempted++;
            else if (userAns === q.en.ans) correct++;
            else incorrect++;
        });

        let percentage = ((correct / activeQuestions.length) * 100).toFixed(2);
        let mins = Math.floor(globalTimerSeconds / 60);
        let secs = globalTimerSeconds % 60;

        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById('scorecardView').classList.add('active');

        document.getElementById('scorecardDetails').innerHTML = `
            <p><strong>Total Correct:</strong> <span style="color:green;">${correct}</span></p>
            <p><strong>Total Incorrect:</strong> <span style="color:red;">${incorrect}</span></p>
            <p><strong>Total Unattempted:</strong> ${unattempted}</p>
            <p><strong>Total Time Taken:</strong> ${mins}m ${secs}s</p>
            <p><strong>Final Score / Percentage:</strong> ${percentage}%</p>
        `;
    }
}

function openSolutionReview() {
    currentQIndex = 0;
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('cbtWorkspaceView').classList.add('active');
    document.getElementById('cbtTestTitle').innerText = "Detailed Solutions & Review Mode";
    renderReviewQuestion();
}

function renderReviewQuestion() {
    const q = activeQuestions[currentQIndex];
    const qData = q[currentLang];
    let userAns = userResponses[currentQIndex];

    let html = `
        <div class="question-box">
            <span style="font-size:12px; color:#e67e22;">⏱️ Time spent on this Q: ${questionTimes[currentQIndex]}s | PYQ: ${q.pyq}</span>
            <p>Q.${currentQIndex + 1} ${qData.q}</p>
        </div>
        <div class="options-group">
    `;

    qData.options.forEach((opt, oIdx) => {
        let style = "";
        if (oIdx === qData.ans) style = "background: #d4edda; border-color: #28a745; font-weight: bold;";
        else if (oIdx === userAns) style = "background: #f8d7da; border-color: #dc3545;";

        html += `<div class="option-label" style="${style}">${String.fromCharCode(65 + oIdx)}. ${opt}</div>`;
    });

    html += `</div><div style="margin-top: 15px; background: #e8f4f8; padding: 12px; border-radius: 6px;">
        <strong>💡 Explanation:</strong> ${qData.exp}
    </div>`;

    document.getElementById('questionContainer').innerHTML = html;
    renderPalette();
}

async function postAdminTarget() {
    const text = document.getElementById('adminTargetInput').value;
    const res = await fetch('/api/admin/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.success) {
        alert("Target published successfully!");
        loadTargets();
    }
}

async function loadTargets() {
    const res = await fetch('/api/targets');
    const data = await res.json();
    document.getElementById('currentTargetBox').innerHTML = `<p><strong>Current Target:</strong> ${data.current.text}</p><small>${data.current.date}</small>`;
    
    let histHtml = '';
    data.history.forEach(h => {
        histHtml += `<div style="border-left: 3px solid #1b3b6f; padding-left: 10px; margin: 10px 0;"><p>${h.text}</p><small>${h.date}</small></div>`;
    });
    document.getElementById('targetHistoryBox').innerHTML = histHtml;
}

async function uploadMock() {
    const section = document.getElementById('mockSection').value;
    const title = document.getElementById('mockTitle').value;
    const file = document.getElementById('mockFile').files[0];

    let formData = new FormData();
    formData.append('section', section);
    formData.append('title', title);
    if (file) formData.append('file', file);

    const res = await fetch('/api/admin/upload-mock', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) alert("Mock uploaded and AI converted successfully!");
}

function showAdminProfile() {
    alert("Admin Profile: Total registered candidate sessions active.");
}

function setChallengeDays(days) {
    renderAttendance(days);
}

function renderAttendance(days) {
    let html = `<div class="attendance-grid">`;
    for (let i = 1; i <= days; i++) {
        html += `<div class="day-btn day-unmarked" onclick="toggleAttendance(this)">Day ${i}</div>`;
    }
    html += `</div>`;
    document.getElementById('attendanceGrid').innerHTML = html;
}

function toggleAttendance(el) {
    if (el.classList.contains('day-unmarked')) {
        el.classList.remove('day-unmarked');
        el.classList.add('day-present');
        el.innerText += " (P)";
    } else if (el.classList.contains('day-present')) {
        el.classList.remove('day-present');
        el.classList.add('day-absent');
        el.innerText = el.innerText.replace(" (P)", " (A)");
    } else {
        el.classList.remove('day-absent');
        el.classList.add('day-unmarked');
        el.innerText = el.innerText.replace(" (A)", "");
    }
}

function solveDoubt() {
    const text = document.getElementById('doubtText').value;
    document.getElementById('doubtResult').innerHTML = `<p><strong>AI Answer:</strong> Analyzing your query "${text}"... Solution: Correct approach based on SSC CPO standards.</p>`;
}
