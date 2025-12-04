import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, Trash2, Calendar, RefreshCcw, ChevronLeft, ChevronRight, Flame, Zap, Coffee, Play, Pause, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import type { Task, Priority } from '../types';
import { apiService } from '../services/api';

interface TaskModuleProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

export const TaskModule: React.FC<TaskModuleProps> = ({ tasks, setTasks, isFocusMode, toggleFocusMode }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  
  // DATE NAVIGATION STATE
  const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayLocal();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // POMODORO STATE
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const isToday = selectedDate === todayStr;

  // --- POMODORO LOGIC ---
  useEffect(() => {
    if (isTimerActive && timerSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, timerSeconds]);

  const toggleTimer = () => setIsTimerActive(!isTimerActive);
  const resetTimer = () => {
    setIsTimerActive(false);
    setTimerSeconds(25 * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- DATE LOGIC ---
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    
    // Convert back to YYYY-MM-DD manually to keep local integrity
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };
  const goToToday = () => setSelectedDate(todayStr);

  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric'
  });

  // --- TASK SORTING & FILTERING ---
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  const visibleTasks = tasks.filter(t => {
      if (isToday) {
          return t.date === selectedDate || (!t.done && t.date < selectedDate);
      } else {
          return t.date === selectedDate;
      }
  }).sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      const pA = priorityWeight[a.priority || 'low'];
      const pB = priorityWeight[b.priority || 'low'];
      if (pA !== pB) return pB - pA;
      return b.id - a.id;
  });

  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => t.done).length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // Optimistic UI: Create temporary task
    const tempId = Date.now();
    const taskPayload = {
      title: newTaskTitle,
      done: false,
      date: selectedDate,
      priority: newTaskPriority
    };

    const tempTask: Task = { id: tempId, ...taskPayload };
    const optimisticTasks = [tempTask, ...tasks];
    setTasks(optimisticTasks); // Show immediately
    
    setNewTaskTitle('');
    setNewTaskPriority('medium');

    try {
      // Call Real API
      const savedTask = await apiService.addTask(taskPayload);
      // Replace temp task with real task from server
      setTasks(optimisticTasks.map(t => t.id === tempId ? savedTask : t));
    } catch (err) {
      console.error(err);
      alert("Failed to save task. Check console for details.");
      // Rollback
      setTasks(tasks);
    }
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newDoneStatus = !task.done;
    
    // Optimistic Update
    setTasks(tasks.map(t => t.id === id ? { ...t, done: newDoneStatus } : t));

    try {
      await apiService.updateTask(id, { done: newDoneStatus });
    } catch (err) {
      console.error(err);
      // Revert on fail
      setTasks(tasks.map(t => t.id === id ? { ...t, done: !newDoneStatus } : t));
      alert("Failed to update task status.");
    }
  };

  const deleteTask = async (id: number) => {
    // Optimistic Update
    const prevTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== id));

    try {
      await apiService.deleteTask(id);
    } catch (err) {
      console.error(err);
      setTasks(prevTasks); // Revert
      alert("Failed to delete task.");
    }
  };

  const getPriorityIcon = (p?: Priority) => {
      switch(p) {
          case 'high': return <Flame size={14} className="text-red-500" />;
          case 'medium': return <Zap size={14} className="text-amber-500" />;
          case 'low': return <Coffee size={14} className="text-blue-400" />;
          default: return <Coffee size={14} className="text-neutral-400" />;
      }
  };

  const getPriorityColor = (p?: Priority) => {
    switch(p) {
        case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
        case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-neutral-50/30 dark:bg-neutral-900/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">My Tasks</h2>
                <button 
                  onClick={toggleFocusMode}
                  title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                  className={`p-2 rounded-full transition-all ${isFocusMode ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                    {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>
            
            {/* Date Controls */}
            <div className="flex items-center gap-3">
                <button onClick={() => changeDate(-1)} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                    <ChevronLeft size={20} className="text-neutral-500" />
                </button>
                
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 font-medium text-lg">
                    <Calendar size={18} className="text-emerald-600" />
                    <span>{displayDate}</span>
                </div>

                <button onClick={() => changeDate(1)} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                    <ChevronRight size={20} className="text-neutral-500" />
                </button>

                {!isToday && (
                    <button onClick={goToToday} className="ml-2 text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full hover:bg-emerald-200 transition-colors">
                        Jump to Today
                    </button>
                )}
            </div>
          </div>
          
          {/* POMODORO TIMER */}
          <div className="flex flex-col items-center justify-center bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 min-w-[200px]">
             <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Focus Timer</span>
             <div className={`text-4xl font-mono font-bold mb-3 ${isTimerActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                {formatTime(timerSeconds)}
             </div>
             <div className="flex items-center gap-2">
                <button 
                    onClick={toggleTimer}
                    className={`p-2 rounded-full text-white transition-all shadow-md ${isTimerActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    {isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <button 
                    onClick={resetTimer}
                    className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                    <RotateCcw size={18} />
                </button>
             </div>
          </div>
        </div>

        {/* PROGRESS BAR (Moved down) */}
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
        </div>

        {/* Input Form with Priority */}
        <form onSubmit={addTask} className="bg-white dark:bg-neutral-800 p-2 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Plus className="text-neutral-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            </div>
            <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={isToday ? "What needs to be done?" : `Add task for ${new Date(selectedDate).toLocaleDateString()}...`}
                className="w-full pl-11 pr-4 py-3 bg-transparent border-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-2 px-2 md:border-l border-neutral-100 dark:border-neutral-700">
             <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg">
                {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setNewTaskPriority(p)}
                        className={`p-2 rounded-md transition-all ${newTaskPriority === p ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                        title={`${p.charAt(0).toUpperCase() + p.slice(1)} Priority`}
                    >
                        {getPriorityIcon(p)}
                    </button>
                ))}
             </div>
             <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                Add
             </button>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-3 pb-20">
          {visibleTasks.length === 0 ? (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-neutral-400" />
                </div>
                <p className="text-neutral-500 dark:text-neutral-400">
                    {isToday ? "No tasks yet. Start your day!" : "No tasks recorded for this day."}
                </p>
            </div>
          ) : (
            visibleTasks.map(task => (
              <div 
                key={task.id}
                className={`group flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-transparent transition-all hover:border-neutral-200 dark:hover:border-neutral-700 ${task.done ? 'opacity-60 grayscale' : ''}`}
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-300 dark:border-neutral-600 text-transparent hover:border-emerald-500'}`}
                >
                  <CheckSquare size={14} fill="currentColor" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                      <p className={`truncate font-medium transition-all ${task.done ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {task.title}
                      </p>
                      {/* Priority Badge */}
                      {!task.done && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(task.priority)}`}>
                             {getPriorityIcon(task.priority)} 
                             {task.priority || 'low'}
                          </span>
                      )}
                  </div>
                  
                  {task.isSystemGenerated && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                       <RefreshCcw size={10} /> Spaced Repetition Review
                    </p>
                  )}
                  {isToday && task.date < todayStr && !task.done && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
                        Overdue from {task.date}
                      </p>
                  )}
                </div>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};