const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Cloudflare API setup (auto-blocks skids globally)
const CLOUDFLARE_API_KEY = process.env.CF_API_KEY;
const CLOUDFLARE_ZONE_ID = process.env.CF_ZONE_ID;

// Path to the "boo-boo" log
const BOOBOO_LOG = path.join(__dirname, 'skid-shame.log');

// ===== SKID DETECTION PATTERNS =====
const SKID_TRIGGERS = [
  /<\s*script\b.*?>.*?<\s*\/script\s*>/is, // Basic XSS
  /eval\(.*?\)/is,                         // Eval-based RAT
  /new\s+ActiveXObject/i,                   // Old-school RAT
  /(powershell|curl|wget)\s+-[cC]/i,       // Shell injection
  /(document\.cookie|localStorage)/i,       // Cookie theft
  /(webhook|discord\.com\/api)/i,          // Discord RAT callbacks
];

// ===== BOO-BOO BAN PAGE =====
const BOOBOO_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Boo-Boo Alert!</title>
  <style>
    body {
      background: #FFEEEE;
      font-family: Comic Sans MS, cursive;
      text-align: center;
      padding: 50px;
    }
    .boo-boo {
      font-size: 5em;
      color: #FF5555;
      text-shadow: 3px 3px 0 #FFAAAA;
    }
    .message {
      font-size: 1.5em;
      margin: 20px;
    }
    .ip {
      font-family: monospace;
      background: #FFF;
      padding: 5px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="boo-boo"> BOO-BOO DETECTED </div>
  <div class="message">
    <p>Looks like someone tried to skid/rat this site!</p>
    <p>Your IP (<span class="ip">{{IP}}</span>) has been <strong>permanently banned</strong>.</p>
    <p>Better luck next time, champ. 🍼</p>
  </div>
  <marquee>This incident has been logged. Shame on you.</marquee>
</body>
</html>
`;

// ===== CLOUDFLARE NUKE =====
async function banSkid(ip) {
  try {
    await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules`,
      {
        mode: "block",
        configuration: { target: "ip", value: ip },
        notes: "Banned for skid behavior"
      },
      { headers: { Authorization: `Bearer ${CLOUDFLARE_API_KEY}` } }
    );
    console.log(`☠️ Cloudflare banhammer dropped on ${ip}`);
  } catch (err) {
    console.error("Cloudflare ban failed:", err.response?.data || err.message);
  }
}

// ===== LOG THE SKID =====
function logSkid(ip, payload) {
  const logEntry = `[${new Date().toISOString()}] IP: ${ip} | Payload: ${payload.slice(0, 200)}\n`;
  fs.appendFileSync(BOOBOO_LOG, logEntry);
}

// ===== MAIN MIDDLEWARE =====
module.exports = (req, res, next) => {
  const ip = req.ip;
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const fullRequest = body +
