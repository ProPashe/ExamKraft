const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
const lines = content.split('\n');

function fixLine(lineNum, oldText, newText) {
  const idx = lineNum - 1;
  if (lines[idx] !== undefined && lines[idx].includes(oldText.trim())) {
    lines[idx] = lines[idx].replace(oldText, newText);
    console.log(`Fixed line ${lineNum}`);
    return true;
  }
  // Search nearby if off by a line
  for (let i = Math.max(0, idx - 2); i < Math.min(lines.length, idx + 3); i++) {
    if (lines[i] !== undefined && lines[i].includes(oldText.trim())) {
      lines[i] = lines[i].replace(oldText, newText);
      console.log(`Fixed near line ${lineNum} (actual line ${i + 1})`);
      return true;
    }
  }
  console.warn(`WARN: Could not find target at line ${lineNum}: "${oldText.trim()}"`);
  return false;
}

// FIX 1: Line 315 - motion.div missing closing >
fixLine(315,
  'className="p-10 glass-panel border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-transparent rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8"',
  'className="p-10 glass-panel border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-transparent rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">'
);

// FIX 2: Line 336 - button missing > before text content
fixLine(336,
  'className="px-10 py-5 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-500/30 whitespace-nowrap"',
  'className="px-10 py-5 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-500/30 whitespace-nowrap">'
);

// FIX 3: Line 339 - missing closing )} for the superuser section
fixLine(339,
  '                    </motion.div>',
  '                    </motion.div>\n                  )}'
);

// FIX 4: Line 476 - button in subjects section missing >
fixLine(476,
  'className="px-8 py-4 bg-purple-600/90 hover:bg-purple-600 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] text-white shadow-2xl shadow-purple-900/30 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-xl border border-white/10"',
  'className="px-8 py-4 bg-purple-600/90 hover:bg-purple-600 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] text-white shadow-2xl shadow-purple-900/30 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-xl border border-white/10">'
);

// FIX 5: Line 516 - missing )} to close the subjects conditional
// The subjects section ends at line 516, need to close it properly
// Line 516 has )} which ends students, but subjects )} is missing above it
fixLine(516,
  '               </div> )}',
  '               </div>\n             )}\n\n             {activeTab === \'students\' && ('
);

// FIX 6: Line 594-596 - the selected student indicator missing closing )}
fixLine(595,
  '                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />',
  '                                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />\n                                     )}'
);

// FIX 7: Line 656 - select missing >
fixLine(656,
  'className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-cyan-400 outline-none cursor-pointer"',
  'className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-cyan-400 outline-none cursor-pointer">'
);

// FIX 8: Line 666 - first pagination button missing >
fixLine(666,
  'className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-700 hover:text-white transition-all disabled:opacity-20"',
  'className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-700 hover:text-white transition-all disabled:opacity-20">'
);

// FIX 9: Line 672 - second pagination button missing >
fixLine(672,
  'className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-700 hover:text-white transition-all disabled:opacity-20"',
  'className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-700 hover:text-white transition-all disabled:opacity-20">'
);

// FIX 10: Line 680 - stray > that is misplaced (was closing the students section incorrectly)
fixLine(680, '>', '');

// Write back
const fixed = lines.join('\n');
fs.writeFileSync('src/pages/Admin.tsx', fixed);
console.log('\nAll fixes applied. Checking for remaining issues...');
