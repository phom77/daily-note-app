export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: number;
  title: string;
  done: boolean;
  date: string; // ISO Date string YYYY-MM-DD
  isSystemGenerated?: boolean; // For spaced repetition tasks
  priority?: Priority; // New field
}

export interface Log {
  id: number;
  title: string;
  content: string;
  tags: string[];
  folder?: string;
  createdAt: number;
  nextReviewDate: string | null; // ISO Date string YYYY-MM-DD
}

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
}

export interface AppData {
  tasks: Task[];
  logs: Log[];
  settings: UserSettings;
}

export type Tab = 'tasks' | 'logs' | 'stats' | 'settings';