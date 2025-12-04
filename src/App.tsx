import { useState, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TaskModule } from './components/TaskModule';
import { LogModule } from './components/LogModule';
import { StatsModule } from './components/StatsModule';
import { SettingsModule } from './components/SettingsModule';
import { AuthModule } from './components/AuthModule';
import { storageService } from './services/storage';
import { apiService } from './services/api';
import { supabase } from './services/supabase';
import type { AppData, Tab, Task, Log } from './types';

export default function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState<any>(null);

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [data, setData] = useState<AppData>(storageService.load()); 
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // --- SUPABASE AUTH LISTENER ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- EFFECT: Fetch Data when Session Exists ---
  useEffect(() => {
    if (session) {
      Promise.all([apiService.fetchTasks(), apiService.fetchLogs()])
        .then(([apiTasks, apiLogs]) => {
          setData(prev => ({
            ...prev,
            tasks: apiTasks,
            logs: apiLogs
          }));
        })
        .catch(err => {
          console.error("Failed to sync with Supabase:", err);
        });
    } else {
        // Clear sensitive data on logout, keep settings
        setData(prev => ({ ...prev, tasks: [], logs: [] }));
    }
  }, [session]);

  // --- RESPONSIVE HANDLING ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    if (window.innerWidth < 1024 && window.innerWidth >= 768) {
      setIsSidebarCollapsed(true);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- DARK MODE HANDLING ---
  useEffect(() => {
    if (data.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.darkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- DATA HANDLERS ---
  const handleSetTasks = (newTasks: Task[]) => {
    setData(prev => ({ ...prev, tasks: newTasks }));
    // Note: TaskModule handles API calls internally via apiService, 
    // but the state update here keeps UI snappy.
  };

  const handleSetLogs = (newLogs: Log[]) => {
     setData(prev => ({ ...prev, logs: newLogs }));
  };

  const handleSetSettings = (newSettings: any) => {
      const newData = { ...data, settings: newSettings };
      setData(newData);
      storageService.save(newData); // Settings always local
  };

  // If not logged in, show Auth
  if (!session) {
    return <AuthModule onLoginSuccess={() => {}} />;
  }

  // If logged in, show App
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans text-neutral-900 dark:text-neutral-100 selection:bg-emerald-100 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!isFocusMode && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 md:bg-neutral-50/30 relative transition-all duration-300 ${isFocusMode ? 'max-w-5xl mx-auto border-x border-neutral-100 dark:border-neutral-800 shadow-2xl' : ''}`}>
        
        {/* Header */}
        {!isFocusMode && (
          <header className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
             <div className="flex items-center gap-3 md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-neutral-600 dark:text-neutral-400">
                <Menu size={24} />
              </button>
              <h1 className="font-semibold text-lg capitalize">{activeTab}</h1>
            </div>
            
            {/* User Info / Logout */}
            <div className="flex items-center ml-auto gap-4">
               <span className="text-sm font-medium text-neutral-500 hidden md:block">
                 {session.user.email}
               </span>
               <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
               >
                 <LogOut size={16} /> <span className="hidden md:inline">Logout</span>
               </button>
            </div>
          </header>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative">
           {activeTab === 'tasks' && (
             <TaskModule 
               tasks={data.tasks} 
               setTasks={handleSetTasks} 
               isFocusMode={isFocusMode} 
               toggleFocusMode={() => setIsFocusMode(!isFocusMode)}
             />
           )}
           {activeTab === 'logs' && (
             <LogModule 
               logs={data.logs} 
               setLogs={handleSetLogs} 
               isMobile={isMobile} 
               isFocusMode={isFocusMode} 
               toggleFocusMode={() => setIsFocusMode(!isFocusMode)} 
             />
           )}
           {activeTab === 'stats' && <StatsModule tasks={data.tasks} logs={data.logs} />}
           {activeTab === 'settings' && <SettingsModule settings={data.settings} setSettings={handleSetSettings} fullData={data} onImport={(d) => setData(d)} />}
        </div>
      </main>
    </div>
  );
}