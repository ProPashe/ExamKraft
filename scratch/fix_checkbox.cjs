const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// The exact target: after the absolute indicator div, before the flex div
// Line 655: `                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />`
// Line 656: `                                     <div className="flex items-center justify-center">`
// Need to insert `                                     )}` between them

const before = `                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />\n                                     <div className="flex items-center justify-center">`;
const after  = `                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />\n                                     )}\n                                     <div className="flex items-center justify-center">`;

if (content.includes(before)) {
  content = content.replace(before, after);
  console.log('FIX: Inserted )} after absolute indicator div');
} else {
  // Try with \r\n variants
  const before2 = `                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />` + '\n' +
                  `                                     <div className="flex items-center justify-center">`;
  const after2  = `                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />` + '\n' +
                  `                                     )}\n                                     <div className="flex items-center justify-center">`;
  if (content.includes(before2)) {
    content = content.replace(before2, after2);
    console.log('FIX (variant 2): Inserted )} after absolute indicator div');
  } else {
    // Fallback: line-by-line approach
    const lines = content.split('\n');
    let fixed = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]') &&
          lines[i+1] && lines[i+1].includes('flex items-center justify-center')) {
        lines.splice(i + 1, 0, '                                     )}');
        fixed = true;
        console.log('FIX (line fallback at ' + (i+2) + '): Inserted )} after absolute indicator div');
        break;
      }
    }
    if (!fixed) console.warn('WARN: Could not find insertion point');
    content = lines.join('\n');
  }
}

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('Done.');
