const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Fix the students tab to use fragments
content = content.replace(/{activeTab === 'students' && \(\s*<div className="flex-1 flex flex-col/, "{activeTab === 'students' && (\n               <>\n               <div className=\"flex-1 flex flex-col");
content = content.replace(/<\/AnimatePresence>\s*<\/div>\s*\}\)/, "</AnimatePresence>\n               </>\n            )}");

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('Students tab fragment fix complete.');
