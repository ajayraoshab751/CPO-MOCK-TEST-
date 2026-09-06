let currentLang = 'en';
let currentUser = JSON.parse(localStorage.getItem('cpo_user')) || null;

document.addEventListener("DOMContentLoaded", () => {
    if (currentUser) {
        document.getElementById('authView').classList.remove('active');
        document.getElementById('dashboardView').classList.add('active');
        if (currentUser.role === 'admin') {
            document.getElementById('adminPanel').style.display = 'block';
        }
        loadChapters();
        loadTargets();
    }
});

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    alert("Language switched to: " + currentLang.toUpperCase());
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

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    currentUser = data;
    localStorage.setItem('cpo_user', JSON.stringify(data));

    document.getElementById('authView').classList.remove('active');
    document.getElementById('dashboardView').classList.add('active');
    if (data.role === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
    }
    loadChapters();
    loadTargets();
}

function switchTab(tabName) {
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

function startChapterMock(section, chapter) {
    alert("Starting Chapter Mock Test for: " + chapter + " (" + section + ")");
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
