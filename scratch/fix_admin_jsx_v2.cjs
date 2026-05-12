const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Fix 1: Subjects tab ending
// Current:
// 516:                     ))}
// 517:                  </div>
// 518:                )}
// 519:                   </div>
// 520:                </div>
// 521:             )}
const subjectsOld = `                    ))}
                 </div>
               )}
                  </div>
               </div>
            )}`;
const subjectsNew = `                    ))}
                 </div>
               </div>
            )}`;
// (Note: Indentation might vary, so we use a more flexible replacement)

// Let's use regex for the subjects tab ending
content = content.replace(/(\s*)\}\)\)\}\s*(\s*)<\/div>\s*(\s*)\}\)\s*(\s*)<\/div>\s*(\s*)<\/div>\s*(\s*)\}\)/, (match, p1, p2, p3, p4, p5, p6) => {
    return `${p1}}))}${p2}</div>${p3}</div>${p4})}`;
});

// Fix 2: Payments tab ending
// Current:
// 894:                  </div>
// 895:               </div>
content = content.replace(/(\s*)\}\)\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*<\/div>/, (match, p1) => {
    return `${p1}})}</tbody></table></div></div></div>)}`;
});

// Actually, let's just do it manually with a very specific replacement for the subjects block
const subjectsTarget = `                    ))}
                 </div>
               )}
                  </div>
               </div>
            )}`;
const subjectsFixed = `                    ))}
                 </div>
               </div>
            )}`;

if (content.includes(subjectsTarget)) {
    content = content.replace(subjectsTarget, subjectsFixed);
    console.log('Fixed subjects tab.');
}

// Fix 3: Announcements tab
const annTarget = `                     </div>
                  </div>
               </div>`;
// Wait, I need to be more specific.

// Let's just fix the whole structure by matching the activeTab patterns
content = content.replace(/(\{activeTab === 'payments' && \([\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/, '$1\n               </div>\n            )}');
content = content.replace(/(\{activeTab === 'announcements' && \([\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/, '$1\n               </div>\n            )}');

// Fix QA inner conditional
content = content.replace(/(\{!qa\.adminReply && \(\s*<div[^>]*\/>)\s*<\/div>/, '$1\n                           )}');

// Fix QA outer conditional
content = content.replace(/(\{activeTab === 'qa' && \([\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/, '$1\n               </div>\n            )}');

// Fix main container closing
// Find </main> and check if there's a </div> before it
if (!content.includes('</div>\n         </main>')) {
    content = content.replace(/(\s*)<\/main>/, '\n         </div>$1</main>');
}

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log('Repaired Admin.tsx');
