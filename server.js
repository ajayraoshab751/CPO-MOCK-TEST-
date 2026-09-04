const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & payload parsing
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Optional MongoDB Connection (falls back to persistent file/in-memory state if URI not provided)
const MONGO_URI = process.env.MONGO_URI || "";
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB Connected Successfully'))
        .catch(err => console.error('MongoDB Connection Error:', err));
}

// Schemas for Persistent Database Storage
const targetSchema = new mongoose.Schema({
    text: { type: String, default: "Target: Score 160+ in CPO Tier-1 Mock Tests!" },
    imageUrl: { type: String, default: "" }
});

const questionBankSchema = new mongoose.Schema({
    section: String,
    question: String,
    options: [String],
    correctAnswer: Number
});

const Target = mongoose.models.Target || mongoose.model('Target', targetSchema);
const CustomQuestion = mongoose.models.CustomQuestion || mongoose.model('CustomQuestion', questionBankSchema);

// In-Memory Backup State
let globalTargetData = {
    text: "Target: Score 160+ in CPO Tier-1 Mock Tests!",
    imageUrl: ""
};
let globalCustomQuestions = {};

// Fast Auth Endpoint
app.post('/api/login', async (req, res) => {
    return res.json({ success: true, message: "Auth processed" });
});

// Admin Broadcast Endpoint (Update Target & Target Image)
app.post('/api/admin/update-target', async (req, res) => {
    const { username, password, targetText, imageUrl } = req.body;
    
    // Strict Admin Verification
    if (username !== 'ajayraoshab751@gmail.com' || password !== 'sunitadevi') {
        return res.status(403).json({ success: false, error: 'Unauthorized Admin Access' });
    }

    globalTargetData.text = targetText || globalTargetData.text;
    if (imageUrl !== undefined) globalTargetData.imageUrl = imageUrl;

    if (MONGO_URI) {
        await Target.deleteMany({});
        await Target.create({ text: globalTargetData.text, imageUrl: globalTargetData.imageUrl });
    }

    return res.json({ success: true, targetData: globalTargetData });
});

// Get Live Target Broadcast
app.get('/api/target', async (req, res) => {
    if (MONGO_URI) {
        const saved = await Target.findOne();
        if (saved) {
            globalTargetData.text = saved.text;
            globalTargetData.imageUrl = saved.imageUrl;
        }
    }
    return res.json({ success: true, targetData: globalTargetData });
});

// Admin Store Uploaded HTML Questions Permanently
app.post('/api/admin/add-questions', async (req, res) => {
    const { username, password, section, questions } = req.body;

    if (username !== 'ajayraoshab751@gmail.com' || password !== 'sunitadevi') {
        return res.status(403).json({ success: false, error: 'Unauthorized Admin Access' });
    }

    if (!globalCustomQuestions[section]) globalCustomQuestions[section] = [];
    globalCustomQuestions[section].push(...questions);

    if (MONGO_URI) {
        const docs = questions.map(q => ({ section, question: q.question, options: q.options, correctAnswer: q.correctAnswer }));
        await CustomQuestion.insertMany(docs);
    }

    return res.json({ success: true, count: questions.length });
});

// Get All Custom Uploaded Questions
app.get('/api/questions', async (req, res) => {
    if (MONGO_URI) {
        const dbQs = await CustomQuestion.find();
        const formatted = {};
        dbQs.forEach(q => {
            if (!formatted[q.section]) formatted[q.section] = [];
            formatted[q.section].push({ question: q.question, options: q.options, correctAnswer: q.correctAnswer });
        });
        return res.json({ success: true, questions: formatted });
    }
    return res.json({ success: true, questions: globalCustomQuestions });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

