const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

let lines = content.split('\n');

// 1. Remove duplicate functions (Lines 95-147 approximately)
// We'll search for the markers I added: // ─── Helper UI Components ───
const helperStart = lines.findIndex(l => l.includes('// ─── Helper UI Components ───'));
const helperEnd = lines.findIndex(l => l.includes('export default function Admin()'));
if (helperStart !== -1 && helperEnd !== -1 && helperStart < helperEnd) {
    console.log(`Removing duplicate helper components from line ${helperStart + 1} to ${helperEnd}`);
    lines.splice(helperStart, helperEnd - helperStart);
}

// Re-index after removal
content = lines.join('\n');
lines = content.split('\n');

// 2. Fix Subjects Tab (Line numbers will shift, so we search)
const subjectsStart = lines.findIndex(l => l.includes("{activeTab === 'subjects' && ("));
if (subjectsStart !== -1) {
    // Find where it currently "ends" or rather where the next tab starts
    const studentsStart = lines.findIndex(l => l.includes("{activeTab === 'students' && ("));
    if (studentsStart !== -1) {
        // Look backwards from studentsStart for the closing of subjects
        // It should have two </div> and one )}
        let i = studentsStart - 1;
        while (i > subjectsStart && lines[i].trim() === '') i--;
        
        // We expect something like:
        // 573: ))}
        // 574: </div>
        // (missing </div> and )})
        
        // Let's insert them correctly
        // We'll replace the lines between the last content of subjects and the start of students
        const lastSubjectContentIdx = i; // This is the line with ))} usually
        console.log(`Fixing subjects tab ending around line ${lastSubjectContentIdx + 1}`);
        
        // Remove everything between lastSubjectContentIdx and studentsStart
        lines.splice(lastSubjectContentIdx + 1, studentsStart - (lastSubjectContentIdx + 1), 
            '                  </div>',
            '               </div>',
            '            )}',
            ''
        );
    }
}

// Re-index
content = lines.join('\n');
lines = content.split('\n');

// 3. Fix Payments Tab
const paymentsStart = lines.findIndex(l => l.includes("{activeTab === 'payments' && ("));
if (paymentsStart !== -1) {
    const announcementsStart = lines.findIndex(l => l.includes("{activeTab === 'announcements' && ("));
    if (announcementsStart !== -1) {
        let i = announcementsStart - 1;
        while (i > paymentsStart && lines[i].trim() === '') i--;
        // i is currently pointing to a line that should be )} but might be </div>
        if (lines[i].trim() === '</div>') {
            console.log(`Fixing payments tab ending at line ${i + 1}`);
            lines[i] = '            )}';
        }
    }
}

// 4. Fix Announcements Tab
const announcementsStartFix = lines.findIndex(l => l.includes("{activeTab === 'announcements' && ("));
if (announcementsStartFix !== -1) {
    const qaStart = lines.findIndex(l => l.includes("{activeTab === 'qa' && ("));
    if (qaStart !== -1) {
        let i = qaStart - 1;
        while (i > announcementsStartFix && lines[i].trim() === '') i--;
        if (lines[i].trim() === '</div>') {
            console.log(`Fixing announcements tab ending at line ${i + 1}`);
            lines[i] = '            )}';
        }
    }
}

// 5. Fix QA Tab
const qaStartFix = lines.findIndex(l => l.includes("{activeTab === 'qa' && ("));
if (qaStartFix !== -1) {
    // Fix inner missing )}
    const edgeDecoratorIdx = lines.findIndex((l, idx) => idx > qaStartFix && l.includes('Edge Decorator'));
    if (edgeDecoratorIdx !== -1) {
        const condStart = edgeDecoratorIdx + 1; // {!qa.adminReply && (
        const divIdx = condStart + 1; // <div ... />
        if (lines[divIdx+1].trim() !== ')}' && lines[divIdx+1].trim().includes('</div>')) {
            console.log(`Fixing QA inner conditional at line ${divIdx + 2}`);
            lines.splice(divIdx + 1, 0, '                           )}');
        }
    }

    const notificationsStart = lines.findIndex(l => l.includes("{activeTab === 'notifications' && ("));
    if (notificationsStart !== -1) {
        let i = notificationsStart - 1;
        while (i > qaStartFix && lines[i].trim() === '') i--;
        // Should have two </div> and one )}
        // Currently it might be just </div> </div>
        if (lines[i].trim() === '</div>' && lines[i-1].trim() === '</div>') {
            console.log(`Fixing QA tab ending at line ${i + 1}`);
            lines.splice(i + 1, 0, '            )}');
        }
    }
}

// 6. Fix Main Container (Missing </div> before </main>)
const mainCloseIdx = lines.findIndex(l => l.trim() === '</main>');
if (mainCloseIdx !== -1) {
    // Check if the previous non-empty line is the closing of the last tab
    let i = mainCloseIdx - 1;
    while (i > 0 && lines[i].trim() === '') i--;
    if (lines[i].trim() === ')}' || lines[i].trim() === '</div>') {
        console.log(`Adding missing closing div for main container before line ${mainCloseIdx + 1}`);
        lines.splice(mainCloseIdx, 0, '         </div>');
    }
}

fs.writeFileSync('src/pages/Admin.tsx', lines.join('\n'));
console.log('Admin.tsx repaired successfully.');
