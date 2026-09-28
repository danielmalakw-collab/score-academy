import { useState, useCallback } from 'react';
import { LandingPage } from './LandingPage';
import { AuthModal } from './AuthModal';
import { StudentPortal } from './StudentPortal';
import { TeacherLogin } from './TeacherLogin';
import { TeacherDashboard } from './TeacherDashboard';
import { AdminPanel } from './AdminPanel';
import {
  Teacher,
  Course,
  CourseCode,
  StudentUser,
  Enrollment,
  Exam,
  ExamSubmission,
  Lesson,
  LessonViewLog,
  EssayGrade,
} from './types';
import {
  INITIAL_TEACHERS,
  INITIAL_COURSES,
  INITIAL_CODES,
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_EXAMS,
  INITIAL_EXAM_SUBMISSIONS,
} from './supabase';

type AppView = 'landing' | 'student' | 'teacher-login' | 'teacher-dashboard' | 'admin';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const App: React.FC = () => {
  // ==================== APP STATE ====================
  const [view, setView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // ==================== DATA STATE ====================
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [codes, setCodes] = useState<CourseCode[]>(INITIAL_CODES);
  const [students, setStudents] = useState<StudentUser[]>(INITIAL_STUDENTS);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(INITIAL_ENROLLMENTS);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [examSubmissions, setExamSubmissions] = useState<ExamSubmission[]>(INITIAL_EXAM_SUBMISSIONS);
  const [lessonViews, setLessonViews] = useState<LessonViewLog[]>([]);

  // ==================== STUDENT AUTH ====================
  const handleOpenAuth = useCallback((mode?: 'login' | 'register') => {
    setAuthMode(mode || 'login');
    setAuthModalOpen(true);
  }, []);

  const handleStudentLoginSuccess = useCallback((user: StudentUser) => {
    setCurrentUser(user);
    setView('student');
    setAuthModalOpen(false);
  }, []);

  const handleStudentLogout = useCallback(() => {
    setCurrentUser(null);
    setView('landing');
  }, []);

  // ==================== TEACHER AUTH ====================
  const handleTeacherLoginSuccess = useCallback((teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setView('teacher-dashboard');
  }, []);

  const handleTeacherLogout = useCallback(() => {
    setCurrentTeacher(null);
    setView('landing');
  }, []);

  // ==================== NAVIGATION ====================
  const handleNavigateToTeacherLogin = useCallback(() => {
    setView('teacher-login');
  }, []);

  const handleNavigateToAdmin = useCallback(() => {
    setView('admin');
  }, []);

  const handleBackToHome = useCallback(() => {
    setView('landing');
  }, []);

  // ==================== TEACHER CRUD ====================
  const handleAddTeacher = useCallback((teacher: Omit<Teacher, 'id'>): Teacher => {
    const newTeacher: Teacher = {
      ...teacher,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setTeachers((prev) => [...prev, newTeacher]);
    return newTeacher;
  }, []);

  const handleDeleteTeacher = useCallback((teacherId: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    setCourses((prev) => prev.filter((c) => c.teacher_id !== teacherId));
    setCodes((prev) => prev.filter((cd) => cd.teacher_id !== teacherId));
  }, []);

  const handleToggleBlockTeacher = useCallback((teacherId: string, isBlocked: boolean) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, is_blocked: isBlocked } : t))
    );
  }, []);

  const handleUpdateTeacherProfile = useCallback(
    (updated: Partial<Teacher>) => {
      if (!currentTeacher) return;
      const updatedTeacher = { ...currentTeacher, ...updated };
      setCurrentTeacher(updatedTeacher);
      setTeachers((prev) =>
        prev.map((t) => (t.id === currentTeacher.id ? updatedTeacher : t))
      );
    },
    [currentTeacher]
  );

  // ==================== COURSE CRUD ====================
  const handleAddCourse = useCallback((course: Omit<Course, 'id' | 'is_active'>) => {
    const newCourse: Course = {
      ...course,
      id: generateId(),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
  }, []);

  const handleUpdateCourse = useCallback((courseId: string, updated: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...updated } : c)));
  }, []);

  const handleDeleteCourse = useCallback((courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setCodes((prev) => prev.filter((cd) => cd.course_id !== courseId));
    setEnrollments((prev) => prev.filter((e) => e.course_id !== courseId));
    setExams((prev) => prev.filter((ex) => ex.course_id !== courseId));
  }, []);

  // ==================== LESSON CRUD ====================
  const handleAddLessonToCourse = useCallback((courseId: string, lesson: Omit<Lesson, 'id'>) => {
    const newLesson: Lesson = { ...lesson, id: generateId() };
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, lessons: [...(c.lessons || []), newLesson] }
          : c
      )
    );
  }, []);

  const handleDeleteLessonFromCourse = useCallback((courseId: string, lessonId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, lessons: (c.lessons || []).filter((l) => l.id !== lessonId) }
          : c
      )
    );
  }, []);

  const handleReorderLessons = useCallback((courseId: string, reorderedLessons: Lesson[]) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, lessons: reorderedLessons } : c))
    );
  }, []);

  // ==================== FOLDER CRUD ====================
  const handleAddFolderToCourse = useCallback(
    (courseId: string, folderTitle: string, description?: string, parentId?: string) => {
      const newFolder = {
        id: generateId(),
        course_id: courseId,
        title: folderTitle,
        description,
        parent_id: parentId,
        created_at: new Date().toISOString(),
      };
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, folders: [...(c.folders || []), newFolder] }
            : c
        )
      );
    },
    []
  );

  const handleDeleteFolderFromCourse = useCallback((courseId: string, folderId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              folders: (c.folders || []).filter(
                (f) => f.id !== folderId && f.parent_id !== folderId
              ),
              lessons: (c.lessons || []).map((l) =>
                l.folder_id === folderId ? { ...l, folder_id: undefined } : l
              ),
            }
          : c
      )
    );
  }, []);

  // ==================== CODE CRUD ====================
  const handleGenerateCodes = useCallback((courseId: string, count: number) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const newCodes: CourseCode[] = [];
    for (let i = 0; i < count; i++) {
      newCodes.push({
        id: generateId(),
        code: generateCode(),
        course_id: courseId,
        teacher_id: course.teacher_id,
        is_used: false,
        created_at: new Date().toISOString(),
      });
    }
    setCodes((prev) => [...prev, ...newCodes]);
  }, [courses]);

  const handleDeleteCode = useCallback((codeId: string) => {
    setCodes((prev) => prev.filter((cd) => cd.id !== codeId));
  }, []);

  // ==================== EXAM CRUD ====================
  const handleAddExam = useCallback((exam: Omit<Exam, 'id' | 'created_at'>) => {
    const newExam: Exam = {
      ...exam,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setExams((prev) => [...prev, newExam]);
  }, []);

  const handleDeleteExam = useCallback((examId: string) => {
    setExams((prev) => prev.filter((ex) => ex.id !== examId));
  }, []);

  const handleSubmitExam = useCallback(
    (submission: Omit<ExamSubmission, 'id' | 'submitted_at'>) => {
      const newSubmission: ExamSubmission = {
        ...submission,
        id: generateId(),
        submitted_at: new Date().toLocaleString('ar-EG'),
      };
      setExamSubmissions((prev) => [...prev, newSubmission]);
    },
    []
  );

  const handleGradeEssaySubmission = useCallback(
    (submissionId: string, essayGrades: { [qId: string]: EssayGrade }) => {
      setExamSubmissions((prev) =>
        prev.map((s) => {
          if (s.id !== submissionId) return s;
          let totalScore = s.score;
          for (const grade of Object.values(essayGrades)) {
            totalScore += grade.score;
          }
          const updated = {
            ...s,
            essay_grades: { ...s.essay_grades, ...essayGrades },
            status: 'completed' as const,
            score: totalScore,
            percentage: Math.round((totalScore / s.total_points) * 100),
          };
          return updated;
        })
      );
    },
    []
  );

  // ==================== STUDENT CRUD ====================
  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setEnrollments((prev) => prev.filter((e) => e.student_id !== studentId));
  }, []);

  const handleToggleBlockStudent = useCallback((studentId: string, isBlocked: boolean) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, is_blocked: isBlocked } : s))
    );
  }, []);

  // ==================== STUDENT ACTIONS ====================
  const handleActivateCode = useCallback(
    async (
      code: string
    ): Promise<{ success: boolean; message: string; courseTitle?: string }> => {
      if (!currentUser) {
        return { success: false, message: 'يجب تسجيل الدخول أولاً' };
      }

      const trimmedCode = code.trim().toUpperCase();
      const foundCode = codes.find(
        (cd) => cd.code.toUpperCase() === trimmedCode && !cd.is_used
      );

      if (!foundCode) {
        return { success: false, message: 'كود التفعيل غير صحيح أو مستخدم بالفعل' };
      }

      const course = courses.find((c) => c.id === foundCode.course_id);
      if (!course) {
        return { success: false, message: 'الكورس غير موجود' };
      }

      // Check if already enrolled
      const alreadyEnrolled = enrollments.some(
        (e) => e.student_id === currentUser.id && e.course_id === course.id
      );
      if (alreadyEnrolled) {
        return { success: false, message: 'أنت مشترك في هذا الكورس بالفعل' };
      }

      // Mark code as used
      setCodes((prev) =>
        prev.map((cd) =>
          cd.id === foundCode.id
            ? {
                ...cd,
                is_used: true,
                used_by_student_id: currentUser.id,
                used_by_student_name: currentUser.name,
                used_by_student_phone: currentUser.phone,
                used_at: new Date().toLocaleString('ar-EG'),
              }
            : cd
        )
      );

      // Create enrollment
      let expiresAt: string | undefined;
      if (course.expiry_type === 'duration_days' && course.expiry_duration_days) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + course.expiry_duration_days);
        expiresAt = expiry.toISOString().split('T')[0];
      } else if (course.expiry_type === 'fixed_date' && course.expiry_date) {
        expiresAt = course.expiry_date;
      }

      const newEnrollment: Enrollment = {
        id: generateId(),
        student_id: currentUser.id,
        student_name: currentUser.name,
        student_phone: currentUser.phone,
        parent_phone: currentUser.parent_phone,
        course_id: course.id,
        course_title: course.title,
        teacher_id: course.teacher_id,
        activated_at: new Date().toLocaleString('ar-EG'),
        expires_at: expiresAt,
        code_used: foundCode.code,
      };
      setEnrollments((prev) => [...prev, newEnrollment]);

      return {
        success: true,
        message: `تم تفعيل الكود والاشتراك في كورس "${course.title}" بنجاح!`,
        courseTitle: course.title,
      };
    },
    [currentUser, codes, courses, enrollments]
  );

  const handleEnrollFreeCourse = useCallback(
    async (
      courseId: string
    ): Promise<{ success: boolean; message: string; courseTitle?: string }> => {
      if (!currentUser) {
        return { success: false, message: 'يجب تسجيل الدخول أولاً' };
      }

      const course = courses.find((c) => c.id === courseId);
      if (!course) {
        return { success: false, message: 'الكورس غير موجود' };
      }

      if (!course.is_free && course.price > 0) {
        return { success: false, message: 'هذا الكورس غير مجاني، استخدم كود التفعيل' };
      }

      const alreadyEnrolled = enrollments.some(
        (e) => e.student_id === currentUser.id && e.course_id === courseId
      );
      if (alreadyEnrolled) {
        return { success: false, message: 'أنت مشترك في هذا الكورس بالفعل' };
      }

      let expiresAt: string | undefined;
      if (course.expiry_type === 'duration_days' && course.expiry_duration_days) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + course.expiry_duration_days);
        expiresAt = expiry.toISOString().split('T')[0];
      } else if (course.expiry_type === 'fixed_date' && course.expiry_date) {
        expiresAt = course.expiry_date;
      }

      const newEnrollment: Enrollment = {
        id: generateId(),
        student_id: currentUser.id,
        student_name: currentUser.name,
        student_phone: currentUser.phone,
        parent_phone: currentUser.parent_phone,
        course_id: course.id,
        course_title: course.title,
        teacher_id: course.teacher_id,
        activated_at: new Date().toLocaleString('ar-EG'),
        expires_at: expiresAt,
        code_used: 'مجاني',
      };
      setEnrollments((prev) => [...prev, newEnrollment]);

      return {
        success: true,
        message: `تم الاشتراك المجاني في كورس "${course.title}" بنجاح!`,
        courseTitle: course.title,
      };
    },
    [currentUser, courses, enrollments]
  );

  const handleLogLessonView = useCallback(
    (lessonId: string, courseId: string) => {
      if (!currentUser) return;
      const course = courses.find((c) => c.id === courseId);
      const lesson = course?.lessons?.find((l) => l.id === lessonId);
      const existing = lessonViews.some(
        (lv) => lv.student_id === currentUser.id && lv.lesson_id === lessonId
      );
      if (existing) return;
      const newLog: LessonViewLog = {
        id: generateId(),
        student_id: currentUser.id,
        student_name: currentUser.name,
        student_phone: currentUser.phone,
        parent_phone: currentUser.parent_phone,
        course_id: courseId,
        lesson_id: lessonId,
        lesson_title: lesson?.title,
        viewed_at: new Date().toLocaleString('ar-EG'),
      };
      setLessonViews((prev) => [...prev, newLog]);
    },
    [currentUser, courses, lessonViews]
  );

  // ==================== ENROLLED COURSE IDS ====================
  const enrolledCourseIds = currentUser
    ? enrollments
        .filter((e) => e.student_id === currentUser.id)
        .map((e) => e.course_id)
    : [];

  // ==================== RENDER ====================
  if (view === 'teacher-login') {
    return <TeacherLogin teachers={teachers} onLoginSuccess={handleTeacherLoginSuccess} onBackToHome={handleBackToHome} />;
  }

  if (view === 'teacher-dashboard' && currentTeacher) {
    return (
      <TeacherDashboard
        teacher={currentTeacher}
        courses={courses}
        codes={codes}
        enrollments={enrollments}
        students={students}
        exams={exams}
        examSubmissions={examSubmissions}
        lessonViews={lessonViews}
        onAddCourse={handleAddCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
        onGenerateCodes={handleGenerateCodes}
        onDeleteCode={handleDeleteCode}
        onAddLessonToCourse={handleAddLessonToCourse}
        onDeleteLessonFromCourse={handleDeleteLessonFromCourse}
        onAddFolderToCourse={handleAddFolderToCourse}
        onDeleteFolderFromCourse={handleDeleteFolderFromCourse}
        onReorderLessons={handleReorderLessons}
        onAddExam={handleAddExam}
        onDeleteExam={handleDeleteExam}
        onGradeEssaySubmission={handleGradeEssaySubmission}
        onUpdateTeacherProfile={handleUpdateTeacherProfile}
        onLogout={handleTeacherLogout}
      />
    );
  }

  if (view === 'student' && currentUser) {
    return (
      <StudentPortal
        currentUser={currentUser}
        teachers={teachers}
        courses={courses}
        codes={codes}
        exams={exams}
        examSubmissions={examSubmissions}
        enrollments={enrollments}
        enrolledCourseIds={enrolledCourseIds}
        lessonViews={lessonViews}
        onLogLessonView={handleLogLessonView}
        onActivateCode={handleActivateCode}
        onEnrollFreeCourse={handleEnrollFreeCourse}
        onSubmitExam={handleSubmitExam}
        onLogout={handleStudentLogout}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminPanel
        teachers={teachers}
        courses={courses}
        codes={codes}
        students={students}
        enrollments={enrollments}
        onAddCourse={handleAddCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
        onAddTeacher={handleAddTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onGenerateCodes={handleGenerateCodes}
        onDeleteCode={handleDeleteCode}
        onDeleteStudent={handleDeleteStudent}
        onToggleBlockTeacher={handleToggleBlockTeacher}
        onToggleBlockStudent={handleToggleBlockStudent}
        onCloseAdmin={handleBackToHome}
      />
    );
  }

  return (
    <>
      <LandingPage
        teachers={teachers}
        courses={courses}
        onOpenAuth={handleOpenAuth}
        onNavigateToTeacherLogin={handleNavigateToTeacherLogin}
        onNavigateToAdmin={handleNavigateToAdmin}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
        onStudentLoginSuccess={handleStudentLoginSuccess}
        existingStudents={students}
      />
    </>
  );
};

export default App;
