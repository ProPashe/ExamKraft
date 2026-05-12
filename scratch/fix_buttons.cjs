const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
content = content.replace(/relative z-10\"\s+Modify Transmission/g, 'relative z-10\">\n                                      Modify Transmission');
content = content.replace(/border-white\/10\"\s+<Send size={18} \/>/g, 'border-white\/10\">\n                                      <Send size={18} \/>');
fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('Fixed unclosed buttons.');
