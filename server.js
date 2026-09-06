const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

let db = {
    users: [],
    registrations: 0,
    targets: [{ text: "Target: Score 160+ in CPO Tier-1 Mock Tests!", date: new Date().toISOString() }],
    targetHistory: [],
    mocks: [],
    videos: [],
    challenges: {}
};

// Admin & User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.registrations++;
    if (email === 'ajayraoshab751@gmail.com' && password === 'sunitadevi') {
        res.json({ success: true, role: 'admin', email });
    } else {
        res.json({ success: true, role: 'student', email });
    }
});

// Admin Target Broadcast
app.post('/api/admin/target', (req, res) => {
    const { text } = req.body;
    db.targetHistory.push(db.targets[0]);
    db.targets[0] = { text, date: new Date().toISOString() };
    res.json({ success: true, targets: db.targets });
});

app.get('/api/targets', (req, res) => {
    res.json({ current: db.targets[0], history: db.targetHistory });
});

// Upload Mock Test (PDF / HTML / Limitless AI simulation)
app.post('/api/admin/upload-mock', upload.single('file'), (req, res) => {
    const { section, chapter, title } = req.body;
    const sampleQuestions = [
        {
            id: 1,
            en: { q: "Sample Question for " + chapter, options: ["A", "B", "C", "D"], ans: 0, exp: "Detailed explanation..." },
            hi: { q: chapter + " के लिए नमूना प्रश्न", options: ["ए", "बी", "सी", "डी"], ans: 0, exp: "विस्तृत स्पष्टीकरण..." },
            pyq: "SSC CPO 2024"
        }
    ];
    const newMock = { id: Date.now(), section, chapter, title, questions: sampleQuestions };
    db.mocks.push(newMock);
    res.json({ success: true, mock: newMock });
});

app.get('/api/mocks', (req, res) => {
    res.json(db.mocks);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CPO AIR 1 Server running on port ${PORT}`));
