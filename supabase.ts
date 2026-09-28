import { createClient } from '@supabase/supabase-js';
import { Teacher, Course, CourseCode, Enrollment, StudentUser, Exam, ExamSubmission } from './types';

export const SUPABASE_URL = "https://iybttmakojsdbshfljng.supabase.co";
export const SUPABASE_KEY = "sb_publishable_4I409dszLj8Kl3Qy6VdzWw_hIzMFL2o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Clean initial data as requested - no fake numbers or dummy records
export const INITIAL_TEACHERS: Teacher[] = [];
export const INITIAL_COURSES: Course[] = [];
export const INITIAL_CODES: CourseCode[] = [];
export const INITIAL_STUDENTS: StudentUser[] = [];
export const INITIAL_ENROLLMENTS: Enrollment[] = [];
export const INITIAL_EXAMS: Exam[] = [];
export const INITIAL_EXAM_SUBMISSIONS: ExamSubmission[] = [];
