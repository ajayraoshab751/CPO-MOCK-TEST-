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

// Robust multi-encoding text decoder (handles UTF-16LE, UTF-8, and Latin1)
function decodeTextBuffer(buffer, originalname) {
    // Check for UTF-16LE BOM or try decoding as utf16le first if file looks like a Windows HTML export
    let utf16Text = buffer.toString('utf16le');
    // If utf16le produces normal looking words without excessive control characters, use it
    if (utf16Text.includes('Q.') || utf16Text.includes('प्रश्न') || utf16Text.includes('html') || utf16Text.includes('<') || (utf16Text.match(/[\u0900-\u097F]/g) || []).length > 0) {
        // Clean up null bytes if any
        return utf16Text.replace(/\u0000/g, '');
    }

    let utf8Text = buffer.toString('utf8');
    let replacementCount = (utf8Text.match(/\ufffd/g) || []).length;
    if (replacementCount > 3) {
        try {
            return buffer.toString('latin1');
        } catch (e) {
            return utf8Text;
        }
    }
    return utf8Text;
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
                fileText = decodeTextBuffer(req.file.buffer, req.file.originalname);
            }
        } else {
            fileText = decodeTextBuffer(req.file.buffer, req.file.originalname);
        }

        // Clean HTML tags and weird artifacts
        let cleanContent = fileText
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>?/gm, '\n')
            .replace(/\r/g, '');

        // Split text by Question boundaries (e.g. Q.1, Q 1, Question 1, or number followed by period/bracket)
        let rawBlocks = cleanContent.split(/(?:Q\.?\s*\d+|Question\s*\d+|\b\d{1,3}\[?[\.\)]\s+)/i);
        
        if (rawBlocks.length > 1) {
            rawBlocks.forEach((block, idx) => {
                if (idx === 0) return; // Skip header preamble
                
                let lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) {
                    let qText = lines[0];
                    let options = [];
                    let optionLines = lines.slice(1);
                    
                    optionLines.forEach(line => {
                        let cleaned = line.replace(/^[A-Da-d][\.\)]\s*/, '').trim();
                        if (cleaned.length > 0 && options.length < 4) {
                            options.push(cleaned);
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
                            exp: `Source: ${mockTitle}`
                        },
                        hi: {
                            q: qText,
                            options: options.slice(0, 4),
                            ans: 0,
                            exp: `स्रोत: ${mockTitle}`
                        },
                        pyq: "Custom Upload"
                    });
                }
            });
        }

        // Fallback sentence chunking if standard split didn't find clear question blocks
        if (extractedQuestions.length === 0) {
            let sentences = cleanContent.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) || [cleanContent];
            for (let i = 0; i < sentences.length && extractedQuestions.length < 100; i += 2) {
                let qText = sentences[i].trim();
                let optHint = sentences[i+1] ? sentences[i+1].trim() : "Option details";
                
                if (qText.length > 4) {
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        en: {
                            q: qText,
                            options: [optHint.substring(0, 50), "Option B", "Option C", "Option D"],
                            ans: 0,
                            exp: `Parsed from ${mockTitle}`
                        },
                        hi: {
                            q: qText,
                            options: [optHint.substring(0, 50), "विकल्प बी", "विकल्प सी", "विकल्प डी"],
                            ans: 0,
                            exp: `${mockTitle} से पार्स किया गया`
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
            en: { q: `Mock Test loaded: ${mockTitle}`, options: ["A", "B", "C", "D"], ans: 0, exp: "Ready." },
            hi: { q: `मॉक टेस्ट लोड हुआ: ${mockTitle}`, options: ["A", "B", "C", "D"], ans: 0, exp: "तैयार है।" },
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
