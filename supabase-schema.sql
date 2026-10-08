-- =========================================================================
-- منصة سكور أكاديمي (Score Academy) - إعداد قواعد بيانات Supabase
-- قم بنسخ هذا الكود بالكامل ولصقه في SQL Editor داخل لوحة تحكم Supabase
-- ثم اضغط على RUN
-- =========================================================================

-- 1. جدول المعلمين (teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT,
    bio TEXT,
    image_data TEXT,
    password TEXT,
    email TEXT,
    phone TEXT,
    grades JSONB DEFAULT '[]'::jsonb,
    experience_years TEXT,
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    show_on_landing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. جدول الكورسات (courses)
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    image_data TEXT,
    is_active BOOLEAN DEFAULT true,
    lessons_count INTEGER DEFAULT 0,
    duration_hours NUMERIC DEFAULT 0,
    grade TEXT,
    folders JSONB DEFAULT '[]'::jsonb,
    lessons JSONB DEFAULT '[]'::jsonb,
    expiry_type TEXT DEFAULT 'never',
    expiry_date TEXT,
    expiry_duration_days INTEGER,
    prerequisite_lock_enabled BOOLEAN DEFAULT false,
    show_on_landing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. جدول أكواد التفعيل (codes)
CREATE TABLE IF NOT EXISTS public.codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id TEXT,
    is_used BOOLEAN DEFAULT false,
    used_by_student_id TEXT,
    used_by_student_name TEXT,
    used_by_student_phone TEXT,
    used_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. جدول الطلاب (students) - مع تقييد جهاز واحد للطالب
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT UNIQUE NOT NULL,
    parent_phone TEXT,
    password TEXT,
    grade TEXT,
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    device_id TEXT, -- معرف الجهاز المقيد به حساب الطالب
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. جدول اشتراكات الطلاب في الكورسات (enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    parent_phone TEXT,
    course_id TEXT NOT NULL,
    course_title TEXT NOT NULL,
    teacher_id TEXT,
    activated_at TEXT,
    expires_at TEXT,
    code_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. جدول الامتحانات (exams)
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    has_timer BOOLEAN DEFAULT false,
    exam_type TEXT DEFAULT 'multiple_choice',
    questions JSONB DEFAULT '[]'::jsonb,
    total_points NUMERIC DEFAULT 100,
    randomize_order BOOLEAN DEFAULT false,
    models JSONB DEFAULT '[]'::jsonb,
    max_attempts INTEGER,
    lock_next_content BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. جدول إجابات ودرجات الامتحانات (exam_submissions)
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    exam_title TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_title TEXT,
    teacher_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    parent_phone TEXT,
    score NUMERIC DEFAULT 0,
    total_points NUMERIC DEFAULT 100,
    percentage NUMERIC DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    answers_essay JSONB DEFAULT '{}'::jsonb,
    essay_grades JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'completed',
    assigned_model_name TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. جدول سجل حضور ومشاهدة المحاضرات (lesson_views)
CREATE TABLE IF NOT EXISTS public.lesson_views (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    parent_phone TEXT,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    lesson_title TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- إعداد سياسات الأمان (Row Level Security - RLS)
-- تتيح القراءة والكتابة لعميل الويب الموثوق بمفتاح anon
-- =========================================================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_views ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول الكامل (Public Access for Platform)
DO $$
BEGIN
    -- Teachers Policies
    DROP POLICY IF EXISTS "Public access teachers" ON public.teachers;
    CREATE POLICY "Public access teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

    -- Courses Policies
    DROP POLICY IF EXISTS "Public access courses" ON public.courses;
    CREATE POLICY "Public access courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

    -- Codes Policies
    DROP POLICY IF EXISTS "Public access codes" ON public.codes;
    CREATE POLICY "Public access codes" ON public.codes FOR ALL USING (true) WITH CHECK (true);

    -- Students Policies
    DROP POLICY IF EXISTS "Public access students" ON public.students;
    CREATE POLICY "Public access students" ON public.students FOR ALL USING (true) WITH CHECK (true);

    -- Enrollments Policies
    DROP POLICY IF EXISTS "Public access enrollments" ON public.enrollments;
    CREATE POLICY "Public access enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

    -- Exams Policies
    DROP POLICY IF EXISTS "Public access exams" ON public.exams;
    CREATE POLICY "Public access exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

    -- Exam Submissions Policies
    DROP POLICY IF EXISTS "Public access exam_submissions" ON public.exam_submissions;
    CREATE POLICY "Public access exam_submissions" ON public.exam_submissions FOR ALL USING (true) WITH CHECK (true);

    -- Lesson Views Policies
    DROP POLICY IF EXISTS "Public access lesson_views" ON public.lesson_views;
    CREATE POLICY "Public access lesson_views" ON public.lesson_views FOR ALL USING (true) WITH CHECK (true);
END $$;

-- =========================================================================
-- إنشاء الفهارس لتحسين سرعة وأداء الاستعلامات (Indexes)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_codes_course ON public.codes(course_id);
CREATE INDEX IF NOT EXISTS idx_codes_code ON public.codes(code);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON public.exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON public.exam_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_course ON public.lesson_views(course_id);
