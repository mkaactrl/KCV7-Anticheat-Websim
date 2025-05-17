const express = require('express');
const helmet = require('helmet');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express
const app = express();
const port = 3000;

// Set up DOM Purify (for XSS sanitization)
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

// Database setup (SQLite for simplicity)
const db = new sqlite3.Database(':memory:'); // Replace with real DB in production
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)');
});

// --- SECURITY MIDDLEWARES ---

// 1. Helmet for HTTP headers (CSP, XSS, Clickjacking, etc.)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
    }
}));

// 2. Rate Limiting (Anti-Brute Force / Spam)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per IP
    message: "Too many requests. Try again later."
});
app.use(limiter);

// 3. CSRF Protection (Anti-CSRF)
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// 4. Body Parser (with XSS sanitization)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES WITH SECURITY CHECKS ---

// Sanitize user input (Anti-XSS)
function sanitizeInput(input) {
    return domPurify.sanitize(input);
}

// Example: User submits a website (Anti-XSS, Anti-Cheat)
app.post('/generate-website', (req, res) => {
    try {
        const { html, css, js } = req.body;

        // 1. Sanitize all inputs
        const cleanHTML = sanitizeInput(html);
        const cleanCSS = sanitizeInput(css);
        const cleanJS = sanitizeInput(js);

        // 2. Anti-Cheat: Check for forbidden patterns (e.g., eval(), document.cookie)
        if (cleanJS.includes('eval(') || cleanJS.includes('document.cookie')) {
            return res.status(403).json({ error: "Malicious code detected!" });
        }

        // 3. Save to DB (Anti-SQL Injection)
        const stmt = db.prepare('INSERT INTO websites (html, css, js) VALUES (?, ?, ?)');
        stmt.run(cleanHTML, cleanCSS, cleanJS, (err) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ success: true });
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ error: "CSRF token invalid" });
    }
    res.status(500).json({ error: "Security violation detected" });
});

// Start server
app.listen(port, () => {
    console.log(`WebSim Security Server running on http://localhost:${port}`);
});
