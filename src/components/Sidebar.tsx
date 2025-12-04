import React from 'react';
import { CheckSquare, BookOpen, BarChart2, Settings, X, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) => {
  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 bg-neutral-50 border-r border-neutral-200 
        transition-all duration-300 ease-in-out flex flex-col
        dark:bg-neutral-900 dark:border-neutral-800
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
      `}
    >
      {/* Logo Area */}
      <div className={`h-16 flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className={`ml-3 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed ? 'hidden opacity-0' : 'block opacity-100'}`}>
            DailySync
          </span>
        </div>
        
        {/* Mobile Close Button */}
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
          <X size={20} />
        </button>
      </div>

      {/* Toggle Button (Desktop Only) */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full items-center justify-center text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 shadow-sm z-50 transition-colors"
      >
        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-4">
        <NavItem 
          icon={<CheckSquare size={22} />} 
          label="My Tasks" 
          collapsed={isSidebarCollapsed}
          active={activeTab === 'tasks'} 
          onClick={() => { setActiveTab('tasks'); setIsMobileMenuOpen(false); }} 
        />
        <NavItem 
          icon={<BookOpen size={22} />} 
          label="Logs" 
          collapsed={isSidebarCollapsed}
          active={activeTab === 'logs'} 
          onClick={() => { setActiveTab('logs'); setIsMobileMenuOpen(false); }} 
        />
         <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800 mx-2"></div>
         <NavItem 
          icon={<BarChart2 size={22} />} 
          label="Stats" 
          collapsed={isSidebarCollapsed}
          active={activeTab === 'stats'} 
          onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }} 
        />
        <NavItem 
          icon={<Settings size={22} />} 
          label="Settings" 
          collapsed={isSidebarCollapsed}
          active={activeTab === 'settings'} 
          onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
        />
      </nav>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, collapsed }) => {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : ''}
      className={`
        w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
        ${active 
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
        }
        ${collapsed ? 'justify-center' : 'justify-start gap-3'}
      `}
    >
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className={`whitespace-nowrap transition-all duration-200 origin-left ${collapsed ? 'hidden w-0 opacity-0' : 'block w-auto opacity-100'}`}>
        {label}
      </span>
    </button>
  );
};