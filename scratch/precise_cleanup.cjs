const fs = require('fs');
const content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
const lines = content.split('\n');

const toRemove = [935, 936, 944, 945, 999];
// Adjust for 0-indexing
const filteredLines = lines.filter((line, index) => {
    const lineNum = index + 1;
    // Specifically check the content to be safe
    if (lineNum === 935 && line.trim() === '</div>') return false;
    if (lineNum === 936 && line.trim() === ')}') return false;
    if (lineNum === 944 && line.trim() === '</div>') return false;
    if (lineNum === 945 && line.trim() === ')}') return false;
    if (lineNum === 999 && line.trim() === ')}') return false;
    return true;
});

fs.writeFileSync('src/pages/Admin.tsx', filteredLines.join('\n'));
console.log('Precise line removal complete.');
