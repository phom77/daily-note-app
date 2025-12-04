import React from 'react';
import type { UserSettings, AppData } from '../types';
import { Upload, Download, Moon, Sun, Database } from 'lucide-react';
import { storageService } from '../services/storage';

interface SettingsModuleProps {
  settings: UserSettings;
  setSettings: (s: UserSettings) => void;
  fullData: AppData;
  onImport: (data: AppData) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, setSettings, fullData, onImport }) => {
  
  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
            const parsed = JSON.parse(event.target.result as string);
            // Basic validation
            if (parsed.tasks && parsed.logs && parsed.settings) {
                onImport(parsed);
                alert("Data imported successfully!");
            } else {
                throw new Error("Invalid structure");
            }
          }
        } catch (err) {
          alert("Invalid JSON file. Please upload a valid DailySync backup.");
        }
      };
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-neutral-50/30 dark:bg-neutral-900/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Customize your local experience.</p>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
           <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-700 pb-2">Appearance</h3>
           
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${settings.darkMode ? 'bg-neutral-700 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                 </div>
                 <div>
                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Dark Mode</p>
                    <p className="text-xs text-neutral-500">Adjust the interface for day or night usage.</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.darkMode} onChange={(e) => handleInputChange('darkMode', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
           </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
           <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                <Database size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Backup & Restore</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => storageService.exportData(fullData)}
                className="flex items-center justify-center gap-2 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300 group"
              >
                <Download size={18} className="group-hover:text-emerald-600 transition-colors" />
                <div className="text-left">
                    <span className="block font-medium text-sm">Export Data</span>
                    <span className="block text-[10px] text-neutral-400">Download .json file</span>
                </div>
              </button>
              
              <label className="flex items-center justify-center gap-2 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 group">
                <Upload size={18} className="group-hover:text-emerald-600 transition-colors" />
                 <div className="text-left">
                    <span className="block font-medium text-sm">Import Data</span>
                    <span className="block text-[10px] text-neutral-400">Restore from .json file</span>
                </div>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
           </div>
           
           <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
               <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                 <strong>Privacy Note:</strong> Your data is stored 100% locally on this device. We do not track you. Use Export/Import to transfer data between devices.
               </p>
           </div>
        </div>

      </div>
    </div>
  );
};