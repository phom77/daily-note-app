import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Save, ChevronLeft, X, Calendar, Hash, Folder, ChevronDown, ChevronRight, FolderOpen, Maximize2, Minimize2 } from 'lucide-react';
import type { Log } from '../types';
import { apiService } from '../services/api';

interface LogModuleProps {
  logs: Log[];
  setLogs: (logs: Log[]) => void;
  isMobile: boolean;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

const DRAFT_KEY = 'dailysync_log_draft';

export const LogModule: React.FC<LogModuleProps> = ({ logs, setLogs, isMobile, isFocusMode, toggleFocusMode }) => {
  // --- DRAFT LOADING LOGIC ---
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const draft = loadDraft();

  // Initialize state from Draft if exists, otherwise default
  const [selectedLogId, setSelectedLogId] = useState<number | null>(draft?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor State (Initialized from Draft)
  const [editTitle, setEditTitle] = useState(draft?.title ?? '');
  const [editContent, setEditContent] = useState(draft?.content ?? '');
  const [editTags, setEditTags] = useState<string[]>(draft?.tags ?? []);
  const [editFolder, setEditFolder] = useState(draft?.folder ?? '');
  const [tagInput, setTagInput] = useState('');
  const [nextReview, setNextReview] = useState(draft?.nextReviewDate ?? '');

  // UI State for Folders
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // --- AUTO SAVE DRAFT ---
  // Whenever any editor field changes, save to localStorage
  useEffect(() => {
    const currentDraft = {
      id: selectedLogId,
      title: editTitle,
      content: editContent,
      tags: editTags,
      folder: editFolder,
      nextReviewDate: nextReview
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(currentDraft));
  }, [selectedLogId, editTitle, editContent, editTags, editFolder, nextReview]);

  // Removed the old useEffect that synced selectedLogId with fields.
  // Instead, we populate fields explicitly when a log is selected via handleLogSelect.

  const handleLogSelect = (log: Log) => {
    // If we select a log from the sidebar, we load it into the editor
    // This overwrites any current draft (which is expected behavior when clicking a new item)
    setSelectedLogId(log.id);
    setEditTitle(log.title);
    setEditContent(log.content);
    setEditTags(log.tags);
    setEditFolder(log.folder || '');
    setNextReview(log.nextReviewDate || '');
  };

  const handleCreateNew = () => {
    // Clear draft and reset fields
    localStorage.removeItem(DRAFT_KEY);
    setSelectedLogId(null);
    setEditTitle(''); 
    setEditContent(''); 
    setEditTags([]); 
    setEditFolder(''); 
    setNextReview('');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    
    // Find existing log to preserve creation date if editing
    const existingLog = logs.find(l => l.id === selectedLogId);

    const logData = {
      title: editTitle,
      content: editContent,
      tags: editTags,
      folder: editFolder.trim(),
      nextReviewDate: nextReview || null,
      // If editing, keep original date. If new, use now.
      createdAt: existingLog ? existingLog.createdAt : Date.now()
    };
    
    // Construct payload
    const payload = selectedLogId ? { ...logData, id: selectedLogId } : logData;
    
    try {
        const savedLog = await apiService.saveLog(payload as Log);
        
        // Clear draft on successful save
        localStorage.removeItem(DRAFT_KEY);

        if (selectedLogId) {
            setLogs(logs.map(l => l.id === selectedLogId ? savedLog : l));
        } else {
            setLogs([savedLog, ...logs]);
            setSelectedLogId(savedLog.id);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to save log. Check console for details.");
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(tagInput.trim())) setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // --- FOLDER LOGIC ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [logs, searchQuery]);

  const logsByFolder = useMemo(() => {
    const groups: Record<string, Log[]> = {};
    const uncategorized: Log[] = [];

    filteredLogs.forEach(log => {
      if (log.folder) {
        if (!groups[log.folder]) groups[log.folder] = [];
        groups[log.folder].push(log);
      } else {
        uncategorized.push(log);
      }
    });

    const sortedFolderNames = Object.keys(groups).sort();
    return { groups, sortedFolderNames, uncategorized };
  }, [filteredLogs]);

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const showList = !isMobile || (isMobile && !selectedLogId && selectedLogId !== 0);
  const showEditor = !isMobile || (isMobile && (selectedLogId || selectedLogId === 0));

  const actuallyShowList = isFocusMode ? false : showList;
  const actuallyShowEditor = isFocusMode ? true : showEditor;

  return (
    <div className="flex h-full flex-col md:flex-row bg-white dark:bg-neutral-900">
      
      {/* --- SIDEBAR LIST (Hidden in Focus Mode) --- */}
      <div className={`flex-col border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 h-full ${actuallyShowList ? 'flex w-full md:w-80 lg:w-80' : 'hidden'} ${isFocusMode ? '!hidden' : ''}`}>
        
        {/* Search & New Button */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-neutral-50/50 dark:bg-neutral-900 z-10">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" placeholder="Search..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors dark:text-neutral-200"
            />
          </div>
          {/* Handle create new explicitly */}
          <button onClick={handleCreateNew} className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-200 dark:shadow-none">
            <Plus size={16} /> New Note
          </button>
        </div>

        {/* Folders & Logs List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {logsByFolder.sortedFolderNames.map(folderName => {
             const isExpanded = expandedFolders[folderName] ?? true; 
             const count = logsByFolder.groups[folderName].length;
             
             return (
               <div key={folderName} className="mb-1">
                 <button 
                    onClick={() => toggleFolder(folderName)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 uppercase tracking-wider group transition-colors"
                 >
                    <div className="flex items-center gap-1">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="flex items-center gap-1.5"><Folder size={12} /> {folderName}</span>
                    </div>
                    <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 rounded-full text-[10px]">{count}</span>
                 </button>
                 
                 {isExpanded && (
                   <div className="ml-2 pl-2 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-1 mt-1">
                     {logsByFolder.groups[folderName].map(log => (
                        <LogItem 
                          key={log.id} 
                          log={log} 
                          isActive={selectedLogId === log.id} 
                          onClick={() => handleLogSelect(log)} 
                        />
                     ))}
                   </div>
                 )}
               </div>
             );
          })}

          {logsByFolder.uncategorized.length > 0 && (
             <div className="mt-4">
                {logsByFolder.sortedFolderNames.length > 0 && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                     <Hash size={12} /> Uncategorized
                  </div>
                )}
                <div className="space-y-1">
                  {logsByFolder.uncategorized.map(log => (
                      <LogItem 
                        key={log.id} 
                        log={log} 
                        isActive={selectedLogId === log.id} 
                        onClick={() => handleLogSelect(log)} 
                      />
                  ))}
                </div>
             </div>
          )}

          {logs.length === 0 && (
            <div className="text-center mt-10 text-neutral-400 text-sm">
              <p>No notes yet.</p>
            </div>
          )}

        </div>
      </div>

      {/* --- EDITOR PANEL --- */}
      <div className={`flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-900 relative ${actuallyShowEditor ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Editor Toolbar - ADDED BORDER */}
        <div className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => isFocusMode ? toggleFocusMode() : setSelectedLogId(null)} className={`md:hidden p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full`}>
                <ChevronLeft size={24} />
            </button>
            {/* Focus Mode Toggle */}
            <button 
                onClick={toggleFocusMode}
                title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                className={`p-2 rounded-full transition-all hidden md:block ${isFocusMode ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
                {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white text-sm font-medium rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm">
            <Save size={16} /> <span>Save</span>
          </button>
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className={`mx-auto h-full flex flex-col p-4 md:p-8 transition-all ${isFocusMode ? 'max-w-4xl' : 'max-w-3xl'}`}>
            
            {/* Meta Inputs (Folder & Date) - ADDED BORDERS & BACKGROUNDS */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
               {/* Folder Input */}
               <div className="group flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                  <FolderOpen size={16} className="text-neutral-400 group-focus-within:text-emerald-500" />
                  <input 
                    type="text" 
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value)}
                    placeholder="Folder..." 
                    className="bg-transparent border-none p-0 text-sm font-medium text-neutral-600 dark:text-neutral-300 placeholder-neutral-400 focus:ring-0 w-32 md:w-40"
                  />
               </div>

               {/* Date Input */}
               <div className="group flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                  <Calendar size={16} className="text-neutral-400 group-focus-within:text-emerald-500" />
                  <input 
                    type="date" 
                    value={nextReview}
                    onChange={(e) => setNextReview(e.target.value)}
                    className="bg-transparent border-none p-0 text-sm font-medium text-neutral-600 dark:text-neutral-300 focus:ring-0"
                  />
               </div>
            </div>

            {/* Title Input - ADDED BOTTOM BORDER */}
            <div className="mb-4">
              <input 
                type="text" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                placeholder="Untitled Note" 
                className="w-full text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-700 border-none border-b border-transparent focus:border-neutral-200 dark:focus:border-neutral-700 focus:outline-none focus:ring-0 bg-transparent px-0 py-2 transition-colors" 
              />
            </div>

            {/* Tags Input */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {editTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-medium rounded-md">
                  #{tag}
                  <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="hover:text-red-500"><X size={12}/></button>
                </span>
              ))}
              <input 
                type="text" 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                onKeyDown={addTag} 
                placeholder={editTags.length === 0 ? "Add tags (Enter)..." : "+ tag"} 
                className="text-sm bg-transparent border-none focus:ring-0 text-neutral-500 placeholder-neutral-400 p-0 w-32" 
              />
            </div>

            {/* Main Text Area - ADDED BORDER & SHADOW */}
            <div className="flex-1 flex flex-col min-h-[500px] relative">
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                placeholder="Start writing..." 
                className="flex-1 w-full resize-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 p-8 text-lg leading-loose text-neutral-700 dark:text-neutral-300 font-sans outline-none transition-all" 
                spellCheck="false" 
              />
            </div>
            
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LogItem = ({ log, isActive, onClick }: { log: Log, isActive: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick} 
    className={`
      p-3 rounded-lg cursor-pointer transition-all duration-200 group relative overflow-hidden border
      ${isActive 
        ? 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
        : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
      }
    `}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700'}`}></div>
    <div className="pl-2">
      <h3 className={`font-medium text-sm truncate ${isActive ? 'text-neutral-900 dark:text-neutral-100' : ''}`}>
        {log.title || 'Untitled'}
      </h3>
      <p className="text-[11px] opacity-60 mt-1 truncate">
        {log.content || 'No content...'}
      </p>
      {log.tags.length > 0 && (
         <div className="flex gap-1 mt-2 overflow-hidden">
            {log.tags.slice(0, 3).map(t => (
               <span key={t} className="text-[9px] px-1 bg-neutral-100 dark:bg-neutral-700 rounded text-neutral-500 dark:text-neutral-400">#{t}</span>
            ))}
         </div>
      )}
    </div>
  </div>
);