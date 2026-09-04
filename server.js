const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

const users = [];
const testResults = [];
const savedQuestionsMap = {}; 
const wrongQuestionsMap = {}; 
let globalTarget = "Target: Score 160+ in CPO Tier-1 Mock Tests!";

app.post('/api/register', (req, res) => {
    const { fullName, username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username & password required' });
    
    let existingUser = users.find(u => u.username === username);
    if (!existingUser) {
        existingUser = { fullName: fullName || username, username, password, registeredAt: new Date().toISOString() };
        users.push(existingUser);
    }
    res.json({ success: true, user: existingUser });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username & password required' });

    let user = users.find(u => u.username === username);
    if (!user) {
        user = { fullName: username, username, password, registeredAt: new Date().toISOString() };
        users.push(user);
    }
    res.json({ success: true, user });
});

app.post('/api/ai-scan-doubt', (req, res) => {
    setTimeout(() => {
        res.json({
            success: true,
            solution: "<b>Question Scanned Successfully!</b><br><br><b>Step 1:</b> Extracted formula from image.<br><b>Step 2:</b> Apply $(A + B) \\times \\text{time} = \\text{Total Work}$.<br><b>Correct Answer Option:</b> (B)<br><b>Short Trick:</b> Direct ratio method applies to this question type."
        });
    }, 1500);
});

app.post('/api/submit-test', (req, res) => {
    const { username, section, score, percentage, timeTaken, correct, incorrect, unattempted, wrongQList } = req.body;
    
    const userAttempts = testResults.filter(r => r.username === username);
    if (userAttempts.length >= 20) return res.status(400).json({ error: 'Max 20 attempts reached!' });

    const attemptData = {
        username, section, score, percentage, timeTaken, correct, incorrect, unattempted, submittedAt: new Date().toISOString()
    };
    testResults.push(attemptData);

    if (!wrongQuestionsMap[username]) wrongQuestionsMap[username] = [];
    if (wrongQList && wrongQList.length > 0) {
        wrongQuestionsMap[username].push(...wrongQList);
    }

    res.json({ success: true, attemptCount: userAttempts.length + 1 });
});

app.post('/api/save-question', (req, res) => {
    const { username, questionObj } = req.body;
    if (!savedQuestionsMap[username]) savedQuestionsMap[username] = [];
    savedQuestionsMap[username].push(questionObj);
    res.json({ success: true });
});

app.get('/api/user-stats/:username', (req, res) => {
    const username = req.params.username;
    const userAttempts = testResults.filter(r => r.username === username);
    
    let totalRight = 0, totalWrong = 0;
    userAttempts.forEach(a => { totalRight += a.correct; totalWrong += a.incorrect; });

    const userScores = {};
    testResults.forEach(r => { userScores[r.username] = (userScores[r.username] || 0) + r.score; });

    const sortedUsers = Object.keys(userScores).sort((a, b) => userScores[b] - userScores[a]);
    const rank = sortedUsers.indexOf(username) !== -1 ? sortedUsers.indexOf(username) + 1 : 'N/A';

    res.json({
        totalAttempts: userAttempts.length,
        totalRight,
        totalWrong,
        rank,
        savedQuestions: savedQuestionsMap[username] || [],
        wrongQuestions: wrongQuestionsMap[username] || [],
        globalTarget
    });
});

app.post('/api/set-target', (req, res) => {
    if (req.body.target) {
        globalTarget = req.body.target;
        return res.json({ success: true, target: globalTarget });
    }
    res.status(400).json({ error: 'Target required' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
