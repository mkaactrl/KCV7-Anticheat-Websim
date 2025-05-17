const BLACKLISTED_PATTERNS = [
  /<\s*script\b/i,             // Blocks `<script>alert(1)</script>`
  /eval\s*\(/,                 // Blocks `eval("malicious_code")`
  /document\.(cookie|write)/,  // Blocks cookie theft/DOM manipulation
  /fetch\s*\(/,                // Blocks external HTTP requests (if unwanted)
  /require\s*\(|import\s/,     // Blocks dynamic imports (if sandboxed)
  /process\.env|fs\./          // Blocks Node.js filesystem/env access
];

function isMalicious(code) {
  return BLACKLISTED_PATTERNS.some(regex => regex.test(code));
}

if (isMalicious(userCode)) {
  throw new Error("Malicious code detected!");
}
