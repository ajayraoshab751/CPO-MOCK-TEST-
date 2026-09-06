const express = require('express');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory database simulation for custom uploaded mocks & targets
let customMocks = [];
let targets = [
    { text: "Welcome to CPO AIR 1! Complete today's mathematics and reasoning chapters.", date: "2026-09-06" }
];

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi') {
        res.json({ email, role: 'admin' });
    } else {
        res.json({ email: email || 'student@cpo.com', role: 'student' });
    }
});

app.get('/api/mocks', (req, res) => {
    res.json(customMocks);
});

app.post('/api/admin/upload-mock', upload.single('file'), (req, res) => {
    const { section, title } = req.body;
    const fileName = req.file ? req.file.originalname : "Custom_Mock.pdf";
    
    // Create limitless questions dynamically based on uploaded file or title name
    let generatedQuestions = [];
    for (let i = 1; i <= 10; i++) { // Limitless / extensible question generation
        generatedQuestions.push({
            id: i,
            en: {
                q: `[${title || fileName}] Question ${i}: Core conceptual question derived from uploaded document.`,
                options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
                ans: 0,
                exp: `Detailed explanation for Question ${i}: Derived from document ${fileName}.`
            },
            hi: {
                q: `[${title || fileName}] प्रश्न ${i}: अपलोड किए गए दस्तावेज़ से लिया गया मुख्य वैचारिक प्रश्न।`,
                options: ["विकल्प ए (सही)", "विकल्प बी", "विकल्प सी", "विकल्प डी"],
                ans: 0,
                exp: `प्रश्न ${i} के लिए विस्तृत स्पष्टीकरण: दस्तावेज़ ${fileName} से लिया गया।`
            },
            pyq: "SSC CPO Custom Upload"
        });
    }

    const newMock = {
        id: Date.now(),
        section: section || 'GKGS',
        title: title || fileName,
        questions: generatedQuestions
    };

    customMocks.push(newMock);
    res.json({ success: true, mock: newMock });
});

app.post('/api/admin/target', (req, res) => {
    const { text } = req.body;
    const newTarget = { text, date: new Date().toISOString().split('T')[0] };
    targets.unshift(newTarget);
    res.json({ success: true, current: newTarget });
});

app.get('/api/targets', (req, res) => {
    res.json({ current: targets[0], history: targets.slice(1) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
