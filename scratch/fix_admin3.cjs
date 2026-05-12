const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Normalize all line endings to \r\n for consistency
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const lines = content.split('\n');

function getLine(n) { return lines[n - 1] || ''; }
function setLine(n, val) { lines[n - 1] = val; }
function insertAfter(n, val) { lines.splice(n, 0, val); }

let changes = [];

// ── FIX 1: Line 397 - superuser motion.div missing )} to close the conditional
// Line 397: `                    </motion.div>`
// Need to insert `                  )}` after it
{
  const idx = lines.findIndex(l => l.trim() === '</motion.div>' && 
    lines[lines.indexOf(l) + 1]?.trim() === '' &&
    lines[lines.indexOf(l) + 2]?.trim().startsWith('{/* Welcome Header'));
  if (idx >= 0) {
    lines.splice(idx + 1, 0, '                  )}');
    changes.push('FIX 1: Added )} after superuser motion.div');
  } else {
    // Brute force: find the exact spot
    for (let i = 390; i < 410; i++) {
      if (lines[i] && lines[i].trim() === '</motion.div>') {
        if (lines[i+1] && lines[i+1].trim() === '' && 
            lines[i+2] && lines[i+2].includes('Welcome Header')) {
          lines.splice(i + 1, 0, '                  )}');
          changes.push('FIX 1 (fallback): Added )} after superuser motion.div at line ' + (i+2));
          break;
        }
      }
    }
  }
}

// Rebuild content to re-index lines
content = lines.join('\n');
const lines2 = content.split('\n');

// ── FIX 2: Inside the student table row, fix the selected-indicator conditional
// The structure should be:
//   {selectedStudents.includes(stu.id) && (
//     <div className="absolute left-0..." />
//   )}
//   <div className="flex items-center justify-center">
// Currently missing the )} between the absolute div and the flex div
{
  const target = '                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />';
  const idx = lines2.findIndex(l => l === target);
  if (idx >= 0) {
    // Check if next non-empty line starts with flex div (meaning )} is missing)
    let nextIdx = idx + 1;
    while (nextIdx < lines2.length && lines2[nextIdx].trim() === '') nextIdx++;
    if (lines2[nextIdx] && lines2[nextIdx].includes('flex items-center justify-center') && !lines2[idx + 1].includes(')}')) {
      lines2.splice(idx + 1, 0, '                                     )}');
      changes.push('FIX 2: Added )} after absolute indicator div');
    } else {
      changes.push('FIX 2: Already fixed or not found');
    }
  } else {
    changes.push('FIX 2 WARN: Could not find absolute indicator div');
  }
}

content = lines2.join('\n');
const lines3 = content.split('\n');

// ── FIX 3: Fix mixed line-ending )} insertions from previous script
// The subjects close )} may have been inserted with wrong indentation/format.
// Let's find and ensure it's correct.
{
  // Find "activeTab === 'students' && (" and check that line before (skipping blanks) is )}.
  const studentsIdx = lines3.findIndex(l => l.includes("activeTab === 'students' && ("));
  if (studentsIdx >= 0) {
    let prevIdx = studentsIdx - 1;
    while (prevIdx >= 0 && lines3[prevIdx].trim() === '') prevIdx--;
    if (lines3[prevIdx] && !lines3[prevIdx].trim().endsWith(')}') && !lines3[prevIdx].trim().endsWith(')') ) {
      lines3.splice(studentsIdx, 0, '             )}', '');
      changes.push('FIX 3: Added missing )} before students tab');
    } else {
      changes.push('FIX 3: subjects close already present');
    }
  }
}

content = lines3.join('\n');
const lines4 = content.split('\n');

// ── FIX 4: Lines around 1032-1033 area (was QA section) - find button missing >
// This is the "Generate Response" button in the globalQA section
{
  const idx = lines4.findIndex(l => l.includes('<Send size={18} /> Generate Response') && !lines4[lines4.indexOf(l) - 1]?.includes('>'));
  if (idx >= 0) {
    // The previous line should end with the className attribute without >
    const prevLine = lines4[idx - 1];
    if (prevLine && !prevLine.trimEnd().endsWith('>')) {
      lines4[idx - 1] = prevLine.trimEnd() + '>';
      changes.push('FIX 4: Added > to Generate Response button');
    } else {
      changes.push('FIX 4: Generate Response button already has >');
    }
  } else {
    changes.push('FIX 4: Generate Response button not found or already fixed');
  }
}

content = lines4.join('\n');

// ── FIX 5: Ensure the firebase-messaging-sw.js merge conflicts don't affect build
// (Those are in public/ dir, unrelated to Admin.tsx - skip)
changes.push('FIX 5: Skipped (firebase-messaging-sw.js is unrelated to Admin.tsx)');

// Write back with consistent line endings
fs.writeFileSync('src/pages/Admin.tsx', content);

console.log('\n=== Applied Changes ===');
changes.forEach(c => console.log(' •', c));
console.log('\nFile saved successfully.');
