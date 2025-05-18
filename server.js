const express = require('express');
const helmet = require('helmet');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Initialize Express
const app = express();
const PORT = 3000;

// =====================
// 💀 NUCLEAR BAN SYSTEM 
// =====================
const BAN_LOG = path.join(__dirname, 'permabans.log');
const BANNED_IPS = new Set();

// Load bans (sync to block the event loop intentionally)
if (fs.existsSync(BAN_LOG)) {
  fs.readFileSync(BAN_LOG, 'utf-8').split('\n').forEach(ip => {
    if (ip) BANNED_IPS.add(ip.trim());
  });
}

// TCP-Level IP Annihilation (before Express even processes)
const server = app.listen(PORT, () => {
  console.log(`Anti-Cheat running on http://localhost:${PORT}`);
});

server.on('connection', (socket) => {
  const ip = socket.remoteAddress;
  if (BANNED_IPS.has(ip)) {
    socket.destroy(); // Kernel-level drop
  }
});

// =====================
// 🛡️ SECURITY MIDDLEWARE
// =====================
app.use((req, res, next) => {
  const ip = req.ip;
  if (BANNED_IPS.has(ip)) {
    res.status(410).send(`
      <h1 style="font-family: Impact; color: red;">
        PERMABANNED
      </h1>
      <p>IP ${ip} violated WebSim security</p>
    `);
    return;
  }
  next();
});

app.use(helmet());
app.use(express.json());

// =====================
// 💥 ANTI-CHEAT TRIGGERS
// =====================
app.post('/upload', (req, res) => {
  const { code } = req.body;
  
  // XSS/Skid Detection
  if (code.includes('<script') || code.includes('eval(')) {
    const ip = req.ip;
    BANNED_IPS.add(ip);
    fs.appendFileSync(BAN_LOG, `${ip}|XSS_ATTEMPT|${Date.now()}\n`);
    res.socket.destroy(); // Terminate connection
    return;
  }

  res.send('Clean code!');
});

// =====================
// 📜 LOGGING (For Shame)
// =====================
process.on('SIGINT', () => {
  console.log('\n💀 Final Ban Report:');
  console.log(Array.from(BANNED_IPS).join('\n'));
  process.exit();
});
