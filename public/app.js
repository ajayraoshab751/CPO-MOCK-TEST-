let currentLang = 'en';

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

    if (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi') {
        localStorage.setItem('cpo_user', JSON.stringify({ email, role: 'admin' }));
        alert("Admin Logged In Successfully!");
        document.getElementById('adminPanel').style.display = 'block';
    } else {
        localStorage.setItem('cpo_user', JSON.stringify({ email, role: 'student' }));
        alert("Student Logged In Successfully!");
    }
    document.getElementById('dashboardView').classList.add('active');
    document.getElementById('authView').classList.remove('active');
}

function switchTab(tabName) {
    alert("Navigating to Tab: " + tabName);
}

async function uploadMockTest() {
    const section = document.getElementById('mockSectionSelect').value;
    const title = document.getElementById('mockTitleInput').value;
    const file = document.getElementById('mockFileInput').files[0];

    const formData = new FormData();
    formData.append('section', section);
    formData.append('title', title);
    formData.append('file', file);

    const res = await fetch('/api/admin/upload-mock', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
        alert("Mock test successfully converted via AI and uploaded!");
    }
}
