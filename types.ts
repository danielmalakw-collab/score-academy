export type LessonContentType = 'embed_video' | 'iframe' | 'link' | 'file' | 'quiz';

export interface CourseFolder {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  parent_id?: string;       // For nested accordion sub-folders
  order?: number;
  created_at?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content_type: LessonContentType;
  url?: string;             // Embed video URL, iframe code, or external link
  file_data?: string;       // Base64 file or PDF data
  file_name?: string;
  duration_minutes?: number;
  description?: string;
  quiz_id?: string;
  folder_id?: string;       // ID of accordion folder (optional)
  order?: number;           // Step ladder rank
}

export interface QuizQuestion {
  id: string;
  question: string;
  type?: 'multiple_choice' | 'essay'; // 'multiple_choice' (اختياري) | 'essay' (مقالي)
  options: string[];
  correct_index: number;
  points: number;
  image_url?: string;       // Image attached to question
  options_images?: string[]; // Optional images for each option
  explanation?: string;
  model_answer?: string;     // Model answer for essay questions
}

export interface ExamModel {
  id: string;
  name: string;             // e.g. "النموذج أ", "النموذج ب"
  questions: QuizQuestion[];
}

export interface Exam {
  id: string;
  title: string;
  course_id: string;
  teacher_id: string;
  description?: string;
  duration_minutes?: number;
  has_timer?: boolean;
  exam_type?: 'multiple_choice' | 'essay' | 'mixed';
  questions: QuizQuestion[];
  total_points: number;
  randomize_order?: boolean; // Shuffle question order for students
  models?: ExamModel[];      // Multiple exam forms (نموذج أ، نموذج ب، إلخ)
  created_at: string;
}

export interface LessonViewLog {
  id: string;
  student_id: string;
  student_name: string;
  student_phone?: string;
  parent_phone?: string;
  course_id: string;
  lesson_id: string;
  lesson_title?: string;
  viewed_at: string;
}

export interface EssayGrade {
  score: number;
  max_points: number;
  teacher_notes?: string;
  model_answer?: string;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  exam_title: string;
  course_id: string;
  course_title?: string;
  teacher_id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  parent_phone?: string;
  score: number;
  total_points: number;
  percentage: number;
  answers: { [questionId: string]: number };
  answers_essay?: { [questionId: string]: string };
  essay_grades?: { [questionId: string]: EssayGrade };
  status?: 'completed' | 'pending_review'; // 'pending_review' (تتم المراجعة) | 'completed' (تم التصحيح)
  assigned_model_name?: string;
  submitted_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  specialization?: string;
  bio?: string;
  image_data?: string; // Base64 uploaded image
  password?: string;   // Private password for this teacher's personal dashboard
  email?: string;
  phone?: string;
  grades?: string[];   // Stages/grades taught
  experience_years?: number | string;
  is_blocked?: boolean; // Admin block for teacher
  blocked_reason?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;       // 0 means free course
  is_free?: boolean;   // true if course is free for any student
  teacher_id: string;
  image_data?: string; // Base64 uploaded image
  is_active: boolean;
  lessons_count?: number;
  duration_hours?: number;
  grade?: string;      // 'أولى ثانوي' | 'ثانية ثانوي' | 'ثالثة ثانوي' | 'ثانية بكالوريا'
  folders?: CourseFolder[]; // Accordion folders (can be empty)
  lessons?: Lesson[];
  // Expiry & Access Duration
  expiry_type?: 'never' | 'fixed_date' | 'duration_days';
  expiry_date?: string;           // e.g. "2026-10-30"
  expiry_duration_days?: number;  // e.g. 7, 14, 30
  // Prerequisite Locking Gate
  prerequisite_lock_enabled?: boolean; // حظر المحتوى التالي للامتحان حتى اجتيازه بنسبة 50%
  created_at?: string;
}

export interface CourseCode {
  id: string;
  code: string;
  course_id: string;
  teacher_id?: string;
  is_used: boolean;
  used_by_student_id?: string;
  used_by_student_name?: string;
  used_by_student_phone?: string;
  used_at?: string;
  created_at?: string;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  parent_phone?: string;
  password?: string;
  grade?: string;
  is_blocked?: boolean; // Admin block for student
  blocked_reason?: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  student_name: string;
  student_phone?: string;
  parent_phone?: string;
  course_id: string;
  course_title: string;
  teacher_id?: string;
  activated_at: string;
  expires_at?: string; // Calculated expiry date for this student
  code_used?: string; // e.g. "مجاني" or the activation code
}
