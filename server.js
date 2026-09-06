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

// Advanced multi-encoding buffer decoder
function decodeBuffer(buffer, originalname) {
    let utf16Text = buffer.toString('utf16le');
    if (utf16Text.includes('<html') || utf16Text.includes('<body') || utf16Text.includes('Q.') || utf16Text.includes('प्रश्न') || (utf16Text.match(/[\u0900-\u097F]/g) || []).length > 0) {
        return utf16Text.replace(/\u0000/g, '');
    }
    let utf8Text = buffer.toString('utf8');
    if ((utf8Text.match(/\ufffd/g) || []).length > 3) {
        try { return buffer.toString('latin1'); } catch (e) { return utf8Text; }
    }
    return utf8Text;
}

app.post('/api/admin/upload-mock', upload.single('file'), async (req, res) => {
    const startTime = Date.now(); // Start conversion timer
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
                fileText = decodeBuffer(req.file.buffer, req.file.originalname);
            }
        } else {
            fileText = decodeBuffer(req.file.buffer, req.file.originalname);
        }

        // --- DOM PARSING FOR HTML FILES USING CHEERIO ---
        if (!isPdf && (fileText.includes('<html') || fileText.includes('<body') || fileText.includes('<div'))) {
            const $ = cheerio.load(fileText);
            $('script, style, noscript').remove();

            let questionNodes = [];
            $('.question, .quiz-question, .test-question, div[id*="q"], div[class*="question"], p, tr').each((i, el) => {
                let text = $(el).text().trim();
                if (/^(?:Q\.?\s*\d+|Question\s*\d+|\d{1,3}[\.\)]\s+)/i.test(text) || text.length > 20) {
                    questionNodes.push(text);
                }
            });

            if (questionNodes.length > 0) {
                questionNodes.forEach((nodeText, idx) => {
                    let lines = nodeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length === 0) return;

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
                            exp: `Parsed from HTML: ${mockTitle}`
                        },
                        hi: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `HTML से पार्स किया गया: ${mockTitle}`
                        },
                        pyq: "Custom HTML Upload"
                    });
                });
            }
        }

        // --- FALLBACK / PDF CLEAN TEXT PARSING ---
        if (extractedQuestions.length === 0) {
            let cleanContent = fileText
                .replace(/<[^>]*>?/gm, '\n')
                .replace(/\r/g, '');

            let rawBlocks = cleanContent.split(/(?:Q\.?\s*\d+|Question\s*\d+|\b\d{1,3}\[?[\.\)]\s+)/i);
            
            if (rawBlocks.length > 1) {
                rawBlocks.forEach((block, idx) => {
                    if (idx === 0) return;
                    let lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length > 0) {
                        let qText = lines[0];
                        let options = lines.slice(1, 5);
                        while (options.length < 4) {
                            options.push(`Option ${String.fromCharCode(65 + options.length)}`);
                        }
                        extractedQuestions.push({
                            id: extractedQuestions.length + 1,
                            en: { q: qText, options: options.slice(0, 4), ans: 0, exp: `Source: ${mockTitle}` },
                            hi: { q: qText, options: options.slice(0, 4), ans: 0, exp: `स्रोत: ${mockTitle}` },
                            pyq: "Document Upload"
                        });
                    }
                });
            }
        }

        // Final fallback text chunking if nothing else matched
        if (extractedQuestions.length === 0) {
            let cleanRaw = fileText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
            let sentences = cleanRaw.match(/[^.!?]+[.!?]+/g) || [cleanRaw];
            for (let i = 0; i < sentences.length && extractedQuestions.length < 100; i += 2) {
                let qText = sentences[i].trim();
                let optHint = sentences[i+1] ? sentences[i+1].trim() : "Standard option";
                if (qText.length > 5) {
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: { q: qText, options: [optHint.substring(0, 50), "Option B", "Option C", "Option D"], ans: 0, exp: `Extracted from ${mockTitle}` },
                        hi: { q: qText, options: [optHint.substring(0, 50), "विकल्प बी", "विकल्प सी", "विकल्प डी"], ans: 0, exp: `${mockTitle} से निकाला गया` },
                        pyq: "Custom File"
                    });
                }
            }
        }
    }

    if (extractedQuestions.length === 0) {
        extractedQuestions.push({
            id: 1,
            en: { q: `Mock file uploaded: ${mockTitle}`, options: ["Option A", "Option B", "Option C", "Option D"], ans: 0, exp: "Loaded." },
            hi: { q: `मॉक फ़ाइल अपलोड की गई: ${mockTitle}`, options: ["विकल्प ए", "विकल्प बी", "विकल्प सी", "विकल्प डी"], ans: 0, exp: "लोड किया गया।" },
            pyq: "Custom"
        });
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2); // Calculate time taken

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
