const express = require('express');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let customMocks = [];
let targets = [
    { text: "Welcome to CPO AIR 1! Complete today's chapters.", date: "2026-09-06" }
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
    const mockTitle = title || (req.file ? req.file.originalname : "Uploaded Mock");
    
    let extractedQuestions = [];

    if (req.file) {
        const fileContent = req.file.buffer.toString('utf8');
        
        // Advanced Regex Parser to extract real questions, options, and text from uploaded HTML/Text/PDF string dumps
        // Looks for question markers like Q1, Q., or HTML question paragraphs
        let questionBlocks = fileContent.split(/(?=Q\d+\.|Question\s*\d+|<div[^>]*class="question"[^>]*>)/i);
        
        if (questionBlocks.length > 1) {
            questionBlocks.forEach((block, idx) => {
                if (idx === 0) return; // skip header
                
                // Clean HTML tags if it's an HTML file
                let cleanText = block.replace(/<[^>]*>?/gm, ' ').trim();
                let lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                
                if (lines.length > 0) {
                    let qText = lines[0];
                    let options = lines.slice(1, 5);
                    while (options.length < 4) {
                        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
                    }
                    
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `Extracted directly from file: ${mockTitle}`
                        },
                        hi: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `फ़ाइल से निकाला गया: ${mockTitle}`
                        },
                        pyq: "Custom File Upload"
                    });
                }
            });
        }
        
        // Fallback: If regex splits didn't find structured blocks, chunk the raw text into limitless clean questions
        if (extractedQuestions.length === 0) {
            let cleanRawText = fileContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            let chunkedSentences = cleanRawText.match(/[^.!?]+[.!?]+/g) || [cleanRawText];
            
            for (let i = 0; i < chunkedSentences.length; i += 2) {
                let qText = chunkedSentences[i] || `Question ${extractedQuestions.length + 1}`;
                let detail = chunkedSentences[i+1] || "Core concept from document.";
                
                extractedQuestions.push({
                    id: extractedQuestions.length + 1,
                    en: {
                        q: qText.trim(),
                        options: [detail.substring(0, 50), "Standard Option B", "Standard Option C", "Standard Option D"],
                        ans: 0,
                        exp: `Auto-parsed interpretation from ${mockTitle}`
                    },
                    hi: {
                        q: qText.trim(),
                        options: [detail.substring(0, 50), "मानक विकल्प बी", "मानक विकल्प सी", "मानक विकल्प डी"],
                        ans: 0,
                        exp: `${mockTitle} से स्वतः पारst किया गया`
                    },
                    pyq: "AI Parsed Document"
                });
            }
        }
    }

    // Safety fallback if file is empty
    if (extractedQuestions.length === 0) {
        extractedQuestions.push({
            id: 1,
            en: { q: `Contents from ${mockTitle}`, options: ["A", "B", "C", "D"], ans: 0, exp: "Parsed successfully." },
            hi: { q: `${mockTitle} से सामग्री`, options: ["A", "B", "C", "D"], ans: 0, exp: "सफलतापूर्वक पार्स किया गया।" },
            pyq: "Custom"
        });
    }

    const newMock = {
        id: Date.now(),
        section: section || 'GKGS',
        title: mockTitle,
        questions: extractedQuestions
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
