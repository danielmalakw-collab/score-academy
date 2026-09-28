import React, { useState, useEffect } from 'react';
import {
  Teacher,
  Course,
  CourseCode,
  CourseFolder,
  StudentUser,
  Enrollment,
  Exam,
  ExamSubmission,
  Lesson,
  LessonViewLog,
  EssayGrade
} from './types';
import {
  supabase,
  INITIAL_TEACHERS,
  INITIAL_COURSES,
  INITIAL_CODES,
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_EXAMS,
  INITIAL_EXAM_SUBMISSIONS
} from './lib/supabase';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { StudentPortal } from './components/StudentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLogin } from './components/TeacherLogin';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  // Platform Data State
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [codes, setCodes] = useState<CourseCode[]>(INITIAL_CODES);
  const [students, setStudents] = useState<StudentUser[]>(INITIAL_STUDENTS);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(INITIAL_ENROLLMENTS);
  const [exams, setExams] = useState<Exam[]>(INITIAL_EXAMS);
  const [examSubmissions, setExamSubmissions] = useState<ExamSubmission[]>(INITIAL_EXAM_SUBMISSIONS);
  const [lessonViews, setLessonViews] = useState<LessonViewLog[]>([]);

  // Active Sessions
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  // Current View Router
  type AppView = 'landing' | 'student' | 'teacher' | 'teacher-login' | 'admin';
  const [currentView, setCurrentView] = useState<AppView>('landing');

  // Student Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');

  // Load saved data and handle Hash Navigation
  useEffect(() => {
    // 1. Check Student Session
    const savedStudent = localStorage.getItem('edu_student_session');
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        setCurrentUser(parsed);
      } catch (e) {}
    }

    // 2. Check Teacher Session
    const savedTeacher = localStorage.getItem('edu_teacher_session');
    if (savedTeacher) {
      try {
        const parsed = JSON.parse(savedTeacher);
        setCurrentTeacher(parsed);
      } catch (e) {}
    }

    // 3. Load Storage Data
    const storedTeachers = localStorage.getItem('edu_teachers_data');
    if (storedTeachers) {
      try { setTeachers(JSON.parse(storedTeachers)); } catch (e) {}
    }

    const storedCourses = localStorage.getItem('edu_courses_data');
    if (storedCourses) {
      try { setCourses(JSON.parse(storedCourses)); } catch (e) {}
    }

    const storedCodes = localStorage.getItem('edu_codes_data');
    if (storedCodes) {
      try { setCodes(JSON.parse(storedCodes)); } catch (e) {}
    }

    const storedEnrollments = localStorage.getItem('edu_enrollments_data');
    if (storedEnrollments) {
      try { setEnrollments(JSON.parse(storedEnrollments)); } catch (e) {}
    }

    const storedStudents = localStorage.getItem('edu_students_data');
    if (storedStudents) {
      try { setStudents(JSON.parse(storedStudents)); } catch (e) {}
    }

    const storedExams = localStorage.getItem('edu_exams_data');
    if (storedExams) {
      try { setExams(JSON.parse(storedExams)); } catch (e) {}
    }

    const storedSubmissions = localStorage.getItem('edu_exam_submissions_data');
    if (storedSubmissions) {
      try { setExamSubmissions(JSON.parse(storedSubmissions)); } catch (e) {}
    }

    const storedLessonViews = localStorage.getItem('edu_lesson_views_data');
    if (storedLessonViews) {
      try { setLessonViews(JSON.parse(storedLessonViews)); } catch (e) {}
    }

    // 4. Initial Hash Routing
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#teacher-login') {
        setCurrentView('teacher-login');
      } else if (hash === '#student') {
        const s = localStorage.getItem('edu_student_session');
        if (s) setCurrentView('student');
        else {
          setCurrentView('landing');
          setIsAuthOpen(true);
        }
      } else {
        const t = localStorage.getItem('edu_teacher_session');
        const s = localStorage.getItem('edu_student_session');
        if (t) setCurrentView('teacher');
        else if (s) setCurrentView('student');
        else setCurrentView('landing');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Sync Helpers
  const saveTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    localStorage.setItem('edu_teachers_data', JSON.stringify(newTeachers));
  };

  const saveCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    localStorage.setItem('edu_courses_data', JSON.stringify(newCourses));
  };

  const saveCodes = (newCodes: CourseCode[]) => {
    setCodes(newCodes);
    localStorage.setItem('edu_codes_data', JSON.stringify(newCodes));
  };

  const saveEnrollments = (newEnrollments: Enrollment[]) => {
    setEnrollments(newEnrollments);
    localStorage.setItem('edu_enrollments_data', JSON.stringify(newEnrollments));
  };

  const saveStudents = (newStudents: StudentUser[]) => {
    setStudents(newStudents);
    localStorage.setItem('edu_students_data', JSON.stringify(newStudents));
  };

  const saveExams = (newExams: Exam[]) => {
    setExams(newExams);
    localStorage.setItem('edu_exams_data', JSON.stringify(newExams));
  };

  const saveSubmissions = (newSubs: ExamSubmission[]) => {
    setExamSubmissions(newSubs);
    localStorage.setItem('edu_exam_submissions_data', JSON.stringify(newSubs));
  };

  const saveLessonViews = (newViews: LessonViewLog[]) => {
    setLessonViews(newViews);
    localStorage.setItem('edu_lesson_views_data', JSON.stringify(newViews));
  };

  const handleToggleBlockTeacher = (teacherId: string, isBlocked: boolean) => {
    const updated = teachers.map((t) => (t.id === teacherId ? { ...t, is_blocked: isBlocked } : t));
    saveTeachers(updated);
    if (currentTeacher?.id === teacherId) {
      const updatedTeacher = { ...currentTeacher, is_blocked: isBlocked };
      setCurrentTeacher(updatedTeacher);
      localStorage.setItem('edu_teacher_session', JSON.stringify(updatedTeacher));
    }
  };

  const handleToggleBlockStudent = (studentId: string, isBlocked: boolean) => {
    const updated = students.map((s) => (s.id === studentId ? { ...s, is_blocked: isBlocked } : s));
    saveStudents(updated);
    if (currentUser?.id === studentId) {
      const updatedStudent = { ...currentUser, is_blocked: isBlocked };
      setCurrentUser(updatedStudent);
      localStorage.setItem('edu_student_session', JSON.stringify(updatedStudent));
    }
  };

  const handleLogLessonView = (lessonId: string, courseId: string) => {
    if (!currentUser) return;
    const course = courses.find((c) => c.id === courseId);
    const lesson = course?.lessons?.find((l) => l.id === lessonId);
    const exists = lessonViews.some((v) => v.student_id === currentUser.id && v.lesson_id === lessonId);
    if (!exists) {
      const newLog: LessonViewLog = {
        id: 'lv_' + Date.now(),
        student_id: currentUser.id,
        student_name: currentUser.name,
        student_phone: currentUser.phone,
        parent_phone: currentUser.parent_phone,
        course_id: courseId,
        lesson_id: lessonId,
        lesson_title: lesson?.title,
        viewed_at: new Date().toLocaleString('ar-EG'),
      };
      saveLessonViews([newLog, ...lessonViews]);
    }
  };

  // Student Enrolled Course IDs (Filtered to exclude courses whose expiration date or duration has passed)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeStudentEnrollments = currentUser
    ? enrollments.filter((e) => {
        if (e.student_id !== currentUser.id) return false;
        const course = courses.find((c) => c.id === e.course_id);
        if (!course) return false;

        // 1. Fixed date course expiry (expires for all students on that day)
        if (course.expiry_type === 'fixed_date' && course.expiry_date) {
          if (todayDateStr > course.expiry_date) return false;
        }

        // 2. Duration days after activation expiration
        if (e.expires_at && todayDateStr > e.expires_at) {
          return false;
        }

        return true;
      })
    : [];

  const studentEnrolledIds = activeStudentEnrollments.map((e) => e.course_id);

  // Handle Student Login
  const handleStudentLoginSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    localStorage.setItem('edu_student_session', JSON.stringify(user));

    if (!students.some((s) => s.id === user.id)) {
      saveStudents([user, ...students]);
    } else {
      // update user record in case parent_phone or grade updated
      const updated = students.map((s) => (s.id === user.id ? user : s));
      saveStudents(updated);
    }

    setCurrentView('student');
    window.location.hash = '#student';
  };

  // Handle Student Logout
  const handleStudentLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edu_student_session');
    setCurrentView('landing');
    window.location.hash = '';
  };

  // Handle Teacher Login
  const handleTeacherLoginSuccess = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    localStorage.setItem('edu_teacher_session', JSON.stringify(teacher));
    setCurrentView('teacher');
    window.location.hash = '';
  };

  // Handle Teacher Logout
  const handleTeacherLogout = () => {
    setCurrentTeacher(null);
    localStorage.removeItem('edu_teacher_session');
    setCurrentView('landing');
    window.location.hash = '';
  };

  // Update Teacher Profile
  const handleUpdateTeacherProfile = (updatedData: Partial<Teacher>) => {
    if (!currentTeacher) return;
    const updated: Teacher = { ...currentTeacher, ...updatedData };
    setCurrentTeacher(updated);
    localStorage.setItem('edu_teacher_session', JSON.stringify(updated));

    const allUpdated = teachers.map((t) => (t.id === updated.id ? updated : t));
    saveTeachers(allUpdated);
  };

  // Code Activation (Single-use redemption)
  const handleActivateCode = async (rawCode: string): Promise<{ success: boolean; message: string; courseTitle?: string }> => {
    const codeClean = rawCode.trim().toUpperCase();
    const foundCode = codes.find((c) => c.code.toUpperCase() === codeClean);

    if (!foundCode) {
      return {
        success: false,
        message: 'كود التفعيل غير صحيح أو غير موجود! يرجى التأكد من الحروف والأرقام بدقة.',
      };
    }

    if (foundCode.is_used) {
      return {
        success: false,
        message: 'عذراً، هذا الكود تم استخدامه مسبقاً! كل كود صالح للاستخدام مرة واحدة فقط.',
      };
    }

    const courseObj = courses.find((c) => c.id === foundCode.course_id);
    const courseTitle = courseObj?.title || 'الكورس';

    if (studentEnrolledIds.includes(foundCode.course_id)) {
      return {
        success: false,
        message: `أنت مشترك بالفعل في كورس "${courseTitle}" ومتاح في حسابك!`,
      };
    }

    // 1. Mark Code Used
    const updatedCodes = codes.map((c) =>
      c.id === foundCode.id
        ? {
            ...c,
            is_used: true,
            used_by_student_id: currentUser?.id || 'std_temp',
            used_by_student_name: currentUser?.name || 'طالب',
            used_by_student_phone: currentUser?.phone || '',
            used_at: new Date().toISOString().split('T')[0],
          }
        : c
    );
    saveCodes(updatedCodes);

    // Calculate expiry date for this student's enrollment
    let calculatedExpiry: string | undefined = undefined;
    if (courseObj?.expiry_type === 'fixed_date' && courseObj.expiry_date) {
      calculatedExpiry = courseObj.expiry_date;
    } else if (courseObj?.expiry_type === 'duration_days' && courseObj.expiry_duration_days) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(courseObj.expiry_duration_days));
      calculatedExpiry = expDate.toISOString().split('T')[0];
    }

    // 2. Add Enrollment
    const newEnrollment: Enrollment = {
      id: 'enr_' + Date.now(),
      student_id: currentUser?.id || 'std_temp',
      student_name: currentUser?.name || 'طالب',
      student_phone: currentUser?.phone || '',
      parent_phone: currentUser?.parent_phone || '',
      course_id: foundCode.course_id,
      course_title: courseTitle,
      teacher_id: courseObj?.teacher_id,
      activated_at: new Date().toISOString().split('T')[0],
      expires_at: calculatedExpiry,
      code_used: foundCode.code,
    };
    saveEnrollments([newEnrollment, ...enrollments]);

    return {
      success: true,
      courseTitle,
      message: `🎉 تهانينا! تم تفعيل كورس "${courseTitle}" بنجاح، وأصبح متاحاً الآن في صفحة كورساتك لمشاهدته في أي وقت.`,
    };
  };

  // Free Course One-Click Enrollment
  const handleEnrollFreeCourse = async (courseId: string): Promise<{ success: boolean; message: string; courseTitle?: string }> => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return {
        success: false,
        message: 'يرجى تسجيل الدخول أو إنشاء حساب طالب أولاً لإضافة الكورس لحسابك مجاناً.',
      };
    }

    const courseObj = courses.find((c) => c.id === courseId);
    if (!courseObj) {
      return { success: false, message: 'الكورس غير موجود!' };
    }

    if (studentEnrolledIds.includes(courseId)) {
      return {
        success: false,
        message: `كورس "${courseObj.title}" مضاف بالفعل في حسابك!`,
      };
    }

    // Calculate expiry date for this free enrollment
    let calculatedExpiry: string | undefined = undefined;
    if (courseObj.expiry_type === 'fixed_date' && courseObj.expiry_date) {
      calculatedExpiry = courseObj.expiry_date;
    } else if (courseObj.expiry_type === 'duration_days' && courseObj.expiry_duration_days) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(courseObj.expiry_duration_days));
      calculatedExpiry = expDate.toISOString().split('T')[0];
    }

    const newEnrollment: Enrollment = {
      id: 'enr_' + Date.now(),
      student_id: currentUser.id,
      student_name: currentUser.name,
      student_phone: currentUser.phone,
      parent_phone: currentUser.parent_phone,
      course_id: courseObj.id,
      course_title: courseObj.title,
      teacher_id: courseObj.teacher_id,
      activated_at: new Date().toISOString().split('T')[0],
      expires_at: calculatedExpiry,
      code_used: 'مجاني',
    };

    saveEnrollments([newEnrollment, ...enrollments]);

    return {
      success: true,
      courseTitle: courseObj.title,
      message: `🎉 تم إضافة كورس "${courseObj.title}" إلى حسابك مجاناً بنجاح!`,
    };
  };

  // Course Management
  const handleAddCourse = (courseData: Omit<Course, 'id' | 'is_active'>) => {
    const newCourse: Course = {
      id: 'crs_' + Date.now(),
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
      ...courseData,
    };
    saveCourses([newCourse, ...courses]);
  };

  const handleUpdateCourse = (courseId: string, updatedData: Partial<Course>) => {
    const updated = courses.map((c) => (c.id === courseId ? { ...c, ...updatedData } : c));
    saveCourses(updated);
  };

  const handleDeleteCourse = (courseId: string) => {
    saveCourses(courses.filter((c) => c.id !== courseId));
    saveCodes(codes.filter((c) => c.course_id !== courseId));
    saveEnrollments(enrollments.filter((e) => e.course_id !== courseId));
    saveExams(exams.filter((ex) => ex.course_id !== courseId));
  };

  const handleDeleteTeacher = (teacherId: string) => {
    saveTeachers(teachers.filter((t) => t.id !== teacherId));
    saveCourses(courses.filter((c) => c.teacher_id !== teacherId));
    saveCodes(codes.filter((c) => c.teacher_id !== teacherId));
  };

  const handleDeleteStudent = (studentId: string) => {
    saveStudents(students.filter((s) => s.id !== studentId));
    saveEnrollments(enrollments.filter((e) => e.student_id !== studentId));
  };

  // Add / Delete Lesson from course
  const handleAddLessonToCourse = (courseId: string, lessonData: Omit<Lesson, 'id'>) => {
    const newLesson: Lesson = {
      id: 'ls_' + Date.now(),
      ...lessonData,
    };
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          lessons: [...(c.lessons || []), newLesson],
          lessons_count: (c.lessons?.length || 0) + 1,
        };
      }
      return c;
    });
    saveCourses(updated);
  };

  const handleDeleteLessonFromCourse = (courseId: string, lessonId: string) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          lessons: (c.lessons || []).filter((l) => l.id !== lessonId),
          lessons_count: Math.max(0, (c.lessons?.length || 1) - 1),
        };
      }
      return c;
    });
    saveCourses(updated);
  };

  // Add Empty Accordion Folder to Course (Supports nested parentId)
  const handleAddFolderToCourse = (courseId: string, folderTitle: string, description?: string, parentId?: string) => {
    const newFolder: CourseFolder = {
      id: 'fld_' + Date.now(),
      course_id: courseId,
      title: folderTitle.trim(),
      description: description?.trim(),
      parent_id: parentId,
      created_at: new Date().toISOString().split('T')[0],
    };
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          folders: [...(c.folders || []), newFolder],
        };
      }
      return c;
    });
    saveCourses(updated);
  };

  // Delete Folder from Course (and nested sub-folders + unassign its lessons)
  const handleDeleteFolderFromCourse = (courseId: string, folderId: string) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        const foldersToDelete = new Set<string>([folderId]);
        (c.folders || []).forEach((f) => {
          if (f.parent_id === folderId) foldersToDelete.add(f.id);
        });

        return {
          ...c,
          folders: (c.folders || []).filter((f) => !foldersToDelete.has(f.id)),
          lessons: (c.lessons || []).map((l) =>
            l.folder_id && foldersToDelete.has(l.folder_id) ? { ...l, folder_id: undefined } : l
          ),
        };
      }
      return c;
    });
    saveCourses(updated);
  };

  // Reorder lessons on the ladder
  const handleReorderLessonsInCourse = (courseId: string, updatedLessons: Lesson[]) => {
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          lessons: updatedLessons,
        };
      }
      return c;
    });
    saveCourses(updated);
  };

  // Exams Management
  const handleAddExam = (examData: Omit<Exam, 'id' | 'created_at'>) => {
    const newExam: Exam = {
      id: 'ex_' + Date.now(),
      created_at: new Date().toISOString().split('T')[0],
      ...examData,
    };
    saveExams([newExam, ...exams]);
  };

  const handleDeleteExam = (examId: string) => {
    saveExams(exams.filter((e) => e.id !== examId));
    saveSubmissions(examSubmissions.filter((sub) => sub.exam_id !== examId));
    // Cascade delete any course quiz lessons attached to this exam
    const updated = courses.map((c) => ({
      ...c,
      lessons: (c.lessons || []).filter((l) => l.quiz_id !== examId),
    }));
    saveCourses(updated);
  };

  const handleSubmitExam = (submissionData: Omit<ExamSubmission, 'id' | 'submitted_at'>) => {
    const newSub: ExamSubmission = {
      id: 'sub_' + Date.now(),
      submitted_at: new Date().toLocaleString('ar-EG'),
      ...submissionData,
    };
    saveSubmissions([newSub, ...examSubmissions]);
  };

  const handleGradeEssaySubmission = (
    submissionId: string,
    essayGrades: { [questionId: string]: EssayGrade }
  ) => {
    const updated = examSubmissions.map((sub) => {
      if (sub.id !== submissionId) return sub;

      const exam = exams.find((e) => e.id === sub.exam_id);
      let mcqScore = 0;
      if (exam) {
        exam.questions.forEach((q) => {
          if (q.type !== 'essay') {
            const chosen = sub.answers[q.id];
            if (chosen !== undefined && chosen === q.correct_index) {
              mcqScore += Number(q.points) || 1;
            }
          }
        });
      }

      let essayScore = 0;
      Object.values(essayGrades).forEach((g) => {
        essayScore += Number(g.score) || 0;
      });

      const totalScore = mcqScore + essayScore;
      const totalPoints = sub.total_points || (exam ? exam.total_points : 100);
      const percentage = Math.round((totalScore / (totalPoints || 1)) * 100);

      return {
        ...sub,
        score: totalScore,
        percentage,
        essay_grades: {
          ...(sub.essay_grades || {}),
          ...essayGrades,
        },
        status: 'completed' as const,
      };
    });

    saveSubmissions(updated);
  };

  // Generate Single-use Codes
  const handleGenerateCodes = (courseId: string, count: number) => {
    const course = courses.find((c) => c.id === courseId);
    const prefix = course?.title
      ? course.title.substring(0, 3).toUpperCase().replace(/\s/g, 'X')
      : 'EDU';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    const generated: CourseCode[] = [];
    for (let i = 0; i < count; i++) {
      let rand = '';
      for (let j = 0; j < 5; j++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      generated.push({
        id: 'cd_' + Date.now() + '_' + i,
        code: `${prefix}-${rand}`,
        course_id: courseId,
        teacher_id: course?.teacher_id,
        is_used: false,
        created_at: new Date().toISOString().split('T')[0],
      });
    }

    saveCodes([...generated, ...codes]);
  };

  const handleDeleteCode = (codeId: string) => {
    saveCodes(codes.filter((c) => c.id !== codeId));
  };

  return (
    <>
      {/* VIEW ROUTER */}
      {currentView === 'teacher-login' ? (
        /* 1. TEACHER LOGIN PAGE (For teachers created by admin) */
        <TeacherLogin
          teachers={teachers}
          onLoginSuccess={handleTeacherLoginSuccess}
          onBackToHome={() => {
            setCurrentView('landing');
            window.location.hash = '';
          }}
        />
      ) : currentView === 'teacher' && currentTeacher ? (
        /* 2. TEACHER INDEPENDENT DASHBOARD */
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
          onDeleteCourse={handleDeleteCourse}
          onGenerateCodes={handleGenerateCodes}
          onDeleteCode={handleDeleteCode}
          onAddLessonToCourse={handleAddLessonToCourse}
          onDeleteLessonFromCourse={handleDeleteLessonFromCourse}
          onAddFolderToCourse={handleAddFolderToCourse}
          onDeleteFolderFromCourse={handleDeleteFolderFromCourse}
          onReorderLessons={handleReorderLessonsInCourse}
          onAddExam={handleAddExam}
          onDeleteExam={handleDeleteExam}
          onUpdateCourse={handleUpdateCourse}
          onGradeEssaySubmission={handleGradeEssaySubmission}
          onUpdateTeacherProfile={handleUpdateTeacherProfile}
          onLogout={handleTeacherLogout}
        />
      ) : currentView === 'admin' ? (
        /* 3. SUPER ADMIN PANEL (Accessible via #admin or footer button) */
        <AdminPanel
          teachers={teachers}
          courses={courses}
          codes={codes}
          students={students}
          enrollments={enrollments}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onAddTeacher={(data) => {
            const newT: Teacher = {
              id: 'tch_' + Date.now(),
              created_at: new Date().toISOString().split('T')[0],
              ...data,
            };
            saveTeachers([newT, ...teachers]);
            return newT;
          }}
          onDeleteTeacher={handleDeleteTeacher}
          onDeleteStudent={handleDeleteStudent}
          onToggleBlockTeacher={handleToggleBlockTeacher}
          onToggleBlockStudent={handleToggleBlockStudent}
          onGenerateCodes={handleGenerateCodes}
          onDeleteCode={handleDeleteCode}
          onCloseAdmin={() => {
            setCurrentView('landing');
            window.location.hash = '';
          }}
        />
      ) : currentUser && currentView === 'student' ? (
        /* 4. STUDENT PORTAL */
        <StudentPortal
          currentUser={currentUser}
          teachers={teachers}
          courses={courses}
          codes={codes}
          exams={exams}
          examSubmissions={examSubmissions}
          enrollments={enrollments}
          enrolledCourseIds={studentEnrolledIds}
          lessonViews={lessonViews}
          onLogLessonView={handleLogLessonView}
          onActivateCode={handleActivateCode}
          onEnrollFreeCourse={handleEnrollFreeCourse}
          onSubmitExam={handleSubmitExam}
          onLogout={handleStudentLogout}
        />
      ) : (
        /* 5. LANDING PAGE (Clean Canva Style for Students) */
        <LandingPage
          teachers={teachers}
          courses={courses}
          onOpenAuth={(mode = 'login') => {
            setAuthDefaultMode(mode);
            setIsAuthOpen(true);
          }}
          onNavigateToTeacherLogin={() => {
            setCurrentView('teacher-login');
            window.location.hash = '#teacher-login';
          }}
          onNavigateToAdmin={() => {
            setCurrentView('admin');
            window.location.hash = '#admin';
          }}
        />
      )}

      {/* STUDENT AUTH MODAL (Strictly for students - login & register with parent phone) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authDefaultMode}
        onStudentLoginSuccess={handleStudentLoginSuccess}
        existingStudents={students}
      />
    </>
  );
}
