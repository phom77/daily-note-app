import type { AppData, Task, Log, UserSettings } from '../types';

const STORAGE_KEY = 'dailysync_data_v1';

// Helper for local date
const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DEFAULT_DATA: AppData = {
  tasks: [
    { id: 1, title: 'Welcome to DailySync! Try adding a task.', done: false, date: getTodayLocal() },
    { id: 2, title: 'Go to Stats to check your progress', done: true, date: getTodayLocal() },
  ],
  logs: [
    { 
      id: 1, 
      title: 'First Entry: Goals', 
      content: 'I want to improve my Business English vocabulary.\nTarget: 5 words per day.', 
      tags: ['goals', 'planning'], 
      createdAt: Date.now(),
      nextReviewDate: null
    }
  ],
  settings: {
    darkMode: false,
    notifications: true,
  }
};

export const storageService = {
  load: (): AppData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_DATA;
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load data", e);
      return DEFAULT_DATA;
    }
  },

  save: (data: AppData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  },

  // Helper to export data as JSON file
  exportData: (data: AppData) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dailysync_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};