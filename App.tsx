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
  fetchTableData,
  upsertTableData,
  INITIAL_TEACHERS,
  INITIAL_COURSES,
  INITIAL_CODES,
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_EXAMS,
  INITIAL_EXAM_SUBMISSIONS
} from './supabase';
import { LandingPage } from './LandingPage';
import { AuthModal } from './AuthModal';
import { StudentPortal } from './StudentPortal';
import { TeacherDashboard } from './TeacherDashboard';
import { TeacherLogin } from './TeacherLogin';
import { AdminPanel } from './AdminPanel';
import { getClientDeviceId } from './device';
import { safeSaveData, safeLoadData } from './storage';
import { LogOut } from 'lucide-react';
import { notifyNewContentWhatsApp, notifyParentGradeWhatsApp } from './whatsapp';

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
  const [logoutConfirm, setLogoutConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load saved data and handle Hash Navigation
  useEffect(() => {
    // 1. Check Student Session (Enforce single active device)
    const savedStudent = localStorage.getItem('edu_student_session');
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        const currentDev = getClientDeviceId();
        // If student is bound to another device, clear session
        if (parsed.device_id && parsed.device_id !== currentDev) {
          localStorage.removeItem('edu_student_session');
          setCurrentUser(null);
        } else {
          setCurrentUser(parsed);
        }
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

    // 3. Load Storage Data (IndexedDB first for full fidelity with large files, then localStorage fallback)
    const loadCachedData = async () => {
      try {
        const [
          storedTeachers,
          storedCourses,
          storedCodes,
          storedEnrollments,
          storedStudents,
          storedExams,
          storedSubmissions,
          storedLessonViews
        ] = await Promise.all([
          safeLoadData<Teacher[]>('edu_teachers_data'),
          safeLoadData<Course[]>('edu_courses_data'),
          safeLoadData<CourseCode[]>('edu_codes_data'),
          safeLoadData<Enrollment[]>('edu_enrollments_data'),
          safeLoadData<StudentUser[]>('edu_students_data'),
          safeLoadData<Exam[]>('edu_exams_data'),
          safeLoadData<ExamSubmission[]>('edu_exam_submissions_data'),
          safeLoadData<LessonViewLog[]>('edu_lesson_views_data'),
        ]);

        if (storedTeachers) setTeachers(storedTeachers);
        if (storedCourses) setCourses(storedCourses);
        if (storedCodes) setCodes(storedCodes);
        if (storedEnrollments) setEnrollments(storedEnrollments);
        if (storedStudents) setStudents(storedStudents);
        if (storedExams) setExams(storedExams);
        if (storedSubmissions) setExamSubmissions(storedSubmissions);
        if (storedLessonViews) setLessonViews(storedLessonViews);
      } catch (err) {
        console.warn('[Cache Loading Error]', err);
      }
    };
    loadCachedData();

    // 3.5. Background Async Sync with Supabase Database
    const syncWithSupabase = async () => {
      try {
        const [sbTeachers, sbCourses, sbCodes, sbStudents, sbEnrollments, sbExams, sbSubs, sbViews] = await Promise.all([
          fetchTableData<Teacher>('teachers'),
          fetchTableData<Course>('courses'),
          fetchTableData<CourseCode>('codes'),
          fetchTableData<StudentUser>('students'),
          fetchTableData<Enrollment>('enrollments'),
          fetchTableData<Exam>('exams'),
          fetchTableData<ExamSubmission>('exam_submissions'),
          fetchTableData<LessonViewLog>('lesson_views'),
        ]);

        if (sbTeachers && sbTeachers.length > 0) {
          setTeachers(sbTeachers);
          safeSaveData('edu_teachers_data', sbTeachers);
        } else if (sbTeachers && sbTeachers.length === 0) {
          const local = await safeLoadData<Teacher[]>('edu_teachers_data');
          if (local && local.length > 0) upsertTableData('teachers', local);
        }

        if (sbCourses && sbCourses.length > 0) {
          setCourses(sbCourses);
          safeSaveData('edu_courses_data', sbCourses);
        } else if (sbCourses && sbCourses.length === 0) {
          const local = await safeLoadData<Course[]>('edu_courses_data');
          if (local && local.length > 0) upsertTableData('courses', local);
        }

        if (sbCodes && sbCodes.length > 0) {
          setCodes(sbCodes);
          safeSaveData('edu_codes_data', sbCodes);
        } else if (sbCodes && sbCodes.length === 0) {
          const local = await safeLoadData<CourseCode[]>('edu_codes_data');
          if (local && local.length > 0) upsertTableData('codes', local);
        }

        if (sbStudents && sbStudents.length > 0) {
          setStudents(sbStudents);
          safeSaveData('edu_students_data', sbStudents);
        } else if (sbStudents && sbStudents.length === 0) {
          const local = await safeLoadData<StudentUser[]>('edu_students_data');
          if (local && local.length > 0) upsertTableData('students', local);
        }

        if (sbEnrollments && sbEnrollments.length > 0) {
          setEnrollments(sbEnrollments);
          safeSaveData('edu_enrollments_data', sbEnrollments);
        } else if (sbEnrollments && sbEnrollments.length === 0) {
          const local = await safeLoadData<Enrollment[]>('edu_enrollments_data');
          if (local && local.length > 0) upsertTableData('enrollments', local);
        }

        if (sbExams && sbExams.length > 0) {
          setExams(sbExams);
          safeSaveData('edu_exams_data', sbExams);
        } else if (sbExams && sbExams.length === 0) {
          const local = await safeLoadData<Exam[]>('edu_exams_data');
          if (local && local.length > 0) upsertTableData('exams', local);
        }

        if (sbSubs && sbSubs.length > 0) {
          setExamSubmissions(sbSubs);
          safeSaveData('edu_exam_submissions_data', sbSubs);
        } else if (sbSubs && sbSubs.length === 0) {
          const local = await safeLoadData<ExamSubmission[]>('edu_exam_submissions_data');
          if (local && local.length > 0) upsertTableData('exam_submissions', local);
        }

        if (sbViews && sbViews.length > 0) {
          setLessonViews(sbViews);
          safeSaveData('edu_lesson_views_data', sbViews);
        }
      } catch (err) {
        console.warn('[Supabase Sync Notice]', err);
      }
    };
    syncWithSupabase();

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

  // Sync Helpers (Local Cache with Safe Quota Handling + Asynchronous Supabase Persistence)
  const saveTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    safeSaveData('edu_teachers_data', newTeachers);
    upsertTableData('teachers', newTeachers);
  };

  const saveCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    safeSaveData('edu_courses_data', newCourses);
    upsertTableData('courses', newCourses);
  };

  const saveCodes = (newCodes: CourseCode[]) => {
    setCodes(newCodes);
    safeSaveData('edu_codes_data', newCodes);
    upsertTableData('codes', newCodes);
  };

  const saveEnrollments = (newEnrollments: Enrollment[]) => {
    setEnrollments(newEnrollments);
    safeSaveData('edu_enrollments_data', newEnrollments);
    upsertTableData('enrollments', newEnrollments);
  };

  const saveStudents = (newStudents: StudentUser[]) => {
    setStudents(newStudents);
    safeSaveData('edu_students_data', newStudents);
    upsertTableData('students', newStudents);
  };

  const saveExams = (newExams: Exam[]) => {
    setExams(newExams);
    safeSaveData('edu_exams_data', newExams);
    upsertTableData('exams', newExams);
  };

  const saveSubmissions = (newSubs: ExamSubmission[]) => {
    setExamSubmissions(newSubs);
    safeSaveData('edu_exam_submissions_data', newSubs);
    upsertTableData('exam_submissions', newSubs);
  };

  const saveLessonViews = (newViews: LessonViewLog[]) => {
    setLessonViews(newViews);
    safeSaveData('edu_lesson_views_data', newViews);
    upsertTableData('lesson_views', newViews);
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

  const handleUpdateStudent = (studentId: string, updatedData: Partial<StudentUser>) => {
    const updatedStudents = students.map((st) => (st.id === studentId ? { ...st, ...updatedData } : st));
    saveStudents(updatedStudents);
    if (currentUser && currentUser.id === studentId) {
      const updatedUser = { ...currentUser, ...updatedData };
      setCurrentUser(updatedUser);
      localStorage.setItem('edu_student_session', JSON.stringify(updatedUser));
    }
  };

  const handleUpdateCoursesOrder = (newCourses: Course[]) => {
    saveCourses(newCourses);
  };

  const handleUpdateTeachersOrder = (newTeachers: Teacher[]) => {
    saveTeachers(newTeachers);
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
    setLogoutConfirm({
      title: 'تأكيد تسجيل الخروج',
      message: 'هل أنت متأكد من رغبتك في تسجيل الخروج من حساب الطالب؟',
      onConfirm: () => {
        setCurrentUser(null);
        localStorage.removeItem('edu_student_session');
        setCurrentView('landing');
        window.location.hash = '';
        setLogoutConfirm(null);
      },
    });
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
    setLogoutConfirm({
      title: 'تأكيد تسجيل الخروج',
      message: 'هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة تحكم المعلم؟',
      onConfirm: () => {
        setCurrentTeacher(null);
        localStorage.removeItem('edu_teacher_session');
        setCurrentView('landing');
        window.location.hash = '';
        setLogoutConfirm(null);
      },
    });
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

  const handleUpdateTeacher = (teacherId: string, updatedData: Partial<Teacher>) => {
    const updated = teachers.map((t) => (t.id === teacherId ? { ...t, ...updatedData } : t));
    saveTeachers(updated);
    if (currentTeacher?.id === teacherId) {
      const updatedTeacher = { ...currentTeacher, ...updatedData };
      setCurrentTeacher(updatedTeacher);
      localStorage.setItem('edu_teacher_session', JSON.stringify(updatedTeacher));
    }
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
  const handleAddExam = (examData: Omit<Exam, 'id' | 'created_at'> & { id?: string }) => {
    const newExam: Exam = {
      id: examData.id || ('ex_' + Date.now()),
      created_at: new Date().toISOString().split('T')[0],
      ...examData,
    };
    saveExams([newExam, ...exams]);

    // Send WhatsApp notification to enrolled students (or all students if none)
    const course = courses.find((c) => c.id === newExam.course_id);
    const courseEnrollments = enrollments.filter((e) => e.course_id === newExam.course_id);
    const targetPhones = courseEnrollments.map((en) => {
      const st = students.find((s) => s.id === en.student_id);
      return st?.phone;
    }).filter(Boolean) as string[];

    const phonesToSend = targetPhones.length > 0 ? targetPhones : students.map((s) => s.phone).filter(Boolean);
    notifyNewContentWhatsApp(phonesToSend, 'اختبار جديد', newExam.title, course?.title || 'كورسات المنصة');
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

  const handleUpdateExam = (examId: string, updated: Partial<Exam>) => {
    saveExams(exams.map((e) => (e.id === examId ? { ...e, ...updated } : e)));
  };

  const handleSubmitExam = (submissionData: Omit<ExamSubmission, 'id' | 'submitted_at'>) => {
    const newSub: ExamSubmission = {
      id: 'sub_' + Date.now(),
      submitted_at: new Date().toLocaleString('ar-EG'),
      ...submissionData,
    };
    saveSubmissions([newSub, ...examSubmissions]);

    // If auto-graded (e.g. multiple choice exam), notify parent via WhatsApp
    if (newSub.status === 'completed') {
      const student = students.find((s) => s.id === newSub.student_id);
      const exam = exams.find((e) => e.id === newSub.exam_id);
      if (student && student.parent_phone && exam) {
        notifyParentGradeWhatsApp(student.parent_phone, student.name, exam.title, newSub.score, newSub.total_points || exam.total_points || 100);
      }
    }
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
        let questionsToGrade = exam.questions;
        if (exam.models && sub.assigned_model_name) {
          const m = exam.models.find((mod) => mod.name === sub.assigned_model_name);
          if (m) questionsToGrade = m.questions;
        }

        questionsToGrade.forEach((q) => {
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

      const gradedSub = {
        ...sub,
        score: totalScore,
        percentage,
        essay_grades: {
          ...(sub.essay_grades || {}),
          ...essayGrades,
        },
        status: 'completed' as const,
      };

      // Notify parent via WhatsApp when graded
      const student = students.find((s) => s.id === sub.student_id);
      if (student && student.parent_phone && exam) {
        notifyParentGradeWhatsApp(student.parent_phone, student.name, exam.title, totalScore, totalPoints);
      }

      return gradedSub;
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
          onUpdateExam={handleUpdateExam}
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
          onUpdateTeacher={handleUpdateTeacher}
          onDeleteStudent={handleDeleteStudent}
          onUpdateStudent={handleUpdateStudent}
          onToggleBlockTeacher={handleToggleBlockTeacher}
          onToggleBlockStudent={handleToggleBlockStudent}
          onGenerateCodes={handleGenerateCodes}
          onDeleteCode={handleDeleteCode}
          onUpdateCoursesOrder={handleUpdateCoursesOrder}
          onUpdateTeachersOrder={handleUpdateTeachersOrder}
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

      {/* LOGOUT CONFIRMATION MODAL */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-150 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full mb-8 p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-1.5">{logoutConfirm.title}</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">{logoutConfirm.message}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirm(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={logoutConfirm.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>نعم، تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
