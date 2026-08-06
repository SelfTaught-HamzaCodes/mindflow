/**
 * Optional Supabase client for research persistence (Milestone 6).
 *
 * Env vars unset → local JSON / in-memory only. That way teh prototype
 * still runs for a viva without anyone needing a cloud project set up.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Persist a session note (wellness dismissals, focus toggles, etc).
 * Soft-fails when unconfigured so UI never blocks on missing backend.
 */
export async function saveSessionNote({ userId, noteType, payload }) {
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const { data, error } = await supabase
    .from("session_notes")
    .insert({
      user_id: userId ?? "demo-alex",
      note_type: noteType,
      payload,
      created_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true, data };
}

/**
 * Upsert task status if Supabase is around; otherwise null and AppDataContext
 * stays the source of truth. Prefered this over throwing — demos shouldnt die
 * mid-toggle becuase of a missing table.
 */
export async function persistTaskUpdate(task) {
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const { data, error } = await supabase
    .from("tasks")
    .upsert({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.dueDate,
      today: task.today,
      important: task.important,
      category: task.category,
    })
    .select()
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true, data };
}
