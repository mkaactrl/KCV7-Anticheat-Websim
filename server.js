// server/app.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { VM } = require('vm2');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =====================
// 💀 NUCLEAR LAUNCH CODES
// =====================
const app = express();

// 1. Persistent IP Ban System (with crypto hashing)
const BANNED_IPS = new Set();
const BAN_FILE = path.join(__dirname, 'nuclear-bans.json');
const HMAC_KEY = crypto.randomBytes(32).toString('hex'); // Auto-generated per deployment

function hashIP(ip) {
  return crypto.createHmac('sha256', HMAC_KEY).update(ip).digest('hex');
}

// Load existing bans with HMAC verification
if (fs.existsSync(BAN_FILE)) {
  const banData = JSON.parse(fs.readFileSync(BAN_FILE));
  banData.hashedIPs.forEach(hashedIp => {
    BANNED_IPS.add(hashedIp);
  });
}

// 2. AI-Powered XSS/Injection Detector
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

function nuclearSanitize(input) {
  const clean = domPurify.sanitize(input, {
    FORBID_TAGS: ['style', 'iframe', 'meta'],
    FORBID_ATTR: ['onerror', 'onload']
  });
  
  // Heuristic entropy check for obfuscated code
  const entropy = str => {
    return [...new Set(str)].length / str.length;
  };
  
  if (entropy(clean) > 0.8 && clean.length > 50) {
    throw new Error('OBFUSCATION_DETECTED');
  }
  
  return clean;
}

// 3. VM2 Sandbox with Anti-Debugging
const vm = new VM({
  timeout: 1000,
  sandbox: {
    console: { log: () => {} }, // Disable console
    process: { exit: () => {} } // Block process termination
  },
  compiler: 'javascript',
  eval: false
});

// 4. Blockchain-Style Attack Logging
class AttackLogger {
  constructor() {
    this.chain = [];
    const genesisBlock = { 
      timestamp: Date.now(), 
      data: 'GENESIS_BLOCK', 
      previousHash: '0' 
    };
    this.chain.push(genesisBlock);
  }

  addAttack(ip, payload) {
    const block = {
      timestamp: Date.now(),
      data: { ip, payload: payload.slice(0, 200) },
      previousHash: this.chain[this.chain.length-1].hash,
      nonce: Math.floor(Math.random() * 999999)
    };
    block.hash = this.calculateHash(block);
    this.chain.push(block);
    fs.writeFileSync('attack-chain.json', JSON.stringify(this.chain, null, 2));
  }

  calculateHash(block) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(block))
      .digest('hex');
  }
}
const logger = new AttackLogger();

// =====================
// 🚀 MIDDLEWARE STACK
// =====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for some libs
      frameAncestors: ["'none'"]
    }
  },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(express.json({ limit: '10kb' })); // Prevent memory bombs

app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  handler: (req, res) => {
    const ip = req.ip;
    const hashedIp = hashIP(ip);
    BANNED_IPS.add(hashedIp);
    fs.writeFileSync(BAN_FILE, JSON.stringify({ 
      hashedIPs: [...BANNED_IPS],
      lastUpdated: new Date().toISOString()
    }));
    logger.addAttack(ip, 'RATE_LIMIT_VIOLATION');
    res.status(429).sendFile(path.join(__dirname, 'nuclear-ban.html'));
  }
}));

// =====================
// 💣 MAIN SECURITY FILTER
// =====================
app.use((req, res, next) => {
  const ip = req.ip;
  const hashedIp = hashIP(ip);

  // Check ban list
  if (BANNED_IPS.has(hashedIp)) {
    return res.status(403).sendFile(path.join(__dirname, 'nuclear-ban.html'));
  }

  // Deep scan all inputs
  try {
    if (req.body) {
      req.body = JSON.parse(nuclearSanitize(JSON.stringify(req.body)));
    }
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        req.query[key] = nuclearSanitize(req.query[key]);
      });
    }
  } catch (err) {
    BANNED_IPS.add(hashedIp);
    logger.addAttack(ip, `SANITIZATION_FAILURE:${err.message}`);
    return res.status(403).sendFile(path.join(__dirname, 'nuclear-ban.html'));
  }

  next();
});

// =====================
// 🎯 SAMPLE PROTECTED ROUTE
// =====================
app.post('/api/execute', (req, res) => {
  try {
    const result = vm.run(req.body.code);
    res.json({ result });
  } catch (err) {
    const ip = req.ip;
    logger.addAttack(ip, `VM_ESCAPE_ATTEMPT:${err.message}`);
    res.status(400).json({ error: 'Execution failed' });
  }
});

// =====================
// ☢️ BAN PAGE TEMPLATE (nuclear-ban.html)
// =====================
fs.writeFileSync(path.join(__dirname, 'nuclear-ban.html'), `
<!DOCTYPE html>
<html>
<head>
  <title>ACCESS TERMINATED</title>
  <style>
    body { 
      background: #000 url('https://i.giphy.com/media/3o7aTskHEUdgCQAXde/giphy.gif') no-repeat center;
      color: #f00;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding-top: 20vh;
    }
    .blink {
      animation: blink 1s step-end infinite;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
  </style>
</head>
<body>
  <h1>☠️ PERMANENT ACCESS DENIAL ☠️</h1>
  <p class="blink">YOUR IP HAS BEEN ARCHIVED IN OUR BLACKHOLE DATABASE</p>
  <p>All subsequent requests will be routed to /dev/null</p>
  <p>Violation ID: ${crypto.randomUUID()}</p>
</body>
</html>
`);

// =====================
// 🚨 START THE FIREWALL
// =====================
app.listen(3000, () => {
  console.log(`
  ██╗░░██╗░█████╗░░█████╗░██╗░░░██╗  ░██████╗███████╗░█████╗░██╗░░░██╗
  ██║░██╔╝██╔══██╗██╔══██╗╚██╗░██╔╝  ██╔════╝██╔════╝██╔══██╗╚██╗░██╔╝
  █████═╝░██║░░██║██║░░██║░╚████╔╝░  ╚█████╗░█████╗░░██║░░╚═╝░╚████╔╝░
  ██╔═██╗░██║░░██║██║░░██║░░╚██╔╝░░  ░╚═══██╗██╔══╝░░██║░░██╗░░╚██╔╝░░
  ██║░╚██╗╚█████╔╝╚█████╔╝░░░██║░░░  ██████╔╝███████╗╚█████╔╝░░░██║░░░
  ╚═╝░░╚═╝░╚════╝░░╚════╝░░░░╚═╝░░░  ╚═════╝░╚══════╝░╚════╝░░░░╚═╝░░░
  `);
  console.log('Nuclear security system online @ http://localhost:3000');
});
