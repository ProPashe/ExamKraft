const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Fix 1: Home tab ending
content = content.replace(/(\n\s*<\/div>)\n\s*\{activeTab === 'subjects'/, '$1\n            )}\n\n            {activeTab === \'subjects\'');

// Fix 2: Remove extra )} at QA end
content = content.replace(/\n\s*\}\)\s*\n\s*\}\)\s*\n\s*\{activeTab === 'notifications'/, '\n            )}\n\n            {activeTab === \'notifications\'');

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('Final Admin.tsx fixes applied.');
