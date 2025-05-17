const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

function sanitizeInput(input) {
  return domPurify.sanitize(input);
}

module.exports = { sanitizeInput };
