// server/middleware/instant-exile.js
const fs = require('fs');
const path = require('path');

// ===== BANISHMENT CONFIG =====
const EXILE_LOG = path.join(__dirname, 'exiled-users.log');
const EXILE_MESSAGE = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Exiled for "Cool Tricks"</title>
    <style>
      body { 
        background: #000 url('https://i.giphy.com/media/LqWZPd5BX9BwAukXQk/giphy.gif') no-repeat center;
        color: #fff;
        font-family: 'Comic Sans MS', cursive;
        text-align: center;
        padding-top: 20vh;
      }
      .trick-failed {
        font-size: 3em;
        text-shadow: 0 0 10px #ff0000;
      }
    </style>
  </head>
  <body>
    <div class="trick-failed">🚨 YOUR "COOL TRICK" FAILED 🚨</div>
    <p>Your IP has been exiled to the shadow realm.</p>
    <p><small>Try again (don't actually).</small></p>
  </body>
  </html>
`;

// ===== EXILE LOGGER =====
function logExile(ip, payload) {
  fs.appendFileSync(EXILE_LOG, `[${new Date().toISOString()}] ${ip} - "${payload}"\n`);
}

// ===== MIDDLEWARE =====
module.exports = (req, res, next) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Detect "cool trick" attempts (XSS, script tags, etc.)
  const input = JSON.stringify({ ...req.body, ...req.query });
  const sketchyPatterns = [
    /<script\b/i,
    /eval\(/i,
    /document\./i,
    /hey guys watch this/i,
    /cool trick/i
  ];

  if (sketchyPatterns.some(regex => regex.test(input))) {
    // Log the offense
    logExile(ip, `Tried: "${input.slice(0, 100)}"`);
    
    // Send them to exile
    return res.status(418).send(EXILE_MESSAGE);
  }

  next();
};
