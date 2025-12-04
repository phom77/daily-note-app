import { supabase } from './supabase';
import type { Task, Log } from '../types';

export const apiService = {
  // --- TASKS ---
  
  fetchTasks: async (): Promise<Task[]> => {
    // RLS (Row Level Security) on Supabase will automatically filter 
    // to return only rows belonging to the authenticated user.
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      done: t.done,
      date: t.date,
      isSystemGenerated: t.is_system_generated,
      priority: t.priority || 'medium'
    }));
  },

  addTask: async (task: Partial<Task>): Promise<Task> => {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 2. Insert with user_id
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: user.id, // CRITICAL FIX: Must link task to user
        title: task.title,
        done: task.done,
        date: task.date,
        is_system_generated: task.isSystemGenerated,
        priority: task.priority || 'medium'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      done: data.done,
      date: data.date,
      isSystemGenerated: data.is_system_generated,
      priority: data.priority
    };
  },

  updateTask: async (id: number, updates: Partial<Task>) => {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.done !== undefined) payload.done = updates.done;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    
    const { error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  deleteTask: async (id: number) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // --- LOGS ---

  fetchLogs: async (): Promise<Log[]> => {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at_ts', { ascending: false });

    if (error) throw error;

    return (data || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      tags: l.tags || [],
      folder: l.folder,
      createdAt: l.created_at_ts,
      nextReviewDate: l.next_review_date
    }));
  },

  saveLog: async (log: Log): Promise<Log> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const payload = {
      user_id: user.id,
      title: log.title,
      content: log.content,
      tags: log.tags,
      folder: log.folder,
      created_at_ts: log.createdAt,
      next_review_date: log.nextReviewDate
    };

    // FIX: Check if ID is missing (undefined/null) OR if it is a large timestamp ID (legacy local ID).
    // Standard Supabase IDs are small integers (1, 2, 3...), Local IDs were Date.now() (171...).
    const isNew = !log.id || log.id > 1000000000000; 

    let data, error;

    if (isNew) {
       // Insert
       const res = await supabase.from('logs').insert([payload]).select().single();
       data = res.data;
       error = res.error;
    } else {
       // Update
       const res = await supabase.from('logs').update(payload).eq('id', log.id).select().single();
       data = res.data;
       error = res.error;
    }

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      tags: data.tags,
      folder: data.folder,
      createdAt: data.created_at_ts,
      nextReviewDate: data.next_review_date
    };
  }
};