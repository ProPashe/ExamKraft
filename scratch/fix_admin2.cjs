const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: Add missing component definitions before `export default function Admin`
// ─────────────────────────────────────────────────────────────────────────────
const missingComponents = `
// ─── Helper UI Components ─────────────────────────────────────────────────────

function StatBox({ label, value, subValue, icon: Icon, color }: {
  label: string; value: any; subValue: string;
  icon: React.ElementType; color: 'cyan' | 'purple' | 'amber' | 'emerald';
}) {
  const colors = {
    cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400',    glow: 'shadow-cyan-500/10' },
    purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  glow: 'shadow-purple-500/10' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   glow: 'shadow-amber-500/10' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  }[color];
  return (
    <div className={\`glass-panel p-8 rounded-[2.5rem] border \${colors.border} \${colors.bg} relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl \${colors.glow}\`}>
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">{label}</p>
        <div className={\`w-10 h-10 rounded-2xl \${colors.bg} border \${colors.border} flex items-center justify-center \${colors.text}\`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-4xl font-black tracking-tighter text-white mb-2">{value}</p>
      <p className={\`text-[10px] font-bold uppercase tracking-widest \${colors.text} opacity-60\`}>{subValue}</p>
      <div className={\`absolute bottom-0 right-0 w-24 h-24 \${colors.bg} blur-[40px] rounded-full -mr-12 -mb-12\`} />
    </div>
  );
}

function QuickActionButton({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 bg-white/[0.02] hover:bg-cyan-500/10 rounded-2xl text-left transition-all border border-transparent hover:border-cyan-500/20 group"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
        <Icon size={18} />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500 group-hover:text-cyan-400 transition-colors">{label}</span>
    </button>
  );
}

function ActionHubButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-5 min-w-[90px] hover:bg-white/[0.05] rounded-[2rem] transition-all duration-500 group relative"
    >
      <div className="w-14 h-14 rounded-[1.5rem] bg-white/[0.03] flex items-center justify-center text-gray-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all border border-white/5 group-hover:border-cyan-400/30 shadow-xl">
        <Icon size={24} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500 group-hover:text-cyan-400 transition-colors">{label}</span>
      <div className="absolute bottom-2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
`;

content = content.replace(
  'export default function Admin() {',
  missingComponents + 'export default function Admin() {'
);
console.log('FIX 1: Added missing component definitions');

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: Line 516 area - subjects tab is missing its closing )}
// The subjects conditional opens at "activeTab === 'subjects' && ("
// It closes at </div> on line 516 but is missing the )}.
// Then "activeTab === 'students' && (" starts at line 517 without closing subjects.
// ─────────────────────────────────────────────────────────────────────────────
content = content.replace(
  /(\s*<\/div>\s*\r?\n\s*\r?\n?\s*\{activeTab === 'students' && \()/,
  '\n               )}\n\n             {activeTab === \'students\' && ('
);
console.log('FIX 2: Closed subjects conditional before students tab');

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: Line 1051-1052 area - push notification button missing >
// ─────────────────────────────────────────────────────────────────────────────
content = content.replace(
  /className="w-full py-7 bg-rose-500 text-white rounded-\[2\.5rem\] font-bold uppercase tracking-\[0\.4em\] text-\[13px\] shadow-2xl shadow-rose-900\/40 hover:scale-\[1\.02\] active:scale-\[0\.98\] transition-all flex items-center justify-center gap-4 disabled:opacity-30 relative z-10 ring-1 ring-white\/10"\s*\n(\s*\{loading)/,
  'className="w-full py-7 bg-rose-500 text-white rounded-[2.5rem] font-bold uppercase tracking-[0.4em] text-[13px] shadow-2xl shadow-rose-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-30 relative z-10 ring-1 ring-white/10">\n$1'
);
console.log('FIX 3: Fixed push notification button tag');

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4: Add React import if not present (needed for React.ElementType in components)
// ─────────────────────────────────────────────────────────────────────────────
if (!content.includes("import React") && !content.includes("import * as React")) {
  content = content.replace(
    "import { useState",
    "import React, { useState"
  );
  console.log('FIX 4: Added React import');
} else {
  console.log('FIX 4: React already imported, skipping');
}

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('\nAll fixes written. File saved.');
