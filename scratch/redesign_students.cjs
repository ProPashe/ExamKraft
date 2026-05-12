const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const studentsTabImplementation = `
            {activeTab === 'students' && (
               <>
                  {/* Grid Control Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                     <div>
                        <h2 className="text-4xl font-bold tracking-tight">Personnel <span className="text-cyan-400 font-light italic">Intelligence</span></h2>
                        <div className="flex items-center gap-3 mt-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">Synchronized terminal monitoring active</p>
                        </div>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                           <input 
                              placeholder="Search Name, ID, or Email..." 
                              className="pl-14 pr-6 py-4 bg-[#0A0C16] border border-white/5 rounded-2xl text-[11px] font-bold focus:border-cyan-400/50 outline-none w-full md:w-96 shadow-inner transition-all placeholder:text-gray-700" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                        <div className="flex items-center gap-2 bg-[#0A0C16] border border-white/5 p-1.5 rounded-2xl">
                           <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all border border-transparent hover:border-white/5 flex items-center gap-3">
                              <Filter size={14} /> Filter
                           </button>
                           <button className="px-5 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">
                              <Download size={14} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Select All Across Pages Banner */}
                  <AnimatePresence>
                    {selectedStudents.length === students.filter(s => 
                       s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       s.id.toLowerCase().includes(searchQuery.toLowerCase())
                    ).slice((currentPage - 1) * pageSize, currentPage * pageSize).length && students.length > pageSize && !selectAllAcrossPages && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden mb-6"
                       >
                          <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                             <span>All {selectedStudents.length} personnel on this page are selected.</span>
                             <button 
                               onClick={() => setSelectAllAcrossPages(true)}
                               className="px-4 py-2 bg-cyan-400 text-black rounded-lg hover:bg-white transition-colors"
                             >
                                Select all {students.length} personnel across all sectors
                             </button>
                          </div>
                       </motion.div>
                    )}
                    {selectAllAcrossPages && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden mb-6"
                       >
                          <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                             <span>All {students.length} personnel across all sectors are currently selected.</span>
                             <button 
                               onClick={() => {
                                  setSelectAllAcrossPages(false);
                                  setSelectedStudents([]);
                               }}
                               className="text-white hover:underline"
                             >
                                Clear selection
                             </button>
                          </div>
                       </motion.div>
                    )}
                  </AnimatePresence>

                  {/* High-Performance Data Grid */}
                  <div className="flex-1 glass-panel rounded-[3.5rem] bg-[#0A0C16]/40 border-white/5 overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                     <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 z-20 bg-[#0D1117] border-b border-white/10">
                           <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
                              <th className="pl-10 pr-6 py-8 w-16 text-center">
                                 <div className="flex items-center justify-center">
                                    <input 
                                      type="checkbox" 
                                      className="accent-cyan-400 w-5 h-5 rounded-[0.5rem] border-white/10 bg-white/5 cursor-pointer appearance-none checked:bg-cyan-400 checked:border-cyan-400 border relative transition-all"
                                      checked={selectedStudents.length > 0 && selectedStudents.length === students.filter(s => 
                                         s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                         s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                         s.id.toLowerCase().includes(searchQuery.toLowerCase())
                                      ).slice((currentPage - 1) * pageSize, currentPage * pageSize).length}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                           const pageStudents = students
                                             .filter(s => 
                                               s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                               s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                               s.id.toLowerCase().includes(searchQuery.toLowerCase())
                                             )
                                             .slice((currentPage - 1) * pageSize, currentPage * pageSize);
                                           setSelectedStudents(pageStudents.map(s => s.id));
                                        } else {
                                           setSelectedStudents([]);
                                           setSelectAllAcrossPages(false);
                                        }
                                      }}
                                    />
                                    {selectedStudents.length > 0 && <CheckCircle size={10} className="absolute text-black pointer-events-none" />}
                                 </div>
                              </th>
                              <th className="px-6 py-8">Intelligence Spec</th>
                              <th className="px-6 py-8">Signal Ident (ID)</th>
                              <th className="px-6 py-8">Neural Link (Email)</th>
                              <th className="px-6 py-8">Cognitive Rank</th>
                              <th className="px-6 py-8">Sector Placement</th>
                              <th className="px-10 py-8 text-right">Operations</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                           {students
                             .filter(s => 
                               s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               s.id.toLowerCase().includes(searchQuery.toLowerCase())
                             )
                             .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                             .map(stu => (
                              <tr key={stu.id} className={cn(
                                "hover:bg-cyan-500/[0.04] transition-all group cursor-default",
                                selectedStudents.includes(stu.id) || selectAllAcrossPages ? "bg-cyan-400/[0.04]" : ""
                              )}>
                                 <td className="pl-10 pr-6 py-8 text-center relative">
                                    {(selectedStudents.includes(stu.id) || selectAllAcrossPages) && (
                                       <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_15px_#22d3ee]" />
                                     )}
                                    <div className="flex items-center justify-center">
                                       <input 
                                         type="checkbox" 
                                         className="accent-cyan-400 w-5 h-5 rounded-[0.5rem] border-white/10 bg-white/5 cursor-pointer appearance-none checked:bg-cyan-400 checked:border-cyan-400 border relative transition-all"
                                         checked={selectedStudents.includes(stu.id) || selectAllAcrossPages}
                                         onChange={() => {
                                           if (selectAllAcrossPages) {
                                              setSelectAllAcrossPages(false);
                                              setSelectedStudents(students.filter(s => s.id !== stu.id).map(s => s.id));
                                           } else {
                                              setSelectedStudents(prev => 
                                                prev.includes(stu.id) ? prev.filter(id => id !== stu.id) : [...prev, stu.id]
                                              );
                                           }
                                         }}
                                       />
                                       {(selectedStudents.includes(stu.id) || selectAllAcrossPages) && <CheckCircle size={10} className="absolute text-black pointer-events-none" />}
                                    </div>
                                 </td>
                                 <td className="px-6 py-8">
                                    <div className="flex items-center gap-5">
                                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-[1px] group-hover:scale-105 transition-transform">
                                          <div className="w-full h-full rounded-[0.95rem] bg-[#0D1117] flex items-center justify-center overflow-hidden border border-white/5">
                                             {stu.avatar ? <img src={stu.avatar} className="w-full h-full object-cover" /> : (stu.displayName?.charAt(0) || 'U')}
                                          </div>
                                       </div>
                                       <span className="text-[13px] font-bold tracking-tight text-white/95 group-hover:text-cyan-400 transition-colors uppercase">{stu.displayName}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-8">
                                    <span className="text-[10px] font-mono text-gray-600 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5">{stu.id.substring(0, 12)}</span>
                                 </td>
                                 <td className="px-6 py-8">
                                    <span className="text-[12px] font-medium text-gray-500 tracking-tight">{stu.email}</span>
                                 </td>
                                 <td className="px-6 py-8">
                                    <div className="flex items-center gap-3">
                                       <span className="text-[11px] font-black text-cyan-400 italic">LVL {stu.level || 1}</span>
                                       <div className="w-20 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: '45%' }} />
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-8">
                                    <span className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black uppercase text-gray-600 tracking-widest">Sector-3</span>
                                 </td>
                                 <td className="px-10 py-8 text-right">
                                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-gray-700 hover:text-white transition-all"><MoreVertical size={16} /></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                        </table>
                     </div>

                     {/* Grid Pagination Footer */}
                     <div className="px-10 py-8 border-t border-white/5 bg-[#0D1117]/50 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">
                             Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, students.length)} of {students.length} personnel
                           </span>
                           <div className="w-[1px] h-4 bg-white/10" />
                           <select 
                             value={pageSize}
                             onChange={(e) => setPageSize(Number(e.target.value))}
                             className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-cyan-400 outline-none cursor-pointer">
                              <option value={25}>25 Per Page</option>
                              <option value={50}>50 Per Page</option>
                              <option value={100}>100 Per Page</option>
                           </select>
                        </div>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                             disabled={currentPage === 1}
                             className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-700 hover:text-white transition-all disabled:opacity-20">
                             <ChevronLeft size={16} />
                           </button>
                           <button 
                             onClick={() => setCurrentPage(prev => Math.min(Math.ceil(students.length / pageSize), prev + 1))}
                             disabled={currentPage * pageSize >= students.length}
                             className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-700 hover:text-white transition-all disabled:opacity-20">
                             <ChevronRight size={16} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Redesigned Sticky Action Bar */}
                  <AnimatePresence>
                     {(selectedStudents.length > 0 || selectAllAcrossPages) && (
                       <motion.div 
                         initial={{ y: 100, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         exit={{ y: 100, opacity: 0 }}
                         className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#0A0C16]/90 border border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.9)] px-8 py-6 flex items-center gap-12 z-[100] backdrop-blur-3xl ring-2 ring-cyan-500/20"
                       >
                          <div className="flex items-center gap-6 pl-2 pr-10 border-r border-white/10">
                             <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center text-xl font-black text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                {selectAllAcrossPages ? students.length : selectedStudents.length}
                             </div>
                             <div className="flex flex-col">
                                <p className="text-[13px] font-black uppercase tracking-[0.3em] text-cyan-400">Personnel Selected</p>
                                <button 
                                  onClick={() => {
                                     setSelectedStudents([]);
                                     setSelectAllAcrossPages(false);
                                  }} 
                                  className="text-[11px] font-bold text-gray-500 uppercase hover:text-rose-400 transition-colors mt-1 underline underline-offset-4"
                                >
                                   Reset Connection
                                </button>
                             </div>
                          </div>

                          <div className="flex items-center gap-6 pr-4">
                             <ActionHubButton icon={CheckCircle} label="Marking" onClick={() => setShowStudentAction({ type: 'marking', students: selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id)) })} />
                             <ActionHubButton icon={MessageCircle} label="Neural Relay" onClick={() => setShowStudentAction({ type: 'messages', students: selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id)) })} />
                             <ActionHubButton icon={Monitor} label="Repository" onClick={() => setShowStudentAction({ type: 'videos', students: selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id)) })} />
                             <ActionHubButton icon={PlusCircle} label="Neural Board" onClick={() => {
                                const targets = selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id));
                                const sid = targets.length === 1 ? \`session-\${targets[0].id}\` : \`session-multi-\${Date.now()}\`;
                                window.open(\`/whiteboard/\${sid}\`, '_blank');
                             }} />
                             <ActionHubButton icon={Award} label="Credentials" onClick={() => setShowStudentAction({ type: 'certificates', students: selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id)) })} />
                             <ActionHubButton icon={MessagesSquare} label="Knowledge" onClick={() => setShowStudentAction({ type: 'knowledge', students: selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id)) })} />
                             <ActionHubButton icon={Megaphone} label="Dispatch" onClick={() => setShowStudentAction({ type: 'bulletins', students: selectAllAcrossPages ? students : students.filter(s => selectedStudents.includes(s.id)) })} />
                          </div>
                       </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Sub-Action Modals */}
                  <AnimatePresence>
                     {showStudentAction && (
                        <div className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
                           <motion.div 
                             initial={{ scale: 0.95, opacity: 0, y: 20 }}
                             animate={{ scale: 1, opacity: 1, y: 0 }}
                             exit={{ scale: 0.95, opacity: 0, y: 20 }}
                             className="bg-[#0A0C16] border border-white/5 w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ring-1 ring-white/10"
                           >
                              <header className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                 <div>
                                    <div className="flex items-center gap-3 mb-2">
                                       <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                                       <p className="text-[11px] font-bold uppercase text-cyan-400 tracking-[0.4em]">Protocol Execution Matrix</p>
                                    </div>
                                    <h3 className="text-3xl font-bold tracking-tight text-white/90">
                                       {showStudentAction.type === 'marking' && 'Neural Marking Center'}
                                       {showStudentAction.type === 'messages' && 'Neural Relay Network'}
                                       {showStudentAction.type === 'videos' && 'Repository Authorization'}
                                       {showStudentAction.type === 'certificates' && 'Credential Issuance Forge'}
                                       {showStudentAction.type === 'knowledge' && 'Cognitive Path Analysis'}
                                       {showStudentAction.type === 'bulletins' && 'Direct Signal Dispatch'}
                                    </h3>
                                 </div>
                                 <button onClick={() => setShowStudentAction(null)} className="p-5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-500 rounded-3xl transition-all border border-white/5"><X size={24} /></button>
                              </header>

                              <div className="flex-1 flex flex-col min-h-0">
                                 {showStudentAction.type === 'marking' && <div className="flex-1 overflow-y-auto p-12 custom-scrollbar"><AdminSelectionMarking students={showStudentAction.students} setStatus={setStatus} /></div>}
                                 {showStudentAction.type === 'messages' && <AdminSelectionMessages students={showStudentAction.students} setStatus={setStatus} />}
                                 {showStudentAction.type === 'videos' && <div className="flex-1 overflow-y-auto p-12 custom-scrollbar"><AdminSelectionVideos students={showStudentAction.students} setStatus={setStatus} /></div>}
                                 {showStudentAction.type === 'certificates' && <div className="flex-1 overflow-y-auto p-12 custom-scrollbar"><AdminSelectionCertificates students={showStudentAction.students} setStatus={setStatus} /></div>}
                                 {showStudentAction.type === 'knowledge' && <div className="flex-1 overflow-y-auto p-12 custom-scrollbar"><AdminSelectionQA students={showStudentAction.students} setStatus={setStatus} /></div>}
                                 {showStudentAction.type === 'bulletins' && <div className="flex-1 overflow-y-auto p-12 custom-scrollbar"><AdminSelectionBulletins students={showStudentAction.students} setStatus={setStatus} /></div>}
                              </div>
                           </motion.div>
                        </div>
                     )}
                  </AnimatePresence>
               </>
            )}
`;

// Replace the old students tab
// I need a reliable way to find the old students tab block.
// It starts at {activeTab === 'students' && ( and ends before {activeTab === 'videos'
const startToken = "{activeTab === 'students' && (";
const endToken = "{activeTab === 'videos' &&";

const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + studentsTabImplementation + "\n\n            " + content.substring(endIndex);
    
    // Also need to add setSelectAllAcrossPages state to the Admin component
    if (!content.includes('selectAllAcrossPages')) {
        content = content.replace("const [selectedStudents, setSelectedStudents] = useState<string[]>([]);", "const [selectedStudents, setSelectedStudents] = useState<string[]>([]);\n  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);");
    }
    
    fs.writeFileSync('src/pages/Admin.tsx', content);
    console.log('Scalable Student Grid redesign applied successfully.');
} else {
    console.log('Could not find students tab boundaries.');
}
