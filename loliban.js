const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ===== BAN CONFIG =====
const BAN_LOG = path.join(__dirname, 'xss-testers.log');
const LOLIPOP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>🍭 XSS Testing = Free Lolipop! 🍭</title>
  <style>
    body {
      background: #FFD6E7;
      font-family: 'Comic Sans MS', cursive;
      text-align: center;
      padding: 50px;
    }
    .lolipop {
      font-size: 5em;
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="lolipop">🍭</div>
  <h1>Congratulations!</h1>
  <p>You found the anti-XSS system!</p>
  <p>Your prize? A <strong>permanent IP ban</strong> and this lolipop.</p>
  <p><small>(Don't worry, we logged your attempt.)</small></p>
</body>
</html>
`;

// ===== CLOUDFLARE BAN =====
async function banIP(ip) {
  try {
    await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/firewall/access_rules/rules`,
      {
        mode: "block",
        configuration: { target: "ip", value: ip },
        notes: "XSS Tester"
      },
      { headers: { Authorization: `Bearer ${process.env.CF_API_KEY}` } }
    );
    console.log(`🚨 Banned ${ip} for XSS testing`);
  } catch (err) {
    console.error("Ban failed:", err.response?.data || err.message);
  }
}

// ===== LOG XSS TESTER =====
function logTester(ip, payload) {
  fs.appendFileSync(BAN_LOG, `[${new Date().toISOString()}] ${ip} - "${payload}"\n`);
}

// ===== MIDDLEWARE =====
module.exports = (req, res, next) => {
  const ip = req.ip;
  const userInput = JSON.stringify({ ...req.body, ...req.query });

  // Detect XSS "testing" behavior
  const xssPatterns = [
    /<script\b/i,
    /alert\(/i,
    /xss/i,
    /test.*xss/i,
    /wonder.*anti.*xss/i  // Catches "oh yo i wonder if this has anti XSS"
  ];

  const isTester = xssPatterns.some(regex => regex.test(userInput));

  if (isTester) {
    // 1. Log the attempt
    logTester(ip, userInput.slice(0, 200));

    // 2. Cloudflare ban
    banIP(ip);

    // 3. Serve lolipop ban page
    res.status(418).send(LOLIPOP_HTML); // 418 = "I'm a teapot" (for trolling)
  } else {
    next();
  }
};
