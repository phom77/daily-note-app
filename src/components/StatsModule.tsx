import React from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid
} from 'recharts';
import { Trophy, Flame, AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';
import type { Task, Log } from '../types';

interface StatsModuleProps {
  tasks: Task[];
  logs: Log[];
}

export const StatsModule: React.FC<StatsModuleProps> = ({ tasks }) => {
  
  // FIX: Use Local Time
  const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayLocal();

  // --- LOGIC 1: All Time Stats ---
  const allTimeTotal = tasks.length;
  const allTimeCompleted = tasks.filter(t => t.done).length;
  const allTimeRate = allTimeTotal === 0 ? 0 : Math.round((allTimeCompleted / allTimeTotal) * 100);

  // --- LOGIC 2: Streak Calculation ---
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date(); // Local date object
    
    // Check backwards 365 days
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        
        // Manual Format YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const hasCompletedTask = tasks.some(t => t.date === dateStr && t.done);
        
        if (hasCompletedTask) {
            streak++;
        } else if (i === 0) {
            // If today isn't done yet, don't break streak, just don't count it
            continue;
        } else {
            break;
        }
    }
    return streak;
  };
  const streak = calculateStreak();

  // --- LOGIC 3: Monthly Performance (Evaluation) ---
  const getMonthlyData = () => {
    const months: Record<string, { total: number, completed: number }> = {};
    
    // Look at last 6 months
    for(let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // Safety: set to 1st of month to avoid 31st day skipping bugs
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g., "Oct 24"
        
        // Local ISO Month "YYYY-MM"
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const monthIso = `${year}-${month}`; 
        
        months[key] = { total: 0, completed: 0 };

        // Filter tasks for this month
        tasks.forEach(t => {
            if (t.date.startsWith(monthIso)) {
                months[key].total++;
                if (t.done) months[key].completed++;
            }
        });
    }

    return Object.entries(months).map(([name, data]) => ({
        name,
        completed: data.completed,
        missed: data.total - data.completed,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  };
  const monthlyData = getMonthlyData();

  // --- LOGIC 4: "Unfinished Business" (Overdue tasks) ---
  const overdueTasks = tasks.filter(t => !t.done && t.date < todayStr).sort((a, b) => b.date.localeCompare(a.date));

  // --- LOGIC 5: Heatmap Data (Last 365 Days) ---
  const getHeatmapData = () => {
    const days = [];
    const today = new Date();
    // Generate roughly a year of squares
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      // FIX: Use manual formatting to ensure Local YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const taskCount = tasks.filter(t => t.date === dateStr && t.done).length;
      let level = 0;
      if (taskCount > 0) level = 1;
      if (taskCount > 3) level = 2;
      if (taskCount > 6) level = 3;

      days.push({ date: dateStr, level });
    }
    return days;
  };
  const heatmapData = getHeatmapData();

  const getHeatmapColor = (level: number) => {
    switch(level) {
      // FIX: Dark mode background changed from neutral-800 (same as container) to neutral-700/50 (lighter)
      case 0: return 'bg-neutral-100 dark:bg-neutral-700/50'; 
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/60';
      case 2: return 'bg-emerald-400 dark:bg-emerald-700';
      case 3: return 'bg-emerald-600 dark:bg-emerald-500';
      default: return 'bg-neutral-100 dark:bg-neutral-700/50';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-neutral-50/30 dark:bg-neutral-900/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Performance Review</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Analyzing your task history and consistency.</p>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* All Time Rate */}
           <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm md:col-span-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">All-Time Completion Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{allTimeRate}%</span>
                    <span className="text-xs text-neutral-400">of {allTimeTotal} tasks created</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${allTimeRate}%` }}></div>
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Trophy size={32} />
              </div>
           </div>

           {/* Streak */}
           <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-orange-500">
                <Flame size={20} />
                <span className="text-sm font-bold uppercase tracking-wider">Current Streak</span>
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{streak} <span className="text-base font-normal text-neutral-400">days</span></p>
           </div>

           {/* Total Done */}
           <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-blue-500">
                <CheckCircle2 size={20} />
                <span className="text-sm font-bold uppercase tracking-wider">Tasks Finished</span>
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{allTimeCompleted}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MONTHLY EVALUATION CHART */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Monthly Consistency</h3>
                    <p className="text-xs text-neutral-500">Are you finishing what you start each month?</p>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:opacity-10" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                            />
                            {/* Stacked Bars */}
                            <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={40} />
                            <Bar dataKey="missed" name="Missed" stackId="a" fill="#fee2e2" radius={[4, 4, 0, 0]} barSize={40} className="dark:opacity-20" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* UNFINISHED BUSINESS LIST */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Missed Tasks</h3>
                        <p className="text-xs text-neutral-500">From the past</p>
                    </div>
                    {overdueTasks.length > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-full">
                            {overdueTasks.length} Pending
                        </span>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px] custom-scrollbar">
                    {overdueTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400">
                            <CheckCircle2 size={40} className="mb-2 text-emerald-200 dark:text-emerald-900" />
                            <p className="text-sm">Clean sheet!</p>
                            <p className="text-xs">No overdue tasks.</p>
                        </div>
                    ) : (
                        overdueTasks.map(t => (
                            <div key={t.id} className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800/50 flex items-start gap-3">
                                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 line-clamp-2">{t.title}</p>
                                    <p className="text-[10px] text-neutral-400 mt-1">{t.date}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* YEARLY ACTIVITY HEATMAP */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays size={20} className="text-neutral-400" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Yearly Consistency</h3>
          </div>
          
          <div className="flex flex-wrap gap-1 md:gap-[3px] overflow-hidden">
             {heatmapData.map((day) => (
               <div 
                 key={day.date}
                 title={`${day.date}: ${day.level > 0 ? 'Active' : 'No Activity'}`}
                 className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm ${getHeatmapColor(day.level)} transition-colors`}
               />
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};