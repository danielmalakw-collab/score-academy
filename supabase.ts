import { createClient } from '@supabase/supabase-js';
import {
  Teacher,
  Course,
  CourseCode,
  Enrollment,
  StudentUser,
  Exam,
  ExamSubmission,
  LessonViewLog,
} from './types';

export const SUPABASE_URL = 'https://iybttmakojsdbshfljng.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_4I409dszLj8Kl3Qy6VdzWw_hIzMFL2o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Initial clean fallbacks
export const INITIAL_TEACHERS: Teacher[] = [];
export const INITIAL_COURSES: Course[] = [];
export const INITIAL_CODES: CourseCode[] = [];
export const INITIAL_STUDENTS: StudentUser[] = [];
export const INITIAL_ENROLLMENTS: Enrollment[] = [];
export const INITIAL_EXAMS: Exam[] = [];
export const INITIAL_EXAM_SUBMISSIONS: ExamSubmission[] = [];

/**
 * Fetch all records from a Supabase table.
 * Returns null if the table doesn't exist yet or connection fails.
 */
export async function fetchTableData<T>(tableName: string): Promise<T[] | null> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`[Supabase] Note on table "${tableName}":`, error.message);
      return null;
    }
    return (data as T[]) || [];
  } catch (err) {
    console.warn(`[Supabase] Network/connection check on "${tableName}":`, err);
    return null;
  }
}

/**
 * Upsert records into a Supabase table.
 * Handles both single objects and arrays.
 */
export async function upsertTableData(tableName: string, records: any | any[]): Promise<boolean> {
  try {
    if (!records || (Array.isArray(records) && records.length === 0)) {
      return true;
    }
    const { error } = await supabase.from(tableName).upsert(records, { onConflict: 'id' });
    if (error) {
      console.warn(`[Supabase] Upsert warning on "${tableName}":`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Upsert network exception on "${tableName}":`, err);
    return false;
  }
}

/**
 * Delete a record from a Supabase table by ID.
 */
export async function deleteRecordFromTable(tableName: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      console.warn(`[Supabase] Delete warning on "${tableName}":`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase] Delete network exception on "${tableName}":`, err);
    return false;
  }
}
