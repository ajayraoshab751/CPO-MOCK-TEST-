const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
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

app.post('/api/admin/upload-mock', upload.single('file'), async (req, res) => {
    const { section, title } = req.body;
    const mockTitle = title || (req.file ? req.file.originalname : "Uploaded Mock");
    
    let extractedQuestions = [];
    let fileText = "";

    if (req.file) {
        if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
            try {
                const pdfData = await pdfParse(req.file.buffer);
                fileText = pdfData.text;
            } catch (err) {
                console.error("PDF Parse Error:", err);
                fileText = req.file.buffer.toString('utf8');
            }
        } else {
            fileText = req.file.buffer.toString('utf8');
        }

        // Clean HTML tags if it's an HTML file
        let cleanContent = fileText.replace(/<[^>]*>?/gm, '\n');
        
        // Intelligent Question Splitter: looks for Q1., Q. 1, Question 1, or numbers followed by question symbols
        let rawBlocks = cleanContent.split(/(?:Q\.?\s*\d+|Question\s*\d+|\b\d{1,3}\[?[\.\)]\s+)/i);
        
        if (rawBlocks.length > 1) {
            rawBlocks.forEach((block, idx) => {
                if (idx === 0) return; // Skip preamble/intro text
                
                let lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) {
                    let qText = lines[0];
                    // Look for options in subsequent lines (e.g. starting with A., B., C., D. or brackets)
                    let options = [];
                    let optionLines = lines.slice(1);
                    
                    optionLines.forEach(line => {
                        if (/^[A-Da-d][\.\)]/.test(line) || options.length < 4) {
                            options.push(line.replace(/^[A-Da-d][\.\)]\s*/, ''));
                        }
                    });

                    // Ensure we always have 4 choices
                    while (options.length < 4) {
                        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
                    }

                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `Parsed from document: ${mockTitle}`
                        },
                        hi: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `दस्तावेज़ से पार्स किया गया: ${mockTitle}`
                        },
                        pyq: "Uploaded Document"
                    });
                }
            });
        }

        // Fallback Paragraph/Sentence Chunking if specific question markers weren't matched
        if (extractedQuestions.length === 0) {
            let sentences = cleanContent.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) || [cleanContent];
            for (let i = 0; i < sentences.length && extractedQuestions.length < 50; i += 2) {
                let questionText = sentences[i].trim();
                let optionHint = sentences[i+1] ? sentences[i+1].trim() : "Detailed context statement";
                
                if (questionText.length > 5) {
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: questionText,
                            options: [optionHint.substring(0, 60), "Alternative Choice B", "Alternative Choice C", "Alternative Choice D"],
                            ans: 0,
                            exp: `Auto-extracted content from ${mockTitle}`
                        },
                        hi: {
                            q: questionText,
                            options: [optionHint.substring(0, 60), "वैकल्पिक विकल्प बी", "वैकल्पिक विकल्प सी", "वैकल्पिक विकल्प डी"],
                            ans: 0,
                            exp: `${mockTitle} से स्वतः निकाली गई सामग्री`
                        },
                        pyq: "Custom File"
                    });
                }
            }
        }
    }

    if (extractedQuestions.length === 0) {
        extractedQuestions.push({
            id: 1,
            en: { q: `File uploaded successfully: ${mockTitle}`, options: ["Option A", "Option B", "Option C", "Option D"], ans: 0, exp: "Parsed content." },
            hi: { q: `फ़ाइल सफलतापूर्वक अपलोड हुई: ${mockTitle}`, options: ["विकल्प ए", "विकल्प बी", "विकल्प सी", "विकल्प डी"], ans: 0, exp: "पार्स की गई सामग्री।" },
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
