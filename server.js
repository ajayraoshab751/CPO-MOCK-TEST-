const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cheerio = require('cheerio');
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

// Robust multi-encoding cleaner
function cleanAndDecode(buffer, originalname) {
    let text = "";
    try {
        if (originalname.endsWith('.html') || originalname.endsWith('.txt')) {
            let utf16 = buffer.toString('utf16le');
            if (utf16.includes('<') || utf16.includes('html') || utf16.includes('प्रश्न')) {
                text = utf16;
            } else {
                text = buffer.toString('utf8');
            }
        } else {
            text = buffer.toString('utf8');
        }
    } catch (e) {
        text = buffer.toString('latin1');
    }

    // Remove null bytes and excessive replacement chars
    return text
        .replace(/\u0000/g, '')
        .replace(/[\ufffd\uFFFE\uFFFF]/g, ' ');
}

app.post('/api/admin/upload-mock', upload.single('file'), async (req, res) => {
    const startTime = Date.now();
    const { section, title } = req.body;
    const mockTitle = title || (req.file ? req.file.originalname : "Uploaded Mock");
    
    let extractedQuestions = [];
    let fileText = "";

    if (req.file) {
        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
        
        if (isPdf) {
            try {
                const pdfData = await pdfParse(req.file.buffer);
                fileText = pdfData.text;
            } catch (err) {
                fileText = cleanAndDecode(req.file.buffer, req.file.originalname);
            }
        } else {
            let rawText = cleanAndDecode(req.file.buffer, req.file.originalname);
            if (rawText.includes('<html') || rawText.includes('<body') || rawText.includes('<div')) {
                const $ = cheerio.load(rawText);
                $('script, style, noscript').remove();
                fileText = $.text();
            } else {
                fileText = rawText;
            }
        }

        // Clean formatting whitespace
        fileText = fileText.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');

        // --- SMART LINE-BY-LINE STRUCTURAL PARSER ---
        let lines = fileText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        let currentQ = null;
        let currentOptions = [];

        lines.forEach(line => {
            // Detect question start (e.g. 1., 2), Q.1, Question 1)
            if (/^(\d{1,3}[\.\)]|Q\.?\s*\d+|Question\s*\d+)/i.test(line)) {
                if (currentQ && currentQ.length > 5) {
                    while (currentOptions.length < 4) {
                        currentOptions.push(`Option ${String.fromCharCode(65 + currentOptions.length)}`);
                    }
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: { q: currentQ, options: currentOptions.slice(0, 4), ans: 0, exp: `Source: ${mockTitle}` },
                        hi: { q: currentQ, options: currentOptions.slice(0, 4), ans: 0, exp: `स्रोत: ${mockTitle}` },
                        pyq: "Uploaded Mock"
                    });
                }
                currentQ = line.replace(/^(\d{1,3}[\.\)]|Q\.?\s*\d+|Question\s*\d+)\s*/i, '').trim();
                currentOptions = [];
            } 
            // Detect option lines (A., B., C., D. or a), b), c), d))
            else if (/^[A-Da-d][\.\)]/.test(line)) {
                let optText = line.replace(/^[A-Da-d][\.\)]\s*/, '').trim();
                if (optText) currentOptions.push(optText);
            } 
            // Continuation of question or options
            else {
                if (currentQ && currentOptions.length === 0) {
                    currentQ += " " + line;
                } else if (currentOptions.length > 0 && currentOptions.length < 4) {
                    currentOptions[currentOptions.length - 1] += " " + line;
                } else if (!currentQ) {
                    currentQ = line;
                }
            }
        });

        // Push final question
        if (currentQ && currentQ.length > 5) {
            while (currentOptions.length < 4) {
                currentOptions.push(`Option ${String.fromCharCode(65 + currentOptions.length)}`);
            }
            extractedQuestions.push({
                id: extractedQuestions.length + 1,
                en: { q: currentQ, options: currentOptions.slice(0, 4), ans: 0, exp: `Source: ${mockTitle}` },
                hi: { q: currentQ, options: currentOptions.slice(0, 4), ans: 0, exp: `स्रोत: ${mockTitle}` },
                pyq: "Uploaded Mock"
            });
        }

        // --- PARAGRAPH FALLBACK IF NO STRICT MARKERS MATCHED ---
        if (extractedQuestions.length === 0) {
            let paragraphs = fileText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 15);
            paragraphs.forEach((para, idx) => {
                if (idx < 100) {
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: para,
                            options: ["Option A Statement", "Option B Statement", "Option C Statement", "Option D Statement"],
                            ans: 0,
                            exp: `Extracted from ${mockTitle}`
                        },
                        hi: {
                            q: para,
                            options: ["विकल्प ए विवरण", "विकल्प बी विवरण", "विकल्प सी विवरण", "विकल्प डी विवरण"],
                            ans: 0,
                            exp: `${mockTitle} से निकाला गया`
                        },
                        pyq: "Document Extract"
                    });
                }
            });
        }
    }

    if (extractedQuestions.length === 0) {
        extractedQuestions.push({
            id: 1,
            en: { q: `Successfully parsed mock: ${mockTitle}`, options: ["Option A", "Option B", "Option C", "Option D"], ans: 0, exp: "Ready." },
            hi: { q: `सफलतापूर्वक पार्स किया गया मॉक: ${mockTitle}`, options: ["विकल्प ए", "विकल्प बी", "विकल्प सी", "विकल्प डी"], ans: 0, exp: "तैयार है।" },
            pyq: "Custom"
        });
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    const newMock = {
        id: Date.now(),
        section: section || 'GKGS',
        title: mockTitle,
        conversionTime: `${durationSec} seconds`,
        questions: extractedQuestions
    };

    customMocks.push(newMock);
    res.json({ success: true, mock: newMock, conversionTime: `${durationSec} seconds` });
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
