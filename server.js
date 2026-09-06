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

// Helper to decode buffer safely across multiple character encodings
function decodeBuffer(buffer, mimetype, originalname) {
    // Check if it's UTF-16LE / UTF-16BE by looking at BOM or extension
    if (originalname.endsWith('.html') || originalname.endsWith('.txt')) {
        let textUtf8 = buffer.toString('utf8');
        // If there are too many replacement characters, try latin1 / binary conversion
        let replacementCount = (textUtf8.match(/\ufffd/g) || []).length;
        if (replacementCount > 5) {
            try {
                return buffer.toString('latin1');
            } catch (e) {
                return textUtf8;
            }
        }
        return textUtf8;
    }
    return buffer.toString('utf8');
}

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
                fileText = decodeBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
            }
        } else {
            fileText = decodeBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
        }

        // Clean up weird encoding artifacts, non-printable characters, and HTML tags
        let cleanContent = fileText
            .replace(/<[^>]*>?/gm, '\n')
            .replace(/\u0000/g, '')
            .replace(/[\ufffd\uFFFE\uFFFF]/g, ' ');

        // Intelligent Question Splitter: looks for Q, Question, or numbered markers like 1., 2)
        let rawBlocks = cleanContent.split(/(?:Q\.?\s*\d+|Question\s*\d+|\b\d{1,3}\[?[\.\)]\s+)/i);
        
        if (rawBlocks.length > 1) {
            rawBlocks.forEach((block, idx) => {
                if (idx === 0) return; // Skip title/preamble
                
                let lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) {
                    let qText = lines[0].replace(/^[^\w\s]+/g, '').trim();
                    if (qText.length < 3) return; // Skip empty header fragments

                    let options = [];
                    let optionLines = lines.slice(1);
                    
                    optionLines.forEach(line => {
                        let cleanedLine = line.replace(/^[A-Da-d][\.\)]\s*/, '').replace(/^[^\w\s]+/g, '').trim();
                        if (cleanedLine.length > 0 && options.length < 4) {
                            options.push(cleanedLine);
                        }
                    });

                    while (options.length < 4) {
                        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
                    }

                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `Parsed from file: ${mockTitle}`
                        },
                        hi: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `फ़ाइल से पार्स किया गया: ${mockTitle}`
                        },
                        pyq: "Uploaded Document"
                    });
                }
            });
        }

        // Fallback Paragraph Chunking if regular markers weren't caught
        if (extractedQuestions.length === 0) {
            let sentences = cleanContent.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) || [cleanContent];
            for (let i = 0; i < sentences.length && extractedQuestions.length < 100; i += 2) {
                let questionText = sentences[i].replace(/^[^\w\s]+/g, '').trim();
                let optionHint = sentences[i+1] ? sentences[i+1].replace(/^[^\w\s]+/g, '').trim() : "Standard context option";
                
                if (questionText.length > 5) {
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: questionText,
                            options: [optionHint.substring(0, 60), "Option B", "Option C", "Option D"],
                            ans: 0,
                            exp: `Extracted from ${mockTitle}`
                        },
                        hi: {
                            q: questionText,
                            options: [optionHint.substring(0, 60), "विकल्प बी", "विकल्प सी", "विकल्प डी"],
                            ans: 0,
                            exp: `${mockTitle} से निकाला गया`
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
            en: { q: `Successfully uploaded: ${mockTitle}`, options: ["Option A", "Option B", "Option C", "Option D"], ans: 0, exp: "Loaded." },
            hi: { q: `सफलतापूर्वक अपलोड किया गया: ${mockTitle}`, options: ["विकल्प ए", "विकल्प बी", "विकल्प सी", "विकल्प डी"], ans: 0, exp: "लोड किया गया।" },
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
