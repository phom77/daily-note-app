import { supabase } from './supabase';
import type { Task, Log } from '../types';

// Helper to map DB columns (snake_case) to App types (camelCase) if needed
// But for simplicity, we will map manually in the functions below.

export const apiService = {
  // --- TASKS ---
  
  fetchTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    
    // Map DB structure to App structure
    return (data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      done: t.done,
      date: t.date,
      isSystemGenerated: t.is_system_generated,
      priority: 'medium' // Default, assuming DB doesn't have priority col yet or you add it later
    }));
  },

  addTask: async (task: Partial<Task>): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: task.title,
        done: task.done,
        date: task.date,
        is_system_generated: task.isSystemGenerated
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
      priority: 'medium'
    };
  },

  updateTask: async (id: number, updates: Partial<Task>) => {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.done !== undefined) payload.done = updates.done;
    
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
      tags: l.tags || [], // Supabase handles array automatically
      folder: l.folder,
      createdAt: l.created_at_ts,
      nextReviewDate: l.next_review_date
    }));
  },

  saveLog: async (log: Log): Promise<Log> => {
    // Check if ID exists (Update vs Insert)
    // Note: Since Supabase IDs are auto-incrementing integers (from our SQL), 
    // passing a huge Date.now() as ID from frontend might cause issues if we force it.
    // Better strategy: If log has an ID that matches an existing DB ID, update. Else insert.
    
    // For simplicity in this migration: 
    // We assume if 'id' is small (DB generated), it's an update. 
    // If it's huge (Date.now()), it's a new entry that hasn't synced yet.
    
    // However, the cleanest way with Supabase is `upsert` or split logic.
    // Let's assume the frontend passes the ID if it was already fetched from DB.

    const payload = {
      title: log.title,
      content: log.content,
      tags: log.tags,
      folder: log.folder,
      created_at_ts: log.createdAt,
      next_review_date: log.nextReviewDate
    };

    // We need to know if we are updating or inserting.
    // The Frontend logic uses Date.now() for optimistic ID.
    // Let's try to Insert. If we have a real DB ID, we Update.
    
    // Hack: We check if the ID looks like a timestamp (huge number). If so, it's NEW.
    // If it's a small integer, it's EXISTING.
    const isNew = log.id > 1000000000000; 

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