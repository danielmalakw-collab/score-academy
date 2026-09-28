import React, { useState, useEffect } from 'react';
import {
  Teacher,
  Course,
  CourseFolder,
  StudentUser,
  CourseCode,
  Exam,
  ExamSubmission,
  Lesson,
  LessonViewLog,
  Enrollment
} from '../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  KeyRound,
  UserCheck,
  LogOut,
  Lock,
  Unlock,
  PlayCircle,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  Gift,
  FileText,
  Video,
  FileCode,
  ExternalLink,
  ClipboardList,
  Check,
  ChevronRight,
  HelpCircle,
  Phone,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Headphones,
  Share2,
  Globe,
  Send,
  FileEdit,
  Image as ImageIcon,
  MessageCircle,
  X
} from 'lucide-react';
import { SOCIAL_HUB_URL, getSocialHubUrl, setCustomSocialHubUrl } from '../config';

interface StudentPortalProps {
  currentUser: StudentUser;
  teachers: Teacher[];
  courses: Course[];
  codes: CourseCode[];
  exams: Exam[];
  examSubmissions: ExamSubmission[];
  enrollments?: Enrollment[];
  enrolledCourseIds: string[];
  lessonViews?: LessonViewLog[];
  onLogLessonView?: (lessonId: string, courseId: string) => void;
  onActivateCode: (code: string) => Promise<{ success: boolean; message: string; courseTitle?: string }>;
  onEnrollFreeCourse: (courseId: string) => Promise<{ success: boolean; message: string; courseTitle?: string }>;
  onSubmitExam: (submission: Omit<ExamSubmission, 'id' | 'submitted_at'>) => void;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  teachers,
  courses,
  codes,
  exams,
  examSubmissions,
  enrollments = [],
  enrolledCourseIds,
  lessonViews,
  onLogLessonView,
  onActivateCode,
  onEnrollFreeCourse,
  onSubmitExam,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teachers' | 'my-courses' | 'activate' | 'exam-grades' | 'profile'>('dashboard');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacherGradeFilter, setSelectedTeacherGradeFilter] = useState<string>('الكل');

  // Viewing Course state
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Active Exam state (when student is taking a quiz/exam)
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeExamModelName, setActiveExamModelName] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<{ [qId: string]: number }>({});
  const [examEssayAnswers, setExamEssayAnswers] = useState<{ [qId: string]: string }>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState<number | null>(null);
  const [examFinishedScore, setExamFinishedScore] = useState<{
    score: number;
    total: number;
    percentage: number;
    isEssayPending?: boolean;
    isTimeout?: boolean;
  } | null>(null);

  // Viewing Teacher's Essay Feedback Modal
  const [viewingEssayFeedback, setViewingEssayFeedback] = useState<ExamSubmission | null>(null);

  // Prerequisite Lock Alert Modal / Toast
  const [prerequisiteAlert, setPrerequisiteAlert] = useState<{
    lessonTitle: string;
    examTitle: string;
    exam?: Exam;
    examLesson?: Lesson;
  } | null>(null);

  // Activation Code input
  const [codeInputValue, setCodeInputValue] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [activationResult, setActivationResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Free course enrollment toast
  const [freeActionMsg, setFreeActionMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 5-Second Congratulations Modal State upon course enrollment
  const [congratsModal, setCongratsModal] = useState<{
    courseTitle: string;
    message: string;
    secondsLeft: number;
  } | null>(null);

  // 3 Support and Social Media Dialog State
  const [supportModalType, setSupportModalType] = useState<'academic' | 'technical' | 'social' | null>(null);
  const [customSocialUrlInput, setCustomSocialUrlInput] = useState(getSocialHubUrl());
  const [socialHubSavedMsg, setSocialHubSavedMsg] = useState(false);

  const handleOpenSocialHub = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const targetUrl = getSocialHubUrl();
    if (targetUrl && targetUrl.trim().length > 0) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      setSupportModalType('social');
    }
  };

  const handleSaveAndOpenSocialHub = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSocialHubUrl(customSocialUrlInput);
    setSocialHubSavedMsg(true);
    setTimeout(() => setSocialHubSavedMsg(false), 3000);
    if (customSocialUrlInput.trim().length > 0) {
      window.open(customSocialUrlInput.trim(), '_blank', 'noopener,noreferrer');
      setSupportModalType(null);
    }
  };

  // Handle 5-second countdown timer for congratulations modal
  useEffect(() => {
    if (!congratsModal) return;
    if (congratsModal.secondsLeft <= 1) {
      const timer = setTimeout(() => {
        setCongratsModal(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCongratsModal((prev) => (prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [congratsModal]);

  // Accordion Folders Expanded State in Course Viewer
  const [studentExpandedFolders, setStudentExpandedFolders] = useState<Record<string, boolean>>({});
  const toggleStudentFolder = (folderId: string) => {
    setStudentExpandedFolders((prev) => ({
      ...prev,
      [folderId]: prev[folderId] === undefined ? false : !prev[folderId],
    }));
  };

  // Enrolled courses list
  const myCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));
  const lastEnrolledCourse = myCourses.length > 0 ? myCourses[0] : null;

  // Code Submit
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInputValue.trim()) return;

    setIsSubmittingCode(true);
    setActivationResult(null);

    const res = await onActivateCode(codeInputValue.trim());
    if (res.success) {
      setActivationResult({
        type: 'success',
        message: res.message,
      });
      // Trigger 5-second congratulations popup
      setCongratsModal({
        courseTitle: res.courseTitle || 'الكورس',
        message: res.message,
        secondsLeft: 5,
      });
      setCodeInputValue('');
    } else {
      setActivationResult({
        type: 'error',
        message: res.message,
      });
    }
    setIsSubmittingCode(false);
  };

  // Free Course One-Click Enrollment
  const handleAddFreeCourse = async (courseId: string) => {
    const res = await onEnrollFreeCourse(courseId);
    if (res.success) {
      setFreeActionMsg({ type: 'success', message: res.message });
      // Trigger 5-second congratulations popup
      setCongratsModal({
        courseTitle: res.courseTitle || 'الكورس',
        message: res.message,
        secondsLeft: 5,
      });
      setTimeout(() => setFreeActionMsg(null), 5000);
    } else {
      setFreeActionMsg({ type: 'error', message: res.message });
      setTimeout(() => setFreeActionMsg(null), 4000);
    }
  };

  // Helper: check if a lesson is locked due to prerequisite exam not passed (>= 50%)
  const getPrecedingUnpassedExam = (
    lesson: Lesson,
    course: Course
  ): { isLocked: boolean; exam?: Exam; examLesson?: Lesson } => {
    // When teacher sets "فك الحظر" (prerequisite_lock_enabled is false/off), nothing is locked!
    if (!course.prerequisite_lock_enabled) return { isLocked: false };

    // Determine sequential order context:
    // If the lesson is inside a folder, check preceding items in that folder
    let contextLessons: Lesson[] = [];
    if (lesson.folder_id) {
      contextLessons = (course.lessons || []).filter((l) => l.folder_id === lesson.folder_id);
    } else {
      contextLessons = (course.lessons || []).filter((l) => !l.folder_id);
    }

    if (contextLessons.length <= 1) {
      contextLessons = course.lessons || [];
    }

    const currentIndex = contextLessons.findIndex((l) => l.id === lesson.id);
    if (currentIndex <= 0) return { isLocked: false };

    // Look for any preceding quiz in this sequence
    for (let i = 0; i < currentIndex; i++) {
      const prev = contextLessons[i];
      if (prev.content_type === 'quiz') {
        const linkedExam = exams.find(
          (ex) =>
            (prev.quiz_id && ex.id === prev.quiz_id) ||
            ex.title === prev.title ||
            ex.title === prev.title.replace('اختبار: ', '')
        );

        // Check if student has taken this exam and scored >= 50%
        const passed = examSubmissions.some(
          (sub) =>
            sub.student_id === currentUser.id &&
            ((prev.quiz_id && sub.exam_id === prev.quiz_id) || (linkedExam && sub.exam_id === linkedExam.id)) &&
            sub.percentage >= 50 &&
            sub.status !== 'pending_review'
        );

        if (!passed) {
          return { isLocked: true, exam: linkedExam, examLesson: prev };
        }
      }
    }

    return { isLocked: false };
  };

  const isLessonLocked = (lesson: Lesson, course: Course): boolean => {
    return getPrecedingUnpassedExam(lesson, course).isLocked;
  };

  // Handle Lesson Selection & Lecture View Tracking
  const handleSelectLesson = (lesson: Lesson, courseId: string) => {
    const course = courses.find((c) => c.id === courseId) || viewingCourse;
    if (course && course.prerequisite_lock_enabled) {
      const lockInfo = getPrecedingUnpassedExam(lesson, course);
      if (lockInfo.isLocked) {
        setPrerequisiteAlert({
          lessonTitle: lesson.title,
          examTitle: lockInfo.exam?.title || lockInfo.examLesson?.title || 'الاختبار السابق',
          exam: lockInfo.exam,
          examLesson: lockInfo.examLesson,
        });
        return; // Prevent opening locked lesson!
      }
    }

    setActiveLesson(lesson);
    if (onLogLessonView) {
      onLogLessonView(lesson.id, courseId);
    }
  };

  // Handle Taking & Submitting an Exam with Randomization / Multi-Model Support & Timer
  const handleStartExam = (exam: Exam) => {
    let chosenQuestions = [...exam.questions];
    let modelName: string | null = null;

    if (exam.models && exam.models.length > 0) {
      // Multiple models mode: Pick random model
      const pickedModel = exam.models[Math.floor(Math.random() * exam.models.length)];
      chosenQuestions = [...pickedModel.questions];
      modelName = pickedModel.name;
    } else if (exam.randomize_order) {
      // Randomized question order
      chosenQuestions = [...exam.questions].sort(() => Math.random() - 0.5);
    }

    setActiveExam({
      ...exam,
      questions: chosenQuestions,
    });
    setActiveExamModelName(modelName);
    setExamAnswers({});
    setExamEssayAnswers({});
    setExamFinishedScore(null);

    // Start live countdown timer if enabled
    if (exam.has_timer !== false && (exam.duration_minutes || 0) > 0) {
      setExamTimeRemaining((exam.duration_minutes || 20) * 60);
    } else {
      setExamTimeRemaining(null);
    }
  };

  const handleSelectExamOption = (qId: string, optIndex: number) => {
    setExamAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleSubmitExamAnswers = (isTimeout: boolean = false) => {
    if (!activeExam) return;

    let score = 0;
    activeExam.questions.forEach((q) => {
      if (q.type !== 'essay') {
        const studentChosen = examAnswers[q.id];
        if (studentChosen !== undefined && studentChosen === q.correct_index) {
          score += Number(q.points) || 1;
        }
      }
    });

    const total = activeExam.total_points || activeExam.questions.reduce((a, b) => a + (Number(b.points) || 1), 0);
    const percentage = Math.round((score / (total || 1)) * 100);
    const hasEssayQuestions = activeExam.questions.some((q) => q.type === 'essay');

    // Save submission so it shows in teacher dashboard
    onSubmitExam({
      exam_id: activeExam.id,
      exam_title: activeExam.title,
      course_id: activeExam.course_id,
      course_title: courses.find((c) => c.id === activeExam.course_id)?.title,
      teacher_id: activeExam.teacher_id,
      student_id: currentUser.id,
      student_name: currentUser.name,
      student_phone: currentUser.phone,
      parent_phone: currentUser.parent_phone,
      score,
      total_points: total,
      percentage,
      answers: examAnswers,
      answers_essay: examEssayAnswers,
      status: hasEssayQuestions ? 'pending_review' : 'completed',
      assigned_model_name: activeExamModelName || undefined,
    });

    // Clear live countdown timer
    setExamTimeRemaining(null);

    // Show score / pending review to student
    setExamFinishedScore({
      score,
      total,
      percentage,
      isEssayPending: hasEssayQuestions,
      isTimeout,
    });
  };

  // Exam Countdown Timer Effect (Auto-submits when time runs out)
  useEffect(() => {
    if (!activeExam || examTimeRemaining === null || examFinishedScore) return;

    if (examTimeRemaining <= 0) {
      handleSubmitExamAnswers(true);
      return;
    }

    const timer = setInterval(() => {
      setExamTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, examTimeRemaining, examFinishedScore]);

  // Helper to convert YouTube watch links to embed links
  const getEmbedVideoUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    let url = rawUrl.trim();
    if (url.includes('youtube.com/watch?v=')) {
      const vId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vId}`;
    }
    if (url.includes('youtu.be/')) {
      const vId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vId}`;
    }
    return url;
  };

  if (currentUser.is_blocked) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-['Cairo'] antialiased" dir="rtl">
        <div className="max-w-md w-full bg-slate-800/95 border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center backdrop-blur-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs mb-3 border border-rose-500/30">
            حساب معلّق مؤقتاً
          </span>
          <h2 className="text-2xl font-black text-white mb-2">تم حظر حسابك</h2>
          <p className="text-rose-300 text-sm font-bold mb-4">
            تواصل مع الدعم لرفع الحظر
          </p>
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80 mb-6 text-slate-300 text-xs leading-relaxed text-right space-y-2">
            <p>
              🚫 تم حظر حسابك مؤقتاً بواسطة إدارة المنصة.
            </p>
            <p>
              🔒 لا يمكنك في الوقت الحالي مشاهدة المحاضرات، حل الاختبارات، أو إضافة وتفعيل كورسات جديدة.
            </p>
            <p className="text-emerald-400 font-bold pt-1">
              ✓ جميع كورساتك المشترك بها ودرجاتك واختباراتك محفوظة بالكامل ولم يُحذف منها أي شيء، وستعود كما كانت فور رفع الحظر بواسطة الإدارة.
            </p>
          </div>
          <div className="space-y-3">
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Phone className="w-4 h-4" />
              <span>تواصل مع الدعم لرفع الحظر</span>
            </a>
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من المنصة</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-row text-slate-800 font-['Cairo'] antialiased" dir="rtl">
      {/* Toast Alert for Free Enrollment */}
      {freeActionMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-5 py-3 rounded-2xl shadow-xl border text-xs font-black flex items-center gap-2 ${
              freeActionMsg.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {freeActionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{freeActionMsg.message}</span>
          </div>
        </div>
      )}

      {/* Sleek, Compact Side Navigation - Always on the Side */}
      <aside className="w-16 sm:w-20 md:w-52 lg:w-56 bg-white border-l border-slate-200/90 shrink-0 flex flex-col justify-between shadow-xs sticky top-0 h-screen z-20 transition-all duration-300">
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
          {/* Logo Brand Header */}
          <div className="p-2.5 sm:p-3 md:p-4 border-b border-slate-100 flex items-center justify-center md:justify-start gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shadow-indigo-500/20 shrink-0">
              م
            </div>
            <div className="hidden md:block overflow-hidden">
              <h2 className="font-extrabold text-xs lg:text-sm text-slate-900 leading-tight truncate">منصتي التعليمية</h2>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                لوحة الطالب
              </span>
            </div>
          </div>

          {/* User Profile Mini Badge */}
          <div className="m-2 sm:m-2.5 md:m-3 p-1.5 sm:p-2 md:p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center md:justify-start gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl md:rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:block overflow-hidden min-w-0">
              <h3 className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</h3>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.grade || 'طالب متميز'}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-1.5 sm:p-2 md:p-3 space-y-1 sm:space-y-1.5 flex-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedTeacherId(null); }}
              title="الرئيسية"
              className={`w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 sm:p-2.5 md:px-3.5 md:py-2.5 rounded-2xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold leading-tight truncate">الرئيسية</span>
            </button>

            <button
              onClick={() => { setActiveTab('teachers'); setSelectedTeacherId(null); }}
              title="المدرسين"
              className={`w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 sm:p-2.5 md:px-3.5 md:py-2.5 rounded-2xl transition cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold leading-tight truncate">المدرسين</span>
            </button>

            <button
              onClick={() => { setActiveTab('my-courses'); setSelectedTeacherId(null); }}
              title="كورساتك"
              className={`w-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-1 md:gap-3 p-2 sm:p-2.5 md:px-3.5 md:py-2.5 rounded-2xl transition cursor-pointer relative ${
                activeTab === 'my-courses'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                <span className="text-[9px] md:text-xs font-bold leading-tight truncate">كورساتك</span>
              </div>
              {myCourses.length > 0 && (
                <span className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'my-courses' ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'
                } absolute -top-1 -right-1 md:static md:top-auto md:right-auto`}>
                  {myCourses.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('exam-grades'); setSelectedTeacherId(null); }}
              title="درجات اختباراتك"
              className={`w-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-1 md:gap-3 p-2 sm:p-2.5 md:px-3.5 md:py-2.5 rounded-2xl transition cursor-pointer relative ${
                activeTab === 'exam-grades'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                <span className="text-[9px] md:text-xs font-bold leading-tight truncate">درجات اختباراتك</span>
              </div>
              {examSubmissions.filter((s) => s.student_id === currentUser.id).length > 0 && (
                <span className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'exam-grades' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'
                } absolute -top-1 -right-1 md:static md:top-auto md:right-auto`}>
                  {examSubmissions.filter((s) => s.student_id === currentUser.id).length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('activate'); setSelectedTeacherId(null); }}
              title="تفعيل كود"
              className={`w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 sm:p-2.5 md:px-3.5 md:py-2.5 rounded-2xl transition cursor-pointer ${
                activeTab === 'activate'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <KeyRound className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold leading-tight truncate">تفعيل كود</span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setSelectedTeacherId(null); }}
              title="حسابي"
              className={`w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 sm:p-2.5 md:px-3.5 md:py-2.5 rounded-2xl transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
              <span className="text-[9px] md:text-xs font-bold leading-tight truncate">حسابي</span>
            </button>
          </nav>

          {/* Clean Logout */}
          <div className="p-1.5 sm:p-2 md:p-3 border-t border-slate-100">
            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className="w-full flex items-center justify-center gap-1.5 p-2 md:py-2.5 md:px-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[9px] md:text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
        {/* ===================== TAB 1: DASHBOARD ===================== */}
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Hero Welcome Card */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15 backdrop-blur text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                    <span>مرحباً بك في منصتك التعليمية</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black">{currentUser.name}</h2>
                  <p className="text-[11px] sm:text-xs md:text-sm text-white/80 mt-1 max-w-xl leading-relaxed">
                    تابع تقدمك في الكورسات، استكشف شروحات نخبة المعلمين، وابدأ بحل الامتحانات التفاعلية.
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveTab('activate')}
                    className="px-3.5 sm:px-5 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-[11px] sm:text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>تفعيل كود</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('teachers')}
                    className="px-3.5 sm:px-5 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] sm:text-xs backdrop-blur transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>المدرسين</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 md:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center text-center sm:text-right gap-2 sm:gap-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-xs text-slate-400 font-bold block truncate">كورساتك المفعلة</span>
                  <span className="text-base sm:text-2xl font-black text-slate-900">{myCourses.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 md:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center text-center sm:text-right gap-2 sm:gap-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <Award className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-xs text-slate-400 font-bold block truncate">اختبارات محلولة</span>
                  <span className="text-base sm:text-2xl font-black text-slate-900">
                    {examSubmissions.filter((s) => s.student_id === currentUser.id).length}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 md:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center text-center sm:text-right gap-2 sm:gap-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-xs text-slate-400 font-bold block truncate">المعلمون</span>
                  <span className="text-base sm:text-2xl font-black text-slate-900">{teachers.length}</span>
                </div>
              </div>
            </div>

            {/* Available Free Courses Section (Square Cards) */}
            {courses.filter((c) => (c.price === 0 || c.is_free) && !enrolledCourseIds.includes(c.id)).length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-emerald-950">كورسات مجانية متاحة لك الآن</h3>
                    <p className="text-[11px] sm:text-xs text-emerald-800">
                      يمكنك تفعيل وإضافة هذه الكورسات لحسابك بضغطة زر واحدة دون الحاجة لأي كود!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4">
                  {courses
                    .filter((c) => (c.price === 0 || c.is_free) && !enrolledCourseIds.includes(c.id))
                    .map((fc) => {
                      const teacher = teachers.find((t) => t.id === fc.teacher_id);
                      return (
                        <div
                          key={fc.id}
                          className="bg-white rounded-3xl p-3.5 sm:p-4 border border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between relative overflow-hidden group min-h-[290px] sm:min-h-[320px]"
                        >
                          {/* Teacher Header: Prominently Enlarged Photo & Name */}
                          <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                            {teacher?.image_data ? (
                              <img
                                src={teacher.image_data}
                                alt={teacher.name}
                                className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ring-3 ring-emerald-500/25 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-xs shrink-0">
                                {teacher ? teacher.name.charAt(0) : 'م'}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] sm:text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mb-0.5">
                                المعلم
                              </span>
                              <h4 className="font-black text-sm sm:text-base md:text-lg text-slate-900 truncate leading-snug">
                                {teacher ? `أ. ${teacher.name}` : 'معلم المنصة'}
                              </h4>
                              {teacher?.specialization && (
                                <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">
                                  {teacher.specialization}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Info */}
                          <div className="flex-1 flex flex-col justify-center py-2 min-h-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate flex-1" title={fc.title}>
                                {fc.title}
                              </h5>
                              <span className="bg-emerald-600 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                                مجاني
                              </span>
                            </div>
                            {fc.grade && (
                              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block truncate">
                                📚 {fc.grade}
                              </span>
                            )}
                          </div>

                          {/* Bottom Action */}
                          <button
                            onClick={() => handleAddFreeCourse(fc.id)}
                            className="w-full py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>إضافة مجاناً</span>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* My Active Courses Preview (Square Cards) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">كورساتك المفعلة</h3>
                <button
                  onClick={() => setActiveTab('my-courses')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  عرض الكل ({myCourses.length})
                </button>
              </div>

              {myCourses.length === 0 ? (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center border border-slate-200/80">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-extrabold text-slate-700 text-sm">ليس لديك كورسات مفعّلة بعد</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                    تصفح المدرسين والكورسات المجانية أو أدخل كود التفعيل الذي استلمته من المعلم.
                  </p>
                  <button
                    onClick={() => setActiveTab('activate')}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    تفعيل كود الآن
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-5">
                  {myCourses.slice(0, 6).map((crs) => {
                    const teacher = teachers.find((t) => t.id === crs.teacher_id);
                    return (
                      <div
                        key={crs.id}
                        className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group min-h-[290px] sm:min-h-[320px]"
                      >
                        {/* Teacher Header: Prominently Enlarged Photo & Name */}
                        <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                          {teacher?.image_data ? (
                            <img
                              src={teacher.image_data}
                              alt={teacher.name}
                              className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ring-3 ring-indigo-500/25 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-xs shrink-0">
                              {teacher ? teacher.name.charAt(0) : 'م'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-0.5">
                              المعلم
                            </span>
                            <h4 className="font-black text-sm sm:text-base md:text-lg text-slate-900 truncate leading-snug">
                              {teacher ? `أ. ${teacher.name}` : 'معلم المنصة'}
                            </h4>
                            {teacher?.specialization && (
                              <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">
                                {teacher.specialization}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle Info */}
                        <div className="flex-1 flex flex-col justify-center py-2 min-h-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate flex-1" title={crs.title}>
                              {crs.title}
                            </h5>
                            <span className="bg-emerald-600 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              مفعّل
                            </span>
                          </div>
                          {crs.grade && (
                            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block truncate">
                              📚 {crs.grade}
                            </span>
                          )}
                        </div>

                        {/* Bottom Action */}
                        <button
                          onClick={() => {
                            setViewingCourse(crs);
                            setActiveLesson(crs.lessons?.[0] || null);
                          }}
                          className="w-full py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>فتح الكورس</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: TEACHERS (ENLARGED CARDS) ===================== */}
        {activeTab === 'teachers' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
            {!selectedTeacherId ? (
              <div>
                <div className="mb-8">
                  <span className="text-indigo-600 text-xs font-black bg-indigo-50 px-3 py-1 rounded-lg">
                    نخبة المعلمين
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 mt-2">معلمو المنصة</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    اضغط على أي معلم لعرض بطاقته وكافة الكورسات التي يقدمها، سواء كانت مجانية أو تتطلب كود تفعيل.
                  </p>
                </div>

                {teachers.length === 0 ? (
                  <div className="p-14 text-center bg-white rounded-3xl border border-slate-200/80">
                    <Users className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs text-slate-500">لا يوجد مدرسون مضافون حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {teachers.map((teacher) => {
                      const teacherCourses = courses.filter((c) => c.teacher_id === teacher.id);
                      const freeCoursesCount = teacherCourses.filter((c) => c.price === 0 || c.is_free).length;

                      return (
                        <div
                          key={teacher.id}
                          onClick={() => setSelectedTeacherId(teacher.id)}
                          className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-400 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                        >
                          <div className="flex flex-col items-center text-center">
                            {/* ENLARGED PROMINENT TEACHER AVATAR */}
                            <div className="relative shrink-0 mb-4">
                              {teacher.image_data ? (
                                <img
                                  src={teacher.image_data}
                                  alt={teacher.name}
                                  className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl object-cover ring-4 ring-indigo-500/25 group-hover:ring-indigo-600 transition shadow-xl group-hover:scale-105 shrink-0"
                                />
                              ) : (
                                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white font-black text-4xl sm:text-5xl flex items-center justify-center ring-4 ring-indigo-500/25 shadow-xl group-hover:scale-105 shrink-0">
                                  {teacher.name.charAt(0)}
                                </div>
                              )}
                              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-md border-3 border-white">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </span>
                            </div>

                            {/* ENLARGED PROMINENT TEACHER NAME & SPECIALIZATION */}
                            <div className="w-full mb-3">
                              <span className="text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl inline-block mb-2">
                                {teacher.specialization || 'معلم معتمد'}
                              </span>
                              <h3 className="font-black text-slate-900 text-xl sm:text-2xl md:text-3xl group-hover:text-indigo-600 transition truncate leading-tight">
                                {teacher.name}
                              </h3>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 bg-slate-50/90 p-3 rounded-2xl border border-slate-100 w-full text-right">
                              {teacher.bio || 'معلم خبير يقدم شروحات مبسطة واختبارات تفاعلية دورية.'}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4 w-full">
                              <div className="p-2 rounded-2xl bg-indigo-50/70 font-bold text-indigo-700">
                                {teacherCourses.length} كورس
                              </div>
                              <div className="p-2 rounded-2xl bg-emerald-50/70 font-bold text-emerald-700">
                                {freeCoursesCount} مجاني
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold">تصفح الشروحات</span>
                            <span className="text-indigo-600 font-black group-hover:translate-x-[-3px] transition-transform flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl">
                              <span>الكورسات والمحتوى</span>
                              <ChevronLeft className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {(() => {
                  const teacher = teachers.find((t) => t.id === selectedTeacherId);
                  const teacherCourses = courses.filter((c) => c.teacher_id === selectedTeacherId);

                  return (
                    <div>
                      <button
                        onClick={() => setSelectedTeacherId(null)}
                        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-2xl border border-slate-200 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                        <span>الرجوع لكافة المدرسين</span>
                      </button>

                      {/* Teacher Hero Banner */}
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                        {teacher?.image_data ? (
                          <img
                            src={teacher.image_data}
                            alt={teacher.name}
                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover ring-4 ring-indigo-500/25 shadow-xl shrink-0"
                          />
                        ) : (
                          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white font-black text-4xl sm:text-5xl flex items-center justify-center ring-4 ring-indigo-500/25 shadow-xl shrink-0">
                            {teacher?.name.charAt(0)}
                          </div>
                        )}

                        <div className="text-center sm:text-right flex-1">
                          <span className="text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-xl inline-block mb-2 border border-indigo-100">
                            {teacher?.specialization || 'معلم معتمد'}
                          </span>
                          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">{teacher?.name}</h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                            {teacher?.bio || 'يقدم هذا المعلم مجموعة متميزة من الكورسات والامتحانات الدورية.'}
                          </p>
                        </div>
                      </div>

                      {/* Teacher Grade Tabs Filter */}
                      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs mb-6 transition-all duration-300">
                        {['الكل', 'أولى ثانوي', 'ثانية ثانوي', 'ثالثة ثانوي', 'ثانية بكالوريا'].map((gName) => {
                          const count = gName === 'الكل'
                            ? teacherCourses.length
                            : teacherCourses.filter((c) => c.grade === gName).length;
                          const isSelected = selectedTeacherGradeFilter === gName;

                          return (
                            <button
                              key={gName}
                              type="button"
                              onClick={() => setSelectedTeacherGradeFilter(gName)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-black scale-102'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <span>{gName}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                  isSelected ? 'bg-white/20 text-white font-mono' : 'bg-slate-200/70 text-slate-700 font-mono'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Teacher Courses Grid */}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-extrabold text-lg text-slate-900">
                          كورسات الأستاذ {teacher?.name} {selectedTeacherGradeFilter !== 'الكل' && `— ${selectedTeacherGradeFilter}`}
                        </h4>
                        <span className="text-xs font-bold text-slate-500">
                          {
                            teacherCourses.filter((c) =>
                              selectedTeacherGradeFilter === 'الكل' ? true : c.grade === selectedTeacherGradeFilter
                            ).length
                          } كورس
                        </span>
                      </div>

                      {(() => {
                        const filteredTeacherCourses = teacherCourses.filter((c) =>
                          selectedTeacherGradeFilter === 'الكل' ? true : c.grade === selectedTeacherGradeFilter
                        );

                        if (filteredTeacherCourses.length === 0) {
                          return (
                            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 animate-in fade-in duration-300">
                              لا توجد كورسات معروضة لهذا الصف الدراسي حالياً.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 transition-all duration-300">
                            {filteredTeacherCourses.map((c) => {
                              const isEnrolled = enrolledCourseIds.includes(c.id);
                              const isFree = c.price === 0 || c.is_free;

                              return (
                                <div
                                  key={c.id}
                                  className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[290px] sm:min-h-[320px]"
                                >
                                  {/* Teacher Header: Prominently Enlarged Photo & Name */}
                                  <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                                    {teacher?.image_data ? (
                                      <img
                                        src={teacher.image_data}
                                        alt={teacher.name}
                                        className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ring-3 ring-indigo-500/25 shadow-xs shrink-0"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-xs shrink-0">
                                        {teacher ? teacher.name.charAt(0) : 'م'}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[10px] sm:text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-0.5">
                                        المعلم
                                      </span>
                                      <h4 className="font-black text-sm sm:text-base md:text-lg text-slate-900 truncate leading-snug">
                                        {teacher ? `أ. ${teacher.name}` : 'معلم المنصة'}
                                      </h4>
                                      {teacher?.specialization && (
                                        <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">
                                          {teacher.specialization}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Middle Info */}
                                  <div className="flex-1 flex flex-col justify-center py-2 min-h-0">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate flex-1" title={c.title}>
                                        {c.title}
                                      </h5>
                                      {isFree ? (
                                        <span className="text-[10px] sm:text-xs font-black text-emerald-800 bg-emerald-100/90 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                                          <Gift className="w-3 h-3 text-emerald-600" />
                                          مجاني
                                        </span>
                                      ) : (
                                        <span className="text-[10px] sm:text-xs font-black text-indigo-900 bg-amber-400 px-2 py-0.5 rounded-md shadow-xs">
                                          {c.price} ج.م
                                        </span>
                                      )}
                                    </div>
                                    {c.grade && (
                                      <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block truncate">
                                        📚 {c.grade}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom Action */}
                                  <div className="shrink-0 pt-1">
                                    {isEnrolled ? (
                                      <button
                                        onClick={() => {
                                          setViewingCourse(c);
                                          if (c.lessons?.[0]) {
                                            handleSelectLesson(c.lessons[0], c.id);
                                          } else {
                                            setActiveLesson(null);
                                          }
                                        }}
                                        className="w-full py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                      >
                                        <PlayCircle className="w-3.5 h-3.5" />
                                        <span>مشاهدة الكورس</span>
                                      </button>
                                    ) : isFree ? (
                                      <button
                                        onClick={() => handleAddFreeCourse(c.id)}
                                        className="w-full py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                      >
                                        <Gift className="w-3.5 h-3.5" />
                                        <span>إضافة مجاناً</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setActiveTab('activate')}
                                        className="w-full py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-[10px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                      >
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>تفعيل بالكود</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: MY ENROLLED COURSES ===================== */}
        {activeTab === 'my-courses' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">كورساتك المفعلة</h2>
                <p className="text-xs text-slate-500 mt-1">
                  جميع الكورسات التي قمت بتفعيلها بالأكواد أو قمت بإضافتها مجاناً مفتوحة لك دائماً
                </p>
              </div>

              <button
                onClick={() => setActiveTab('activate')}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2 self-start cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>تفعيل كورس جديد بكود</span>
              </button>
            </div>

            {myCourses.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-800 text-base">لا توجد كورسات في حسابك بعد</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto mb-6">
                  عند شراء أي كود من المدرس وإدخاله في صفحة تفعيل الكود، أو إضافة الكورسات المجانية، سيتم فتح الكورس هنا مدى الحياة.
                </p>
                <button
                  onClick={() => setActiveTab('activate')}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  الذهاب إلى صفحة تفعيل الكود
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                {myCourses.map((course) => {
                  const teacher = teachers.find((t) => t.id === course.teacher_id);
                  const courseExams = exams.filter((ex) => ex.course_id === course.id);

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between relative overflow-hidden group min-h-[290px] sm:min-h-[320px]"
                    >
                      {/* Teacher Header: Prominently Enlarged Photo & Name */}
                      <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                        {teacher?.image_data ? (
                          <img
                            src={teacher.image_data}
                            alt={teacher.name}
                            className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ring-3 ring-indigo-500/25 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-xs shrink-0">
                            {teacher ? teacher.name.charAt(0) : 'م'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] sm:text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-0.5">
                            المعلم
                          </span>
                          <h4 className="font-black text-sm sm:text-base md:text-lg text-slate-900 truncate leading-snug">
                            {teacher ? `أ. ${teacher.name}` : 'معلم المنصة'}
                          </h4>
                          {teacher?.specialization && (
                            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block">
                              {teacher.specialization}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Info */}
                      <div className="flex-1 flex flex-col justify-center py-2 min-h-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h5 className="font-black text-slate-900 text-xs sm:text-sm truncate flex-1" title={course.title}>
                            {course.title}
                          </h5>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100/90 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مفعّل
                          </span>
                        </div>
                        {course.grade && (
                          <span className="text-[10px] sm:text-xs text-slate-500 font-semibold block truncate">
                            📚 {course.grade}
                          </span>
                        )}
                        {courseExams.length > 0 && (
                          <span className="text-[10px] sm:text-xs text-indigo-700 font-bold flex items-center gap-1 mt-1">
                            <ClipboardList className="w-3 h-3 text-indigo-600" />
                            <span>{courseExams.length} اختبار متاح</span>
                          </span>
                        )}

                        {/* Course Expiry Countdown Indicator */}
                        {(() => {
                          const studentEnrollment = enrollments.find(
                            (e) => e.student_id === currentUser.id && e.course_id === course.id
                          );
                          if (!studentEnrollment?.expires_at) return null;
                          const expDate = new Date(studentEnrollment.expires_at);
                          const diffMs = expDate.getTime() - new Date().getTime();
                          const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                          return (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>صلاحية الكورس: متبقي {daysLeft === 0 ? 'ينتهي اليوم' : `${daysLeft} يوم`}</span>
                            </span>
                          );
                        })()}

                        {course.prerequisite_lock_enabled && (
                          <span className="text-[9px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-1 mt-1 w-fit">
                            <Lock className="w-2.5 h-2.5 text-amber-700" />
                            <span>نظام الحظر مفعل (50%)</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom Action */}
                      <div className="shrink-0 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setViewingCourse(course);
                            setActiveLesson(course.lessons?.[0] || null);
                          }}
                          className="w-full py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>مشاهدة المحتوى</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3.5: STUDENT EXAM GRADES ===================== */}
        {activeTab === 'exam-grades' && (() => {
          const mySubmissions = examSubmissions.filter((s) => s.student_id === currentUser.id);
          const completedCount = mySubmissions.filter((s) => s.status !== 'pending_review').length;
          const pendingCount = mySubmissions.filter((s) => s.status === 'pending_review').length;

          return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">درجات اختباراتك</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        سجل درجاتك في جميع الامتحانات الإلكترونية والمقالية وملاحظات وتصحيح المدرس
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                    إجمالي الاختبارات: <strong className="text-indigo-600 font-mono font-black">{mySubmissions.length}</strong>
                  </span>
                </div>
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">إجمالي الاختبارات المحلولة</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{mySubmissions.length}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">اختبارات مكتملة ومصححة</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">{completedCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">اختبارات قيد مراجعة المدرس</span>
                    <span className="text-2xl font-black text-amber-600 font-mono">{pendingCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* List of Submissions */}
              {mySubmissions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">لا توجد اختبارات مسجلة بعد</h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto mb-6">
                    عندما تقوم بخوض أي اختبار إلكتروني أو مقالي في كورساتك، ستظهر درجتك الكاملة وحالة التصحيح هنا تلقائياً.
                  </p>
                  <button
                    onClick={() => setActiveTab('my-courses')}
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    الانتقال إلى كورساتي للبدء
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySubmissions.map((sub) => {
                    const courseObj = courses.find((c) => c.id === sub.course_id);
                    const teacherObj = teachers.find((t) => t.id === sub.teacher_id);
                    const isPending = sub.status === 'pending_review';
                    const hasEssay = sub.answers_essay && Object.keys(sub.answers_essay).length > 0;
                    const essayGradesKeys = sub.essay_grades ? Object.keys(sub.essay_grades) : [];
                    const isViewingDetails = viewingEssayFeedback?.id === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                              isPending
                                ? 'bg-amber-100 text-amber-700'
                                : sub.percentage >= 50
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {isPending ? <Clock className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-black text-slate-900 text-sm sm:text-base">{sub.exam_title}</h4>
                                {sub.assigned_model_name && (
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {sub.assigned_model_name}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                كورس: <span className="font-bold text-slate-700">{sub.course_title || courseObj?.title || 'كورس تعليمي'}</span>
                                {teacherObj && (
                                  <span className="mr-2"> • المعلم: <strong className="text-indigo-600">أ. {teacherObj.name}</strong></span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Grade & Status Badge */}
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-black text-xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                <span>تتم المراجعة</span>
                              </span>
                            ) : (
                              <div className="text-left sm:text-right">
                                <div className="text-xs font-black text-slate-500">الدرجة النهائية:</div>
                                <div className="text-base sm:text-lg font-black font-mono text-indigo-700">
                                  {sub.score} / {sub.total_points}
                                  <span className={`mr-2 text-xs px-2 py-0.5 rounded-md ${
                                    sub.percentage >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {sub.percentage}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Submission Metadata */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>تاريخ ووقت الحل: {sub.submitted_at}</span>
                          </span>

                          {hasEssay && (
                            <button
                              type="button"
                              onClick={() => setViewingEssayFeedback(isViewingDetails ? null : sub)}
                              className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>{isViewingDetails ? 'إخفاء تفاصيل المقالي' : 'عرض تفاصيل وتصحيح المقالي'}</span>
                              {isViewingDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {/* Status Explanation Box */}
                        {isPending && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-black mb-0.5">اختبار قيد المراجعة:</strong>
                              يحتوي هذا الاختبار على أسئلة مقالية يقوم المعلم بمراجعتها يدوياً حالياً، وتحديد الإجابة النموذجية والدرجة المستحقة وتوضيح سبب الدرجة، وستظهر نتيجتك فور اعتمادها.
                            </div>
                          </div>
                        )}

                        {/* Expandable Essay Answers and Teacher Feedback Section */}
                        {hasEssay && isViewingDetails && (
                          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                            <h5 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                              <FileEdit className="w-4 h-4 text-indigo-600" />
                              <span>تفاصيل الأسئلة المقالية وإجاباتك وملاحظات المعلم:</span>
                            </h5>

                            {Object.entries(sub.answers_essay || {}).map(([qId, ansText], idx) => {
                              const gradeInfo = sub.essay_grades?.[qId];

                              return (
                                <div key={qId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between font-bold text-slate-700">
                                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-indigo-700">
                                      سؤال مقالي {idx + 1}
                                    </span>
                                    {gradeInfo ? (
                                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        الدرجة الممنوحة: {gradeInfo.score} / {gradeInfo.max_points}
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        قيد التصحيح
                                      </span>
                                    )}
                                  </div>

                                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                                    <span className="text-slate-400 font-bold block mb-1">إجابتك المسجلة:</span>
                                    <p className="text-slate-900 leading-relaxed font-medium whitespace-pre-wrap">{ansText || '—'}</p>
                                  </div>

                                  {gradeInfo?.model_answer && (
                                    <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                                      <span className="text-emerald-800 font-bold block mb-1">الإجابة النموذجية المعتمدة من المعلم:</span>
                                      <p className="text-emerald-950 leading-relaxed font-semibold whitespace-pre-wrap">{gradeInfo.model_answer}</p>
                                    </div>
                                  )}

                                  {gradeInfo?.teacher_notes && (
                                    <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200">
                                      <span className="text-indigo-800 font-bold block mb-1">سبب منح الدرجة وملاحظات المعلم:</span>
                                      <p className="text-indigo-950 leading-relaxed font-semibold whitespace-pre-wrap">{gradeInfo.teacher_notes}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}


        {activeTab === 'activate' && (
          <div className="max-w-2xl mx-auto py-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">تفعيل كورس باستخدام الكود</h2>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  أدخل كود التفعيل المكوّن من أرقام وحروف. سيقوم النظام بالتعرف على الكورس تلقائياً، وحرق الكود حتى لا يستخدم مرة أخرى، وفتح الكورس في حسابك مدى الحياة.
                </p>
              </div>

              {activationResult && (
                <div
                  className={`p-4 rounded-2xl mb-6 text-xs font-bold flex items-start gap-3 ${
                    activationResult.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {activationResult.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div className="leading-relaxed">{activationResult.message}</div>
                </div>
              )}

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    كود التفعيل (من 8 إلى 12 حرف ورقم):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: PHY-X9A7K أو كود الكورس"
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-center font-mono font-black text-base tracking-wider outline-none transition uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCode}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCode ? (
                    <span>جاري التحقق وتفعيل الكورس...</span>
                  ) : (
                    <>
                      <span>تفعيل الكود وفتح الكورس الآن</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: PROFILE ===================== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto py-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900">{currentUser.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.phone}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                  <span className="text-slate-500 font-bold">رقم هاتف الطالب:</span>
                  <span className="font-mono font-bold text-slate-900">{currentUser.phone || '—'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                  <span className="text-slate-500 font-bold">رقم هاتف ولي الأمر:</span>
                  <span className="font-mono font-bold text-indigo-700">{currentUser.parent_phone || 'غير مسجل'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                  <span className="text-slate-500 font-bold">الصف الدراسي:</span>
                  <span className="font-bold text-slate-900">{currentUser.grade || '—'}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                  <span className="text-slate-500 font-bold">عدد الكورسات المفعلة:</span>
                  <span className="font-bold text-emerald-700">{myCourses.length} كورس</span>
                </div>
              </div>

              {/* Dedicated Support & Social Media Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-black text-slate-700 block">
                  فرق الدعم الفني وروابط التواصل وقنوات المنصة:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. تيم الدعم العلمي */}
                  <button
                    type="button"
                    onClick={() => setSupportModalType('academic')}
                    className="p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer group text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-black text-xs text-indigo-950">الدعم العلمي</span>
                    <span className="text-[10px] text-indigo-600 font-medium">الاستفسارات والمناهج</span>
                  </button>

                  {/* 2. تيم الدعم الفني */}
                  <button
                    type="button"
                    onClick={() => setSupportModalType('technical')}
                    className="p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer group text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Headphones className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-black text-xs text-emerald-950">الدعم الفني</span>
                    <span className="text-[10px] text-emerald-600 font-medium">الأكواد ومشاكل التشغيل</span>
                  </button>

                  {/* 3. زر موقع السوشيال ميديا المجمع (الخارجي بدون يوتيوب) */}
                  <a
                    href={SOCIAL_HUB_URL || '#'}
                    target={SOCIAL_HUB_URL ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!SOCIAL_HUB_URL) {
                        e.preventDefault();
                        setSupportModalType('social');
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100 border border-sky-200 text-sky-900 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer group text-center"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Share2 className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-xs text-sky-950">السوشيال ميديا</span>
                      <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <span className="text-[10px] text-sky-600 font-medium">موقع روابط التواصل الخارجي</span>
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onLogout}
                  className="w-full py-3 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Course Viewer & Player Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-['Cairo']" dir="rtl">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    كورس مفعّل ومتاح
                  </span>
                  {viewingCourse.prerequisite_lock_enabled ? (
                    <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 border border-amber-200">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      نظام الحظر مفعل: يتطلب 50% لفتح ما بعد كل اختبار
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 border border-slate-200">
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      فك الحظر: كل المحاضرات والحلول مفتوحة
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900">{viewingCourse.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  المعلم: {teachers.find((t) => t.id === viewingCourse.teacher_id)?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingCourse(null);
                  setActiveLesson(null);
                }}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dynamic Content Display (Video Player / Iframe / File / Link) */}
            {activeLesson ? (
              <div className="mb-6 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 block">المحتوى المعروض حالياً:</span>
                    <h4 className="font-black text-base text-slate-900">{activeLesson.title}</h4>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white border text-slate-600">
                    {activeLesson.content_type === 'embed_video' && 'فيديو إمبيد'}
                    {activeLesson.content_type === 'iframe' && 'آيفريم'}
                    {activeLesson.content_type === 'link' && 'رابط خارجي'}
                    {activeLesson.content_type === 'file' && 'مذكرة / ملف'}
                    {activeLesson.content_type === 'quiz' && 'اختبار'}
                  </span>
                </div>

                {/* 1. Embed Video Player */}
                {activeLesson.content_type === 'embed_video' && (
                  <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-lg border border-slate-200">
                    <iframe
                      src={getEmbedVideoUrl(activeLesson.url)}
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* 2. Iframe Content */}
                {activeLesson.content_type === 'iframe' && (
                  <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-200">
                    <iframe
                      src={activeLesson.url}
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                )}

                {/* 3. Link Content */}
                {activeLesson.content_type === 'link' && (
                  <div className="p-8 rounded-3xl bg-indigo-50/70 border border-indigo-100 text-center space-y-3">
                    <ExternalLink className="w-10 h-10 text-indigo-600 mx-auto" />
                    <h5 className="font-extrabold text-slate-900 text-sm">رابط المحتوى الخارجي</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">{activeLesson.description || 'اضغط لفتح الرابط الخارجي المرفق بالدرس.'}</p>
                    <a
                      href={activeLesson.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md"
                    >
                      <span>فتح الرابط في نافذة جديدة</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* 4. File / PDF Content */}
                {activeLesson.content_type === 'file' && (
                  <div className="p-8 rounded-3xl bg-emerald-50/70 border border-emerald-100 text-center space-y-3">
                    <FileText className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h5 className="font-extrabold text-slate-900 text-sm">
                      {activeLesson.file_name || 'ملف مرفق بالدرس'}
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">{activeLesson.description || 'يمكنك تحميل أو فتح المذكرة بصيغة PDF.'}</p>
                    {activeLesson.file_data ? (
                      <a
                        href={activeLesson.file_data}
                        download={activeLesson.file_name || 'lesson-document.pdf'}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md"
                      >
                        <span>تحميل الملف الآن</span>
                        <FileText className="w-4 h-4" />
                      </a>
                    ) : activeLesson.url ? (
                      <a
                        href={activeLesson.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md"
                      >
                        <span>فتح رابط الملف</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : null}
                  </div>
                )}

                {/* 5. Quiz / Exam Content */}
                {activeLesson.content_type === 'quiz' && (() => {
                  const targetExam = exams.find((ex) => 
                    (activeLesson.quiz_id && ex.id === activeLesson.quiz_id) || 
                    ex.course_id === viewingCourse.id
                  );
                  const studentSubmission = targetExam ? examSubmissions.find((s) => s.exam_id === targetExam.id && s.student_id === currentUser.id) : null;

                  return (
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/20">
                        <ClipboardList className="w-7 h-7" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 text-base sm:text-lg">
                          {targetExam ? targetExam.title : activeLesson.title}
                        </h5>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          {targetExam?.description || activeLesson.description || 'اختبار إلكتروني تفاعلي لقياس استيعابك للمحاضرة.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600">
                        <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200">
                          ⏱️ المدة: {targetExam?.duration_minutes || activeLesson.duration_minutes || 30} دقيقة
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200">
                          ❓ عدد الأسئلة: {targetExam?.questions?.length || 'متعدد'}
                        </span>
                        {targetExam?.total_points && (
                          <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200">
                            🎯 إجمالي الدرجات: {targetExam.total_points}
                          </span>
                        )}
                      </div>

                      {studentSubmission ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-md mx-auto">
                          <div className="text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>لقد أنهيت هذا الاختبار بالفعل!</span>
                          </div>
                          <div className="text-sm font-black text-slate-900">
                            درجتك: <span className="text-emerald-600">{studentSubmission.score}</span> من {studentSubmission.total_points} ({studentSubmission.percentage}%)
                          </div>
                          {targetExam && (
                            <button
                              type="button"
                              onClick={() => handleStartExam(targetExam)}
                              className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            >
                              إعادة حل الاختبار للتدريب
                            </button>
                          )}
                        </div>
                      ) : targetExam ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleStartExam(targetExam)}
                            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 active:scale-98 transition flex items-center gap-2 mx-auto cursor-pointer"
                          >
                            <ClipboardList className="w-4 h-4" />
                            <span>بدء حل الاختبار الإلكتروني الآن</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl inline-block">
                          جاري تجهيز أسئلة هذا الاختبار من قِبل المعلم.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="aspect-video bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-white mb-6 p-6 text-center">
                <PlayCircle className="w-14 h-14 text-indigo-400 mb-3" />
                <h4 className="font-extrabold text-base">مرحباً بك في كورس {viewingCourse.title}</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  اختر أحد الدروس أو الامتحانات من القائمة بالأسفل لبدء المشاهدة أو خوض الاختبار.
                </p>
              </div>
            )}

            {/* Ladder Navigation Controls (Next / Previous Step) */}
            {activeLesson && (() => {
              const allCourseLessons = viewingCourse.lessons || [];
              const currentLessonIndex = allCourseLessons.findIndex((l) => l.id === activeLesson.id);
              const hasPrevLesson = currentLessonIndex > 0;
              const hasNextLesson = currentLessonIndex >= 0 && currentLessonIndex < allCourseLessons.length - 1;

              return (
                <div className="flex items-center justify-between mb-6 p-3 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-xs font-bold">
                  <button
                    onClick={() => {
                      if (hasPrevLesson) setActiveLesson(allCourseLessons[currentLessonIndex - 1]);
                    }}
                    disabled={!hasPrevLesson}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>المحاضرة السابقة</span>
                  </button>

                  <span className="text-[11px] text-slate-600 font-mono bg-white px-3 py-1 rounded-xl border border-slate-200">
                    درجة {currentLessonIndex + 1} من {allCourseLessons.length} على السلّم
                  </span>

                  {(() => {
                    const nextLesson = hasNextLesson ? allCourseLessons[currentLessonIndex + 1] : null;
                    const isNextLocked = nextLesson ? isLessonLocked(nextLesson, viewingCourse) : false;

                    return (
                      <button
                        onClick={() => {
                          if (nextLesson) handleSelectLesson(nextLesson, viewingCourse.id);
                        }}
                        disabled={!hasNextLesson}
                        className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isNextLocked
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isNextLocked && <Lock className="w-3.5 h-3.5" />}
                        <span>{isNextLocked ? 'المحاضرة التالية (مقفولة)' : 'المحاضرة التالية'}</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    );
                  })()}
                </div>
              );
            })()}

            {/* ================= CURRICULUM ACCORDION FOLDERS & LADDER ================= */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>سلّم المنهج والمحاضرات المنظّمة:</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  {(viewingCourse.lessons || []).length} محاضرة متاحة
                </span>
              </div>

              {/* Recursive Folder Accordion Renderer Supporting Nested Accordions */}
              {(() => {
                const renderStudentFolderAccordion = (fld: CourseFolder, depth: number = 0): React.ReactNode => {
                  const folderLessons = (viewingCourse.lessons || []).filter(
                    (l) => l.folder_id === fld.id
                  );
                  const subFolders = (viewingCourse.folders || []).filter((f) => f.parent_id === fld.id);
                  const isOpen = studentExpandedFolders[fld.id] !== false; // open by default

                  return (
                    <div
                      key={fld.id}
                      className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
                        depth > 0
                          ? 'mr-3 sm:mr-6 border-indigo-200/90 bg-indigo-50/20 shadow-2xs mt-3'
                          : 'border-slate-200/90 bg-white shadow-xs'
                      }`}
                    >
                      {/* Folder Accordion Header */}
                      <div
                        onClick={() => toggleStudentFolder(fld.id)}
                        className={`p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none transition ${
                          depth > 0 ? 'bg-indigo-50/60 hover:bg-indigo-100/50' : 'bg-slate-50/90 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                              depth > 0 ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {isOpen ? (
                              <FolderOpen className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Folder className="w-4 h-4 text-indigo-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-black text-slate-900 text-sm">{fld.title}</h5>
                              {depth > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                  مجلد فرعي
                                </span>
                              )}
                              {folderLessons.length === 0 && subFolders.length === 0 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  مجلد فارغ
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {folderLessons.length} محتوى {subFolders.length > 0 && `• ${subFolders.length} مجلد`}
                                </span>
                              )}
                            </div>
                            {fld.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{fld.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Folder Body: Ladder Stepper and Nested Folders */}
                      {isOpen && (
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-4">
                          {/* Direct Lessons in this folder */}
                          {folderLessons.length > 0 && (
                            <div className="relative pr-6">
                              <div className="absolute right-3.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-500 via-violet-300 to-indigo-100"></div>

                              <div className="space-y-3">
                                {folderLessons.map((item, idx) => {
                                  const isActive = activeLesson?.id === item.id;
                                  const isLocked = isLessonLocked(item, viewingCourse);
                                  const hasViewed = lessonViews?.some(
                                    (lv) => lv.student_id === currentUser.id && lv.lesson_id === item.id
                                  );

                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => handleSelectLesson(item, viewingCourse.id)}
                                      className={`relative flex items-center justify-between gap-4 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-xs ${
                                        isLocked
                                          ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/70 text-slate-600'
                                          : isActive
                                          ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-bold shadow-xs'
                                          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
                                      }`}
                                    >
                                      <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center ${
                                        isLocked ? 'border-amber-400' : 'border-indigo-600'
                                      }`}>
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isLocked ? 'bg-amber-500' : isActive ? 'bg-indigo-600' : 'bg-slate-300'
                                          }`}
                                        ></div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-xl font-black flex items-center justify-center text-[10px] ${
                                          isLocked ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className={`font-black ${isLocked ? 'text-slate-700' : 'text-slate-900'}`}>{item.title}</span>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                              {item.content_type === 'embed_video' && '🎬 فيديو'}
                                              {item.content_type === 'iframe' && '🌐 آيفريم'}
                                              {item.content_type === 'link' && '🔗 رابط'}
                                              {item.content_type === 'file' && '📄 ملف'}
                                              {item.content_type === 'quiz' && '📝 كويز'}
                                            </span>
                                            {isLocked && (
                                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                                <Lock className="w-2.5 h-2.5" />
                                                <span>مقفول (يتطلب 50%)</span>
                                              </span>
                                            )}
                                            {hasViewed && (
                                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                                <Check className="w-2.5 h-2.5" />
                                                <span>تم الاستماع</span>
                                              </span>
                                            )}
                                          </div>
                                          {item.description && (
                                            <span className="block text-[10px] text-slate-400 mt-0.5">
                                              {item.description}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                                        {item.duration_minutes && <span>{item.duration_minutes} د</span>}
                                        {isLocked ? (
                                          <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
                                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                                            <span>مقفول</span>
                                          </div>
                                        ) : (
                                          <PlayCircle
                                            className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Nested Sub-Folders Recursively */}
                          {subFolders.length > 0 && (
                            <div className="space-y-3 pt-2">
                              {subFolders.map((subFld) => renderStudentFolderAccordion(subFld, depth + 1))}
                            </div>
                          )}

                          {folderLessons.length === 0 && subFolders.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                              📂 هذا المجلد فارغ حالياً - سيقوم المعلم بنشر المحاضرات والملفات بداخله قريباً.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                };

                const rootFolders = (viewingCourse.folders || []).filter((f) => !f.parent_id);
                return rootFolders.map((fld) => renderStudentFolderAccordion(fld, 0));
              })()}

              {/* 2. Unassigned / General Lectures Ladder */}
              {(() => {
                const generalLessons = (viewingCourse.lessons || []).filter(
                  (l) => !l.folder_id || !viewingCourse.folders?.some((f) => f.id === l.folder_id)
                );

                if (generalLessons.length === 0 && (viewingCourse.folders || []).length > 0) return null;

                return (
                  <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs">
                    <h5 className="font-extrabold text-xs text-slate-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>المحاضرات التمهيدية والعامة ({generalLessons.length})</span>
                    </h5>

                    {generalLessons.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                        يقوم المدرس حالياً برفع وتحديث المحاضرات لهذا الكورس.
                      </div>
                    ) : (
                      <div className="relative pr-6">
                        <div className="absolute right-3.5 top-3 bottom-3 w-0.5 bg-slate-200"></div>

                        <div className="space-y-2.5">
                          {generalLessons.map((item, idx) => {
                            const isActive = activeLesson?.id === item.id;
                            const isLocked = isLessonLocked(item, viewingCourse);
                            const hasViewed = lessonViews?.some(
                              (lv) => lv.student_id === currentUser.id && lv.lesson_id === item.id
                            );

                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectLesson(item, viewingCourse.id)}
                                className={`relative flex items-center justify-between gap-4 p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-xs ${
                                  isLocked
                                    ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/70 text-slate-600'
                                    : isActive
                                    ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-bold shadow-xs'
                                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <div className={`absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center ${
                                  isLocked ? 'border-amber-400' : 'border-slate-400'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-amber-500' : isActive ? 'bg-indigo-600' : 'bg-slate-400'}`}></div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-xl font-black flex items-center justify-center text-[10px] ${
                                    isLocked ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold ${isLocked ? 'text-slate-700' : 'text-slate-800'}`}>{item.title}</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                        {item.content_type === 'embed_video' && '🎬 فيديو'}
                                        {item.content_type === 'iframe' && '🌐 آيفريم'}
                                        {item.content_type === 'link' && '🔗 رابط'}
                                        {item.content_type === 'file' && '📄 ملف'}
                                        {item.content_type === 'quiz' && '📝 كويز'}
                                      </span>
                                      {isLocked && (
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" />
                                          <span>مقفول (يتطلب 50%)</span>
                                        </span>
                                      )}
                                      {hasViewed && (
                                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5" />
                                          <span>تم الاستماع</span>
                                        </span>
                                      )}
                                    </div>
                                    {item.description && (
                                      <span className="block text-[10px] text-slate-400 mt-0.5">{item.description}</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                                  {item.duration_minutes && <span>{item.duration_minutes} د</span>}
                                  {isLocked ? (
                                    <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
                                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                                      <span>مقفول</span>
                                    </div>
                                  ) : (
                                    <PlayCircle className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Exams Available in this Course */}
            {exams.filter((ex) => ex.course_id === viewingCourse.id).length > 0 && (
              <div className="pt-4 border-t border-slate-100 mb-6">
                <h4 className="font-black text-sm text-slate-900 mb-3">
                  امتحانات الكورس التفاعلية:
                </h4>
                <div className="space-y-2.5">
                  {exams
                    .filter((ex) => ex.course_id === viewingCourse.id)
                    .map((exam) => {
                      const studentSub = examSubmissions.find(
                        (s) => s.exam_id === exam.id && s.student_id === currentUser.id
                      );

                      return (
                        <div
                          key={exam.id}
                          className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-4 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-amber-600" />
                              <span className="font-black text-slate-900">{exam.title}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {exam.questions.length} أسئلة • الدرجة الكلية: {exam.total_points}
                            </span>
                          </div>

                          {studentSub ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                                تم الحل: {studentSub.score} / {studentSub.total_points} ({studentSub.percentage}%)
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartExam(exam)}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer"
                            >
                              بدء الاختبار الآن
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setViewingCourse(null);
                  setActiveLesson(null);
                }}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إغلاق المشاهدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Exam Modal for Student */}
      {activeExam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-['Cairo']"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Score Result View (Shown Once Upon Submission) */}
            {examFinishedScore ? (
              examFinishedScore.isEssayPending ? (
                /* Essay Test: Pending Teacher Correction View */
                <div className="text-center py-6 space-y-5 animate-in fade-in duration-200">
                  <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/25">
                    <Clock className="w-10 h-10 animate-pulse" />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-xl">
                      اختبار مقالي • قيد التصحيح والمراجعة
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">{activeExam.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      تم استلام إجاباتك المقالية بنجاح وحفظها في النظام
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-200 max-w-md mx-auto text-right space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>يتم مراجعة الاختبار من قِبل المعلم</span>
                    </div>
                    <p className="text-xs text-amber-950/80 leading-relaxed font-medium">
                      نظراً لاحتواء هذا الاختبار على أسئلة مقالية، سيقوم المعلم بتصحيح إجاباتك يدوياً ورصد درجتك، وتدوين الملاحظات وتوضيح سبب منح الدرجة.
                    </p>
                    <p className="text-xs text-emerald-800 font-bold pt-1">
                      ✓ يمكنك متابعة حالة الاختبار ودرجتك بمجرد اعتمادها من قائمة [درجات اختباراتك].
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveExam(null);
                      setExamFinishedScore(null);
                    }}
                    className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    العودة للكورس
                  </button>
                </div>
              ) : (
                /* Instant Multiple Choice Score View */
                <div className="text-center py-6 space-y-5 animate-in fade-in duration-200">
                  <div
                    className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl ${
                      examFinishedScore.percentage >= 50
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/25'
                        : 'bg-gradient-to-tr from-amber-500 to-rose-600 shadow-rose-500/25'
                    }`}
                  >
                    <Award className="w-10 h-10" />
                  </div>

                  <div>
                    {examFinishedScore.isTimeout && (
                      <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-black flex items-center justify-center gap-2 max-w-sm mx-auto shadow-2xs">
                        <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>⏰ انتهى وقت التايمر المحدد! تم إغلاق الاختبار وتسليم إجاباتك تلقائياً.</span>
                      </div>
                    )}
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                      نتيجة الاختبار الفورية
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">{activeExam.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      تم رصد نتيجتك وحفظها في سجل المعلم بنجاح
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-sm mx-auto">
                    <span className="text-xs text-slate-400 font-bold block mb-1">درجتك في الاختبار</span>
                    <div className="text-4xl font-black text-indigo-700 font-mono">
                      {examFinishedScore.score} / {examFinishedScore.total}
                    </div>
                    <span className="text-sm font-bold text-slate-700 block mt-2">
                      النسبة المئوية: <strong className={`font-mono ${examFinishedScore.percentage >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>{examFinishedScore.percentage}%</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto font-medium">
                    {examFinishedScore.percentage >= 50
                      ? `🎉 ممتاز! لقد اجتزت هذا الاختبار بنجاح بنسبة ${examFinishedScore.percentage}%، وتم فك حظر المحاضرات والدروس التالية في هذا الكورس!`
                      : `⚠️ حصلت على نسبة ${examFinishedScore.percentage}% وهي أقل من درجة الاجتياز (50%). نظراً لتفعيل نظام الحظر في هذا الكورس، يظل المحتوى التالي مقفولاً حتى تعيد الاختبار وتجتازه.`}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {examFinishedScore.percentage < 50 && (
                      <button
                        onClick={() => {
                          const ex = activeExam;
                          setExamFinishedScore(null);
                          handleStartExam(ex);
                        }}
                        className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>إعادة حل الاختبار للنجاح وفتح المحاضرات 🔄</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveExam(null);
                        setExamFinishedScore(null);
                      }}
                      className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                    >
                      العودة للكورس
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Test In-Progress Form */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg">
                        اختبار تفاعلي
                      </span>
                      {activeExamModelName && (
                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                          نموذج: {activeExamModelName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{activeExam.title}</h3>
                    <p className="text-xs text-slate-500">
                      عدد الأسئلة: {activeExam.questions.length} • مدة الاختبار: {activeExam.duration_minutes} دقيقة
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Countdown Timer Badge */}
                    {examTimeRemaining !== null && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm border shadow-2xs ${
                        examTimeRemaining <= 60
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>الوقت:</span>
                        <span className="font-black text-sm">
                          {Math.floor(examTimeRemaining / 60)}:{(examTimeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setActiveExam(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {activeExam.questions.map((q, qIndex) => {
                    const isEssay = q.type === 'essay';

                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                              السؤال {qIndex + 1}
                            </span>
                            {isEssay && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                مقالي
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {q.points} درجة
                          </span>
                        </div>

                        <h5 className="font-bold text-sm text-slate-900 leading-relaxed">{q.question}</h5>

                        {/* Question Attached Image */}
                        {q.image_url && (
                          <div className="my-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <img
                              src={q.image_url}
                              alt={`صورة السؤال ${qIndex + 1}`}
                              className="max-h-80 w-full object-contain bg-slate-50 p-2"
                            />
                          </div>
                        )}

                        {/* Essay Question: Textarea for Student's Written Answer */}
                        {isEssay ? (
                          <div className="pt-2 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              اكتب إجابتك المقالية هنا:
                            </label>
                            <textarea
                              rows={4}
                              value={examEssayAnswers[q.id] || ''}
                              onChange={(e) => setExamEssayAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="اكتب إجابتك بالتفصيل ليقوم المعلم بمراجعتها وتصحيحها..."
                              className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white text-xs font-medium outline-none resize-none leading-relaxed transition"
                            />
                          </div>
                        ) : (
                          /* Multiple Choice Question: Options Radio */
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = examAnswers[q.id] === optIndex;
                              const optImg = q.options_images?.[optIndex];

                              return (
                                <label
                                  key={optIndex}
                                  className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                                    isSelected
                                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-xs'
                                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name={`student_q_${q.id}`}
                                      checked={isSelected}
                                      onChange={() => handleSelectExamOption(q.id, optIndex)}
                                      className="text-indigo-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="font-semibold">{opt}</span>
                                  </div>

                                  {/* Option Attached Image */}
                                  {optImg && (
                                    <div className="mr-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                      <img
                                        src={optImg}
                                        alt={`صورة الخيار ${optIndex + 1}`}
                                        className="max-h-40 w-auto object-contain p-1.5"
                                      />
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    تمت الإجابة عن {Object.keys(examAnswers).length + Object.keys(examEssayAnswers).length} من {activeExam.questions.length} سؤال
                  </span>

                  <button
                    onClick={handleSubmitExamAnswers}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    تسليم الاختبار وإظهار النتيجة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PREREQUISITE LOCK WARNING MODAL ================= */}
      {prerequisiteAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-300 relative text-center space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPrerequisiteAlert(null)}
              className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 border-2 border-amber-200">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 inline-block mb-2">
                🔒 نظام الحظر مفعل في هذا الكورس
              </span>
              <h3 className="text-lg font-black text-slate-900">
                المحتوى مقفول: {prerequisiteAlert.lessonTitle}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                عزيزي الطالب، قام المعلم بتفعيل نظام الحظر في هذا الكورس.
                يجب عليك أولاً خوض اختبار <strong className="text-indigo-700">"{prerequisiteAlert.examTitle}"</strong> وتحقيق درجة نجاح لا تقل عن <strong>50%</strong> لفك القفل ومشاهدة هذا الدرس أو حل الاختبار.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {prerequisiteAlert.exam && (
                <button
                  type="button"
                  onClick={() => {
                    const ex = prerequisiteAlert.exam;
                    const lsn = prerequisiteAlert.examLesson;
                    setPrerequisiteAlert(null);
                    if (lsn) setActiveLesson(lsn);
                    if (ex) handleStartExam(ex);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>الانتقال للاختبار وحله الآن 📝</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPrerequisiteAlert(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5-SECOND CONGRATULATIONS TOAST / MODAL ================= */}
      {congratsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative text-center space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setCongratsModal(null)}
              className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-8 h-8 text-amber-200 animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                🎉 تهانينا! تمت إضافة الكورس بنجاح
              </span>
              <h3 className="text-xl font-black text-slate-900">
                "{congratsModal.courseTitle}"
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {congratsModal.message}
              </p>
            </div>

            {/* 5-second countdown progress bar */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span>تختفي هذه الرسالة تلقائياً خلال:</span>
              <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                {congratsModal.secondsLeft} ثوانٍ
              </span>
            </div>

            <button
              onClick={() => {
                setCongratsModal(null);
                setActiveTab('my-courses');
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              الذهاب لكورساتي الآن
            </button>
          </div>
        </div>
      )}

      {/* ================= SUPPORT & SOCIAL MEDIA MODALS ================= */}
      {supportModalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSupportModalType(null)}
              className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. Academic Support Modal */}
            {supportModalType === 'academic' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">فريق الدعم العلمي ومساعدو المعلمين</h3>
                    <p className="text-xs text-slate-500">جاهزون للرد على كافة أسئلتكم العلمية ومتابعة المناهج والواجبات</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-2">
                  <p className="font-bold">⏰ مواعيد العمل اليومية: من 10:00 صباحاً حتى 10:00 مساءً طوال أيام الأسبوع.</p>
                  <p className="text-slate-600">يمكنك إرسال الأسئلة، المسائل الصعبة، أو طلب إعادة توضيح نقطة معينة في أي محاضرة.</p>
                </div>

                <div className="space-y-2.5">
                  <a
                    href="https://wa.me/201000000001?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%84%D9%85%D9%8A%20%D8%AE%D8%A7%D8%B5%20%D8%A8%D8%A7%D9%84%D9%85%D9%86%D9%87%D8%AC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل عبر واتساب الدعم العلمي (01000000001)</span>
                  </a>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">هاتف الاستفسارات المباشر:</span>
                    <span className="font-mono font-black text-indigo-700">01000000001</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Technical Support Modal */}
            {supportModalType === 'technical' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">فريق الدعم الفني والتقني</h3>
                    <p className="text-xs text-slate-500">حل أي مشكلة في تشغيل الفيديوهات، تفعيل الأكواد، أو حسابك</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 space-y-2">
                  <p className="font-bold">⚡ خدمة سريعة متاحة على مدار 24 ساعة للرد على استفسارات الطلاب التقنية.</p>
                  <p className="text-slate-600">إذا واجهتك أي صعوبة في إدخال كود الكورس أو تفعيل حسابك، راسلنا فوراً وسيتم حلها خلال دقائق.</p>
                </div>

                <div className="space-y-2.5">
                  <a
                    href="https://wa.me/201000000002?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D9%84%D8%AF%D9%8A%20%D9%85%D8%B4%D9%83%D9%84%D8%A9%20%D8%AA%D9%82%D9%86%D9%8A%D8%A9%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%85%D9%86%D8%B5%D8%A9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل عبر واتساب الدعم الفني (01000000002)</span>
                  </a>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">الخط الساخن للدعم الفني:</span>
                    <span className="font-mono font-black text-emerald-700">01000000002</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Social Media Modal */}
            {supportModalType === 'social' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">موقع السوشيال ميديا المجمع</h3>
                    <p className="text-xs text-slate-500">رابط مباشر للموقع المجمع لكافة حسابات وقنوات المنصة الخارجية</p>
                  </div>
                </div>

                {/* Featured External Social Hub Link Card */}
                {getSocialHubUrl() ? (
                  <a
                    href={getSocialHubUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-700 text-white font-bold text-xs flex items-center justify-between shadow-md hover:from-sky-700 hover:to-violet-800 transition-all duration-200 group border border-sky-400"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white text-sky-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="block font-black text-sm text-white">الانتقال إلى موقع السوشيال ميديا المجمع</span>
                          <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                        </div>
                        <span className="text-[11px] text-sky-100 font-mono truncate max-w-[200px] block">{getSocialHubUrl()}</span>
                      </div>
                    </div>
                    <span className="bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl text-white text-xs font-black flex items-center gap-1 transition">
                      <span>زيارة الموقع</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </a>
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-black text-sky-900">
                      <Globe className="w-4 h-4 text-sky-600" />
                      <span>موقع السوشيال ميديا المجمع الخارجي</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      تم ترك مكان الرابط فارغاً كما طلبت. بمجرد تجهيز موقعك الجديد المجمع لكافة روابط السوشيال ميديا، يمكنك وضع الرابط في ملف <code className="bg-white px-1.5 py-0.5 rounded font-mono text-indigo-700 font-bold">src/config.ts</code> أو إدخاله هنا وسينقلك الزر إليه مباشرة بنقرة واحدة.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSaveAndOpenSocialHub} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رابط موقع السوشيال ميديا المجمع:
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-social-hub.com"
                      value={customSocialUrlInput}
                      onChange={(e) => setCustomSocialUrlInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-left focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  {socialHubSavedMsg && (
                    <p className="text-xs font-bold text-emerald-600">✓ تم حفظ رابط الموقع بنجاح وسيتم فتحه الآن</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>حفظ والانتقال للموقع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupportModalType(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                </form>

                {/* Other Official Social Networks (WITHOUT YouTube) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-bold text-xs flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <span className="block font-black text-[11px]">تليجرام</span>
                        <span className="text-[9px] text-slate-500 font-normal">ملخصات وPDF</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-xs flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="block font-black text-[11px]">فيسبوك</span>
                        <span className="text-[9px] text-slate-500 font-normal">المواعيد</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                  </a>

                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-xs flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-700 shrink-0" />
                      <div>
                        <span className="block font-black text-[11px]">تيك توك</span>
                        <span className="text-[9px] text-slate-500 font-normal">نصائح وتريكات</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
