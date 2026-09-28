import React, { useState } from 'react';
import {
  Teacher,
  Course,
  CourseCode,
  CourseFolder,
  Enrollment,
  Lesson,
  LessonContentType,
  Exam,
  ExamSubmission,
  QuizQuestion,
  StudentUser,
  LessonViewLog,
  ExamModel,
  EssayGrade
} from '../types';
import {
  BookOpen,
  KeyRound,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  Upload,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  Video,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  ClipboardList,
  Award,
  Phone,
  Gift,
  Folder,
  FolderPlus,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Layers,
  Eye,
  AlertTriangle,
  FileCode,
  ArrowLeft,
  Settings,
  HelpCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Shuffle,
  UserX,
  UserCheck,
  EyeOff,
  BarChart3,
  Filter,
  Lock,
  Unlock,
  Calendar,
  FileEdit,
  CheckSquare
} from 'lucide-react';

interface TeacherDashboardProps {
  teacher: Teacher;
  courses: Course[];
  codes: CourseCode[];
  enrollments: Enrollment[];
  students: StudentUser[];
  exams: Exam[];
  examSubmissions: ExamSubmission[];
  lessonViews?: LessonViewLog[];
  onAddCourse: (course: Omit<Course, 'id' | 'is_active'>) => void;
  onUpdateCourse?: (courseId: string, updated: Partial<Course>) => void;
  onDeleteCourse: (courseId: string) => void;
  onGenerateCodes: (courseId: string, count: number) => void;
  onDeleteCode: (codeId: string) => void;
  onAddLessonToCourse: (courseId: string, lesson: Omit<Lesson, 'id'>) => void;
  onDeleteLessonFromCourse: (courseId: string, lessonId: string) => void;
  onAddFolderToCourse?: (courseId: string, folderTitle: string, description?: string, parentId?: string) => void;
  onDeleteFolderFromCourse?: (courseId: string, folderId: string) => void;
  onReorderLessons?: (courseId: string, lessons: Lesson[]) => void;
  onAddExam: (exam: Omit<Exam, 'id' | 'created_at'>) => void;
  onDeleteExam: (examId: string) => void;
  onGradeEssaySubmission?: (submissionId: string, essayGrades: { [qId: string]: EssayGrade }) => void;
  onUpdateTeacherProfile: (updated: Partial<Teacher>) => void;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  courses,
  codes,
  enrollments,
  students,
  exams,
  examSubmissions,
  lessonViews = [],
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onGenerateCodes,
  onDeleteCode,
  onAddLessonToCourse,
  onDeleteLessonFromCourse,
  onAddFolderToCourse,
  onDeleteFolderFromCourse,
  onReorderLessons,
  onAddExam,
  onDeleteExam,
  onGradeEssaySubmission,
  onUpdateTeacherProfile,
  onLogout,
}) => {
  // Navigation Tabs: Courses & Content, Lecture Attendance Views, Essay Correction, Codes, Students, Profile
  type DashboardTab = 'courses' | 'lecture-views' | 'essay-grading' | 'codes' | 'students' | 'profile';
  const [activeTab, setActiveTab] = useState<DashboardTab>('courses');

  // Filter Teacher's Own Data
  const teacherCourses = courses.filter((c) => c.teacher_id === teacher.id);
  const teacherCourseIds = teacherCourses.map((c) => c.id);
  const teacherCodes = codes.filter((cd) => teacherCourseIds.includes(cd.course_id));
  const teacherEnrollments = enrollments.filter((e) => teacherCourseIds.includes(e.course_id));
  const teacherExams = exams.filter((ex) => ex.teacher_id === teacher.id || teacherCourseIds.includes(ex.course_id));
  const teacherSubmissions = examSubmissions.filter((sub) => sub.teacher_id === teacher.id || teacherCourseIds.includes(sub.course_id));
  const teacherLessonViews = lessonViews.filter((lv) => teacherCourseIds.includes(lv.course_id));

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Safe In-App Delete Confirmation Modal
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmButtonText?: string;
    onConfirm: () => void;
  } | null>(null);

  const requestDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteConfirmState({
      isOpen: true,
      title,
      message,
      confirmButtonText: 'نعم، حذف نهائياً',
      onConfirm: () => {
        onConfirm();
        setDeleteConfirmState(null);
      },
    });
  };

  // Active Selected Course for Editing / Curriculum Management
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    teacherCourses.length > 0 ? teacherCourses[0].id : null
  );
  const activeCourse = teacherCourses.find((c) => c.id === selectedCourseId) || teacherCourses[0] || null;

  // Student Preview Mode Toggle
  const [isStudentPreviewMode, setIsStudentPreviewMode] = useState(false);
  const [previewActiveLesson, setPreviewActiveLesson] = useState<Lesson | null>(null);

  // Accordion Folders Expanded State (supports parent and sub-folders)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: prev[folderId] === undefined ? false : !prev[folderId],
    }));
  };

  // Inline Folder Creator State (can target root or parent folder)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [targetParentFolderId, setTargetParentFolderId] = useState<string | undefined>(undefined);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Inline Content Suggestion & Creation State (per folder or root)
  const [inlineAddLocation, setInlineAddLocation] = useState<string | null>(null);
  const [inlineAddType, setInlineAddType] = useState<'video' | 'file' | 'quiz' | null>(null);

  // Inline Video Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoType, setVideoType] = useState<LessonContentType>('embed_video');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('30');
  const [videoDescription, setVideoDescription] = useState('');

  // Inline File Form State
  const [fileTitle, setFileTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');

  // Inline Exam Builder State (with images, timer, random order, essay questions, and models pages)
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('20');
  const [examHasTimer, setExamHasTimer] = useState(true);
  const [examDescription, setExamDescription] = useState('');
  const [examRandomizeOrder, setExamRandomizeOrder] = useState(false);
  const [enableExamModels, setEnableExamModels] = useState(false);
  const [examModelsCount, setExamModelsCount] = useState<number>(3); // How many models: e.g. 2, 3, 4, 5
  const [activeModelIndex, setActiveModelIndex] = useState<number>(0);

  // Model names generator (النموذج أ، النموذج ب، النموذج ج، إلخ)
  const getModelName = (index: number): string => {
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
    return `النموذج ${letters[index] || index + 1}`;
  };

  // Distinct questions list for each model page!
  const [modelPagesQuestions, setModelPagesQuestions] = useState<{ [modelIndex: number]: QuizQuestion[] }>({
    0: [
      {
        id: 'q_' + Date.now() + '_m0_1',
        question: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_index: 0,
        points: 1,
        image_url: undefined,
        options_images: ['', '', '', ''],
        model_answer: '',
      },
    ],
  });

  // Base questions when models are not used
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q_' + Date.now() + '_1',
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_index: 0,
      points: 1,
      image_url: undefined,
      options_images: ['', '', '', ''],
      model_answer: '',
    },
  ]);

  // Helper to get questions for active model or standard form
  const getActiveBuilderQuestions = (): QuizQuestion[] => {
    if (enableExamModels) {
      return (
        modelPagesQuestions[activeModelIndex] || [
          {
            id: 'q_' + Date.now() + `_m${activeModelIndex}_1`,
            question: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_index: 0,
            points: 1,
            image_url: undefined,
            options_images: ['', '', '', ''],
            model_answer: '',
          },
        ]
      );
    }
    return examQuestions;
  };

  const updateActiveBuilderQuestions = (questions: QuizQuestion[]) => {
    if (enableExamModels) {
      setModelPagesQuestions((prev) => ({
        ...prev,
        [activeModelIndex]: questions,
      }));
    } else {
      setExamQuestions(questions);
    }
  };

  // Exam Results Modal (Shows who took the exam AND who didn't!)
  const [viewingExamResults, setViewingExamResults] = useState<Exam | null>(null);
  const [examResultsTab, setExamResultsTab] = useState<'submitted' | 'not-submitted'>('submitted');

  // Exam Student-Preview Modal
  const [previewingExamModal, setPreviewingExamModal] = useState<Exam | null>(null);

  // New Course Creator State
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('');
  const [newCourseIsFree, setNewCourseIsFree] = useState(false);
  const [newCourseGrade, setNewCourseGrade] = useState<'أولى ثانوي' | 'ثانية ثانوي' | 'ثالثة ثانوي' | 'ثانية بكالوريا'>('ثالثة ثانوي');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseImageData, setNewCourseImageData] = useState<string | undefined>(undefined);
  // Course Access & Expiry settings
  const [newCourseExpiryType, setNewCourseExpiryType] = useState<'never' | 'fixed_date' | 'duration_days'>('never');
  const [newCourseExpiryDate, setNewCourseExpiryDate] = useState<string>('');
  const [newCourseExpiryDurationDays, setNewCourseExpiryDurationDays] = useState<number>(7);
  const [newCoursePrerequisiteLock, setNewCoursePrerequisiteLock] = useState<boolean>(false);

  // Modal to adjust course settings (Expiry & Prerequisite Lock) on existing course
  const [editingCourseSettings, setEditingCourseSettings] = useState<Course | null>(null);
  const [editCourseExpiryType, setEditCourseExpiryType] = useState<'never' | 'fixed_date' | 'duration_days'>('never');
  const [editCourseExpiryDate, setEditCourseExpiryDate] = useState<string>('');
  const [editCourseExpiryDurationDays, setEditCourseExpiryDurationDays] = useState<number>(7);
  const [editCoursePrerequisiteLock, setEditCoursePrerequisiteLock] = useState<boolean>(false);

  const openEditCourseSettings = (crs: Course) => {
    setEditingCourseSettings(crs);
    setEditCourseExpiryType(crs.expiry_type || 'never');
    setEditCourseExpiryDate(crs.expiry_date || '');
    setEditCourseExpiryDurationDays(crs.expiry_duration_days || 7);
    setEditCoursePrerequisiteLock(!!crs.prerequisite_lock_enabled);
  };

  const handleSaveCourseSettings = () => {
    if (!editingCourseSettings || !onUpdateCourse) return;
    onUpdateCourse(editingCourseSettings.id, {
      expiry_type: editCourseExpiryType,
      expiry_date: editCourseExpiryType === 'fixed_date' ? editCourseExpiryDate : undefined,
      expiry_duration_days: editCourseExpiryType === 'duration_days' ? Number(editCourseExpiryDurationDays) || 7 : undefined,
      prerequisite_lock_enabled: editCoursePrerequisiteLock,
    });
    showToast(`✅ تم تحديث إعدادات وصلاحية كورس "${editingCourseSettings.title}" بنجاح!`);
    setEditingCourseSettings(null);
  };

  // Essay Grading Tab State (Year -> Course -> Essay Questions per Student Account)
  const [selectedEssayGrade, setSelectedEssayGrade] = useState<string>('all');
  const [selectedEssayCourseId, setSelectedEssayCourseId] = useState<string>('');
  const [gradingDrafts, setGradingDrafts] = useState<{
    [submissionId: string]: {
      [questionId: string]: {
        score: number;
        model_answer?: string;
        teacher_notes?: string;
      };
    };
  }>({});

  // Lecture Attendance / Views Tab State
  const [selectedViewCourseId, setSelectedViewCourseId] = useState<string>(teacherCourses[0]?.id || '');
  const [selectedViewLessonId, setSelectedViewLessonId] = useState<string>('');

  // Codes Tab State
  const [codeGenerationCourseId, setCodeGenerationCourseId] = useState<string>(teacherCourses[0]?.id || '');
  const [codeCountToGenerate, setCodeCountToGenerate] = useState<number>(5);
  const [copiedCodeText, setCopiedCodeText] = useState<string | null>(null);

  // Students Tab State
  const [studentCourseFilter, setStudentCourseFilter] = useState<string>('all');
  const [studentSearchText, setStudentSearchText] = useState<string>('');

  // Profile Form State
  const [editName, setEditName] = useState(teacher.name);
  const [editSpec, setEditSpec] = useState(teacher.specialization || '');
  const [editBio, setEditBio] = useState(teacher.bio || '');
  const [editPassword, setEditPassword] = useState(teacher.password || '');
  const [editPhone, setEditPhone] = useState(teacher.phone || '');
  const [editImageData, setEditImageData] = useState<string | undefined>(teacher.image_data);

  // ===================== HANDLERS =====================

  const resetInlineAdd = () => {
    setInlineAddLocation(null);
    setInlineAddType(null);
    setVideoTitle('');
    setVideoUrl('');
    setVideoDescription('');
    setFileTitle('');
    setFileUrl('');
    setFileData(undefined);
    setFileName('');
    setExamTitle('');
    setExamDescription('');
    setExamRandomizeOrder(false);
    setEnableExamModels(false);
    setExamQuestions([
      {
        id: 'q_' + Date.now() + '_1',
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        points: 1,
        image_url: undefined,
        options_images: ['', '', '', ''],
      },
    ]);
  };

  // 1. Create Course
  const handleSaveNewCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const finalPrice = newCourseIsFree ? 0 : Number(newCoursePrice) || 0;
    onAddCourse({
      title: newCourseTitle.trim(),
      price: finalPrice,
      is_free: newCourseIsFree || finalPrice === 0,
      teacher_id: teacher.id,
      grade: newCourseGrade,
      description: newCourseDesc.trim(),
      lessons_count: 0,
      duration_hours: 10,
      image_data: newCourseImageData,
      expiry_type: newCourseExpiryType,
      expiry_date: newCourseExpiryType === 'fixed_date' ? newCourseExpiryDate : undefined,
      expiry_duration_days: newCourseExpiryType === 'duration_days' ? Number(newCourseExpiryDurationDays) || 7 : undefined,
      prerequisite_lock_enabled: newCoursePrerequisiteLock,
    });

    setNewCourseTitle('');
    setNewCoursePrice('');
    setNewCourseIsFree(false);
    setNewCourseDesc('');
    setNewCourseImageData(undefined);
    setNewCourseExpiryType('never');
    setNewCourseExpiryDate('');
    setNewCourseExpiryDurationDays(7);
    setNewCoursePrerequisiteLock(false);
    setIsCreatingCourse(false);
    showToast('🎉 تم إنشاء الكورس الجديد بنجاح! يمكنك الآن إضافة مجلدات ومحتوى بداخله.');
  };

  // 2. Create Folder / Sub-folder Inline
  const handleSaveNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !newFolderTitle.trim()) return;

    if (onAddFolderToCourse) {
      onAddFolderToCourse(activeCourse.id, newFolderTitle.trim(), newFolderDesc.trim(), targetParentFolderId);
    }
    const name = newFolderTitle.trim();
    setNewFolderTitle('');
    setNewFolderDesc('');
    setIsCreatingFolder(false);
    setTargetParentFolderId(undefined);
    showToast(`✅ تم إنشاء مجلد "${name}" بنجاح!`);
  };

  // 3. Save Video/Lecture Inline
  const handleSaveInlineVideo = (e: React.FormEvent, targetFolderId?: string) => {
    e.preventDefault();
    if (!activeCourse || !videoTitle.trim()) return;

    onAddLessonToCourse(activeCourse.id, {
      title: videoTitle.trim(),
      content_type: videoType,
      url: videoUrl.trim(),
      description: videoDescription.trim(),
      duration_minutes: Number(videoDuration) || 30,
      folder_id: targetFolderId && targetFolderId !== 'root' ? targetFolderId : undefined,
    });

    showToast(`🎉 تم نشر المحاضرة "${videoTitle.trim()}" بنجاح!`);
    resetInlineAdd();
  };

  // 4. Save File Inline
  const handleSaveInlineFile = (e: React.FormEvent, targetFolderId?: string) => {
    e.preventDefault();
    if (!activeCourse || !fileTitle.trim()) return;

    onAddLessonToCourse(activeCourse.id, {
      title: fileTitle.trim(),
      content_type: 'file',
      url: fileUrl.trim(),
      file_data: fileData,
      file_name: fileName || fileTitle.trim() + '.pdf',
      description: fileDescription.trim(),
      folder_id: targetFolderId && targetFolderId !== 'root' ? targetFolderId : undefined,
    });

    showToast(`📄 تم إضافة الملف "${fileTitle.trim()}" بنجاح!`);
    resetInlineAdd();
  };

  // 5. Save Exam Inline (with images, timer, random order, essay questions, and models pages)
  const handleSaveInlineExam = (e: React.FormEvent, targetFolderId?: string) => {
    e.preventDefault();
    if (!activeCourse || !examTitle.trim()) return;

    const newExamId = 'ex_' + Date.now();

    let models: ExamModel[] | undefined = undefined;
    let validQuestions: QuizQuestion[] = [];

    if (enableExamModels) {
      // Validate each model page has at least one valid question
      for (let mIdx = 0; mIdx < examModelsCount; mIdx++) {
        const mQuestions = (modelPagesQuestions[mIdx] || []).filter(
          (q) => q.question.trim().length > 0 || q.image_url
        );
        if (mQuestions.length === 0) {
          showToast(`يرجى كتابة سؤال واحد على الأقل في (${getModelName(mIdx)})!`, 'info');
          setActiveModelIndex(mIdx);
          return;
        }
      }

      models = Array.from({ length: examModelsCount }).map((_, mIdx) => {
        const mQuestions = (modelPagesQuestions[mIdx] || []).filter(
          (q) => q.question.trim().length > 0 || q.image_url
        );
        return {
          id: `model_${newExamId}_${mIdx}`,
          name: getModelName(mIdx),
          questions: mQuestions,
        };
      });

      validQuestions = models[0].questions;
    } else {
      validQuestions = examQuestions.filter((q) => q.question.trim().length > 0 || q.image_url);
      if (validQuestions.length === 0) {
        showToast('يرجى كتابة نص سؤال واحد على الأقل أو رفع صورة للسؤال!', 'info');
        return;
      }
    }

    const totalPoints = validQuestions.reduce((acc, q) => acc + (Number(q.points) || 1), 0);

    // 1. Add Exam
    onAddExam({
      title: examTitle.trim(),
      course_id: activeCourse.id,
      teacher_id: teacher.id,
      description: examDescription.trim(),
      duration_minutes: Number(examDuration) || 20,
      has_timer: examHasTimer,
      questions: validQuestions,
      total_points: totalPoints,
      randomize_order: examRandomizeOrder,
      models: models,
    });

    // 2. Add Quiz Lesson in Folder
    onAddLessonToCourse(activeCourse.id, {
      title: examTitle.trim(),
      content_type: 'quiz',
      quiz_id: newExamId,
      description: examDescription.trim(),
      duration_minutes: Number(examDuration) || 20,
      folder_id: targetFolderId && targetFolderId !== 'root' ? targetFolderId : undefined,
    });

    showToast(`📝 تم إنشاء ونشر اختبار "${examTitle.trim()}" بنجاح!`);
    resetInlineAdd();
  };

  // 6. Handle Grading Essay Submissions
  const handleSaveStudentEssayGrading = (sub: ExamSubmission) => {
    if (!onGradeEssaySubmission) return;
    const subDrafts = gradingDrafts[sub.id] || {};

    const finalEssayGrades: { [qId: string]: EssayGrade } = { ...(sub.essay_grades || {}) };
    const targetExam = exams.find((e) => e.id === sub.exam_id);

    Object.entries(sub.answers_essay || {}).forEach(([qId]) => {
      const draft = subDrafts[qId];
      const examQuestion = (targetExam?.questions || []).find((q) => q.id === qId);
      const maxPts = Number(examQuestion?.points) || 5;

      finalEssayGrades[qId] = {
        score: draft?.score !== undefined ? Number(draft.score) : (finalEssayGrades[qId]?.score || 0),
        max_points: maxPts,
        model_answer: draft?.model_answer !== undefined ? draft.model_answer : (finalEssayGrades[qId]?.model_answer || examQuestion?.model_answer || ''),
        teacher_notes: draft?.teacher_notes !== undefined ? draft.teacher_notes : (finalEssayGrades[qId]?.teacher_notes || ''),
      };
    });

    onGradeEssaySubmission(sub.id, finalEssayGrades);
    showToast(`✅ تم اعتماد تصحيح إجابات الطالب ${sub.student_name} بنجاح!`);
  };

  // Move Lesson Up/Down on Ladder
  const handleMoveLadder = (lessonId: string, direction: 'up' | 'down') => {
    if (!activeCourse || !onReorderLessons) return;
    const lessons = [...(activeCourse.lessons || [])];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;
    const temp = lessons[idx];
    lessons[idx] = lessons[targetIdx];
    lessons[targetIdx] = temp;
    onReorderLessons(activeCourse.id, lessons);
    showToast('تم تحديث ترتيب المحاضرة على السلم بنجاح.');
  };

  // Upload Handlers
  const handleCourseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewCourseImageData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!fileTitle) setFileTitle(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onloadend = () => setFileData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleQuestionImageUpload = (qIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = [...getActiveBuilderQuestions()];
        updated[qIdx].image_url = reader.result as string;
        updateActiveBuilderQuestions(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionImageUpload = (qIdx: number, optIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = [...getActiveBuilderQuestions()];
        const optImages = updated[qIdx].options_images ? [...updated[qIdx].options_images!] : ['', '', '', ''];
        optImages[optIdx] = reader.result as string;
        updated[qIdx].options_images = optImages;
        updateActiveBuilderQuestions(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditImageData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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

  // Helper to render a folder and all its nested sub-folders recursively!
  const renderFolderAccordion = (fld: CourseFolder, depth: number = 0) => {
    if (!activeCourse) return null;
    const folderLessons = (activeCourse.lessons || []).filter((l) => l.folder_id === fld.id);
    const subFolders = (activeCourse.folders || []).filter((f) => f.parent_id === fld.id);
    const isExpanded = expandedFolders[fld.id] !== false;
    const isAddingHere = inlineAddLocation === fld.id;

    return (
      <div
        key={fld.id}
        className={`bg-white rounded-3xl border-2 transition-all duration-200 overflow-hidden ${
          depth > 0 ? 'mr-3 sm:mr-6 border-indigo-200/90 shadow-2xs mt-3' : 'border-slate-200/90 shadow-xs'
        }`}
      >
        {/* Folder Header */}
        <div
          onClick={() => toggleFolder(fld.id)}
          className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition ${
            depth > 0 ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'bg-slate-50/80 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                depth > 0 ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {isExpanded ? <FolderOpen className="w-5 h-5 text-indigo-600" /> : <Folder className="w-5 h-5 text-indigo-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-sm sm:text-base">{fld.title}</h4>
                {depth > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                    أكورديون فرعي
                  </span>
                )}
                {folderLessons.length === 0 && subFolders.length === 0 ? (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    مجلد فارغ
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {folderLessons.length} دروس • {subFolders.length} مجلدات فرعية
                  </span>
                )}
              </div>
              {fld.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fld.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Add Nested Sub-folder Button */}
            <button
              type="button"
              onClick={() => {
                setTargetParentFolderId(fld.id);
                setIsCreatingFolder(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="إضافة مجلد فرعي داخل هذا المجلد"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ مجلد داخلي</span>
            </button>

            {/* Delete Folder Button */}
            <button
              type="button"
              onClick={() => {
                requestDelete(
                  'حذف المجلد',
                  `هل أنت متأكد من حذف مجلد "${fld.title}" وجميع مجلداته الفرعية؟ (الدروس بداخل هذا المجلد لن تُحذف بل ستتحول للدروس العامة).`,
                  () => {
                    if (onDeleteFolderFromCourse) {
                      onDeleteFolderFromCourse(activeCourse.id, fld.id);
                    }
                    showToast(`تم حذف مجلد "${fld.title}" بنجاح.`);
                  }
                );
              }}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="حذف هذا المجلد"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Toggle Chevron */}
            <button
              type="button"
              onClick={() => toggleFolder(fld.id)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Folder Body */}
        {isExpanded && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-white space-y-6">
            {/* Nested Sub-folders Recursion */}
            {subFolders.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-indigo-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>المجلدات الفرعية داخل هذا الأكورديون:</span>
                </h5>
                <div className="space-y-3">
                  {subFolders.map((subF) => renderFolderAccordion(subF, depth + 1))}
                </div>
              </div>
            )}

            {/* Lecture Ladder */}
            {folderLessons.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-400 mb-2">
                  المحاضرات والاختبارات المضافة على سلّم هذا المجلد:
                </h5>

                <div className="relative pr-6">
                  <div className="absolute right-3.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-500 via-violet-400 to-indigo-200"></div>

                  <div className="space-y-3">
                    {folderLessons.map((ls, idx) => {
                      const isExam = ls.content_type === 'quiz';
                      const linkedExam = isExam
                        ? teacherExams.find((ex) => ex.id === ls.quiz_id || ex.title === ls.title.replace('اختبار: ', ''))
                        : null;
                      const examSubmissionsCount = linkedExam
                        ? teacherSubmissions.filter((sub) => sub.exam_id === linkedExam.id).length
                        : 0;

                      return (
                        <div
                          key={ls.id}
                          className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-indigo-50/30 hover:border-indigo-200 transition"
                        >
                          {/* Ladder Node */}
                          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-2xs">
                            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-[11px] font-mono shrink-0">
                              درجة {idx + 1}
                            </span>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h6 className="font-extrabold text-slate-900 text-xs sm:text-sm">{ls.title}</h6>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                                  {ls.content_type === 'embed_video' && <>🎬 فيديو إمبيد</>}
                                  {ls.content_type === 'iframe' && <>🌐 كود آيفريم</>}
                                  {ls.content_type === 'link' && <>🔗 رابط خارجي</>}
                                  {ls.content_type === 'file' && <>📄 ملف / مذكرة</>}
                                  {ls.content_type === 'quiz' && <>📝 اختبار إلكتروني</>}
                                </span>

                                {isExam && linkedExam && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                                    {linkedExam.questions?.length || 0} أسئلة • {examSubmissionsCount} طالب حلوا
                                    {linkedExam.randomize_order && ' • عشوائي'}
                                  </span>
                                )}
                              </div>

                              {ls.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ls.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            {isExam && linkedExam && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingExamResults(linkedExam);
                                    setExamResultsTab('submitted');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  title="عرض نتائج ودرجات الطلاب والذين لم يمتحنوا"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>متابعة الطلاب ({examSubmissionsCount})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPreviewingExamModal(linkedExam)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="معاينة أسئلة الاختبار"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {ls.duration_minutes && (
                              <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {ls.duration_minutes} د
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleMoveLadder(ls.id, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-20 cursor-pointer"
                              title="تحريك لأعلى في السلم"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveLadder(ls.id, 'down')}
                              disabled={idx === folderLessons.length - 1}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-20 cursor-pointer"
                              title="تحريك لأسفل في السلم"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                requestDelete(
                                  'حذف المحتوى',
                                  `هل أنت متأكد من حذف "${ls.title}" نهائياً من هذا الكورس؟`,
                                  () => {
                                    onDeleteLessonFromCourse(activeCourse.id, ls.id);
                                    if (ls.quiz_id) onDeleteExam(ls.quiz_id);
                                    showToast(`تم حذف "${ls.title}" بنجاح.`);
                                  }
                                );
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* INLINE SUGGESTION BOX IN PLACE */}
            <div className="pt-3 border-t border-slate-100">
              {!isAddingHere ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white border-2 border-dashed border-indigo-200/80 text-center">
                  <span className="text-xs font-black text-indigo-900 block mb-3">
                    💡 ماذا تريد أن تضيف داخل مجلد "{fld.title}"؟
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setInlineAddLocation(fld.id);
                        setInlineAddType('video');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs shadow-2xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-indigo-600" />
                      <span>🎥 فيديو أو رابط محاضرة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInlineAddLocation(fld.id);
                        setInlineAddType('file');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs shadow-2xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>📄 ملزمة أو ملف PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInlineAddLocation(fld.id);
                        setInlineAddType('quiz');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>📝 اختبار إلكتروني تفاعلي</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* INLINE EXPANDED FORM IN THE SAME PLACE */
                <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-indigo-300 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInlineAddType('video')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          inlineAddType === 'video' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>فيديو / رابط</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineAddType('file')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          inlineAddType === 'file' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>ملزمة / PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineAddType('quiz')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          inlineAddType === 'quiz' ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>اختبار إلكتروني</span>
                      </button>
                    </div>

                    <button type="button" onClick={resetInlineAdd} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* FORM 1: VIDEO */}
                  {inlineAddType === 'video' && (
                    <form onSubmit={(e) => handleSaveInlineVideo(e, fld.id)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المحاضرة *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: شرح قوانين كيرشوف وتطبيقاتها"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-indigo-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">نوع الفيديو / الرابط</label>
                          <select
                            value={videoType}
                            onChange={(e) => setVideoType(e.target.value as LessonContentType)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none bg-white"
                          >
                            <option value="embed_video">رابط يوتيوب أو فيديو مباشر (Embed)</option>
                            <option value="iframe">كود تضمين HTML (Iframe Code)</option>
                            <option value="link">رابط خارجي (Drive, Zoom, إلخ)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">الرابط أو كود التضمين *</label>
                          <input
                            type="text"
                            required
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-indigo-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">المدة التقريبية (بالدقائق)</label>
                          <input
                            type="number"
                            min="1"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={resetInlineAdd} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                          إلغاء
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs">
                          ✓ حفظ وإضافة المحاضرة للمجلد
                        </button>
                      </div>
                    </form>
                  )}

                  {/* FORM 2: FILE */}
                  {inlineAddType === 'file' && (
                    <form onSubmit={(e) => handleSaveInlineFile(e, fld.id)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">اسم الملف / الملزمة *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: مذكرة أسئلة وتمارين الباب الأول"
                            value={fileTitle}
                            onChange={(e) => setFileTitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">رفع ملف PDF من جهازك</label>
                          <div className="relative border-2 border-dashed border-emerald-300 rounded-xl p-2.5 text-center bg-emerald-50/50 cursor-pointer flex items-center justify-center">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleDocumentFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            {fileName ? (
                              <span className="text-xs font-bold text-emerald-800 truncate">✓ {fileName}</span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                <span>اختر ملف PDF من جهازك</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رابط بديل للملف (اختياري)</label>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/..."
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={resetInlineAdd} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                          إلغاء
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs">
                          ✓ حفظ وإضافة الملف للمجلد
                        </button>
                      </div>
                    </form>
                  )}

                  {/* FORM 3: EXAM WITH IMAGES, TIMER, ESSAY / MCQ, AND MULTI-MODEL PAGES */}
                  {inlineAddType === 'quiz' && (() => {
                    const activeQList = getActiveBuilderQuestions();

                    return (
                      <form onSubmit={(e) => handleSaveInlineExam(e, fld.id)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الاختبار *</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: كويز إلكتروني على المحاضرة الأولى والثانية"
                              value={examTitle}
                              onChange={(e) => setExamTitle(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-violet-600"
                            />
                          </div>

                          {/* Timer Duration */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">تايمر الاختبار ⏱️</label>
                              <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                                <input
                                  type="checkbox"
                                  checked={examHasTimer}
                                  onChange={(e) => setExamHasTimer(e.target.checked)}
                                  className="rounded text-indigo-600 focus:ring-0"
                                />
                                <span>تفعيل التايمر</span>
                              </label>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  disabled={!examHasTimer}
                                  value={examDuration}
                                  onChange={(e) => setExamDuration(e.target.value)}
                                  placeholder="20"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-violet-600 disabled:bg-slate-100"
                                />
                                <span className="text-xs font-bold text-slate-600 shrink-0">دقيقة</span>
                              </div>

                              {examHasTimer && (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-bold ml-1">تحديد سريع:</span>
                                  {['10', '15', '20', '30', '45', '60'].map((mins) => (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => setExamDuration(mins)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                        examDuration === mins
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      {mins} د
                                    </button>
                                  ))}
                                </div>
                              )}

                              <span className="text-[10px] text-slate-500 block leading-tight">
                                {examHasTimer
                                  ? '⏱️ عند انتهاء التايمر، يغلق الاختبار عند الطالب تلقائياً ويتم تسليم إجاباته فوراً.'
                                  : 'الاختبار متاح بدون تايمر زمني محدد.'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Randomization & Models Controls */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 space-y-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-violet-950">
                              <input
                                type="checkbox"
                                checked={examRandomizeOrder}
                                onChange={(e) => {
                                  setExamRandomizeOrder(e.target.checked);
                                  if (e.target.checked) setEnableExamModels(false);
                                }}
                                className="rounded text-violet-600 focus:ring-0"
                              />
                              <Shuffle className="w-4 h-4 text-violet-700" />
                              <span>ترتيب عشوائي للأسئلة لكل طالب منعاً للغش</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-950">
                              <input
                                type="checkbox"
                                checked={enableExamModels}
                                onChange={(e) => {
                                  setEnableExamModels(e.target.checked);
                                  if (e.target.checked) setExamRandomizeOrder(false);
                                }}
                                className="rounded text-indigo-600 focus:ring-0"
                              />
                              <Layers className="w-4 h-4 text-indigo-700" />
                              <span>نماذج امتحانات مختلفة (اختبار مختلف لكل نموذج)</span>
                            </label>
                          </div>

                          {/* Multi-Model Configuration & Pages Tabs */}
                          {enableExamModels && (
                            <div className="pt-3 border-t border-indigo-200/80 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className="font-black text-indigo-900 flex items-center gap-1.5">
                                  <span>كم نموذج تريد إنشاءه لهذا الاختبار؟</span>
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {[2, 3, 4, 5].map((cnt) => (
                                    <button
                                      key={cnt}
                                      type="button"
                                      onClick={() => {
                                        setExamModelsCount(cnt);
                                        if (activeModelIndex >= cnt) setActiveModelIndex(0);
                                        // Ensure model questions initialized
                                        setModelPagesQuestions((prev) => {
                                          const copy = { ...prev };
                                          for (let i = 0; i < cnt; i++) {
                                            if (!copy[i] || copy[i].length === 0) {
                                              copy[i] = [
                                                {
                                                  id: 'q_' + Date.now() + `_m${i}_1`,
                                                  question: '',
                                                  type: 'multiple_choice',
                                                  options: ['', '', '', ''],
                                                  correct_index: 0,
                                                  points: 1,
                                                  image_url: undefined,
                                                  options_images: ['', '', '', ''],
                                                },
                                              ];
                                            }
                                          }
                                          return copy;
                                        });
                                      }}
                                      className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                                        examModelsCount === cnt
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                      }`}
                                    >
                                      {cnt} نماذج
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Model Pages Navigation Bar */}
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-indigo-200 overflow-x-auto">
                                {Array.from({ length: examModelsCount }).map((_, mIdx) => {
                                  const count = (modelPagesQuestions[mIdx] || []).length;
                                  const isActive = activeModelIndex === mIdx;

                                  return (
                                    <button
                                      key={mIdx}
                                      type="button"
                                      onClick={() => setActiveModelIndex(mIdx)}
                                      className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                        isActive
                                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                      }`}
                                    >
                                      <span>صفحة {getModelName(mIdx)}</span>
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {count} أسئلة
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                                💡 يمكنك التنقل بين صفحات النماذج أعلاه وكتابة أسئلة مختلفة تماماً في كل صفحة. عند دخول الطالب للاختبار، سيظهر له نموذج عشوائي تلقائياً.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Questions List Header */}
                        <div className="space-y-4 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <ClipboardList className="w-4 h-4 text-violet-600" />
                              <span>
                                {enableExamModels
                                  ? `أسئلة صفحة (${getModelName(activeModelIndex)}) [${activeQList.length} سؤال]:`
                                  : `أسئلة الاختبار (${activeQList.length} سؤال):`}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const newQ: QuizQuestion = {
                                  id: 'q_' + Date.now() + '_' + (activeQList.length + 1),
                                  question: '',
                                  type: 'multiple_choice',
                                  options: ['', '', '', ''],
                                  correct_index: 0,
                                  points: 1,
                                  image_url: undefined,
                                  options_images: ['', '', '', ''],
                                  model_answer: '',
                                };
                                updateActiveBuilderQuestions([...activeQList, newQ]);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ إضافة سؤال</span>
                            </button>
                          </div>

                          {/* Questions Items */}
                          {activeQList.map((q, qIdx) => {
                            const isEssay = q.type === 'essay';

                            return (
                              <div key={q.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                                      السؤال رقم {qIdx + 1}
                                    </span>

                                    {/* Question Type Switcher: MCQ vs Essay */}
                                    <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...activeQList];
                                          updated[qIdx].type = 'multiple_choice';
                                          updateActiveBuilderQuestions(updated);
                                        }}
                                        className={`px-2 py-0.5 rounded-md transition ${
                                          !isEssay ? 'bg-indigo-600 text-white font-black' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        اختياري (تلقائي)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...activeQList];
                                          updated[qIdx].type = 'essay';
                                          updateActiveBuilderQuestions(updated);
                                        }}
                                        className={`px-2 py-0.5 rounded-md transition ${
                                          isEssay ? 'bg-amber-500 text-white font-black' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        مقالي (كتابة)
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="text-slate-500 font-bold">الدرجة:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={q.points}
                                        onChange={(e) => {
                                          const updated = [...activeQList];
                                          updated[qIdx].points = Number(e.target.value) || 1;
                                          updateActiveBuilderQuestions(updated);
                                        }}
                                        className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white outline-none"
                                      />
                                    </div>

                                    {activeQList.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => updateActiveBuilderQuestions(activeQList.filter((_, i) => i !== qIdx))}
                                        className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>حذف</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Question text & image upload */}
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder={isEssay ? `اكتب نص السؤال المقالي رقم ${qIdx + 1}...` : `اكتب نص السؤال الاختياري رقم ${qIdx + 1}...`}
                                    value={q.question}
                                    onChange={(e) => {
                                      const updated = [...activeQList];
                                      updated[qIdx].question = e.target.value;
                                      updateActiveBuilderQuestions(updated);
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none bg-white focus:border-violet-600"
                                  />

                                  {/* Question Image Input */}
                                  <div className="flex items-center gap-3">
                                    <label className="relative px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>{q.image_url ? 'تغيير صورة السؤال' : 'إرفاق صورة للسؤال (اختياري)'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleQuestionImageUpload(qIdx, e)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      />
                                    </label>
                                    {q.image_url && (
                                      <div className="flex items-center gap-2">
                                        <img src={q.image_url} alt="معاينة صورة السؤال" className="w-10 h-8 rounded-lg object-cover border" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...activeQList];
                                            updated[qIdx].image_url = undefined;
                                            updateActiveBuilderQuestions(updated);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-xs"
                                        >
                                          ✕ إزالة
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* ESSAY QUESTION: Model Answer Input */}
                                {isEssay ? (
                                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs">
                                    <label className="block font-bold text-amber-950">
                                      الإجابة النموذجية المعتمدة (استرشادية لتصحيحك لاحقاً في قائمة تصحيح المقالي):
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={q.model_answer || ''}
                                      onChange={(e) => {
                                        const updated = [...activeQList];
                                        updated[qIdx].model_answer = e.target.value;
                                        updateActiveBuilderQuestions(updated);
                                      }}
                                      placeholder="اكتب الإجابة النموذجية الصحيحة لهذا السؤال..."
                                      className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-medium outline-none resize-none leading-relaxed"
                                    />
                                    <span className="text-[10px] text-amber-800 font-semibold block">
                                      📝 الطالب سيجيب نصياً، ولن تظهر الدرجة له فوراً بل ستظهر له حالة (تتم المراجعة) حتى تقوم بتصحيحها ورصد الدرجة وكتابة سببها في قسم تصحيح المقالي.
                                    </span>
                                  </div>
                                ) : (
                                  /* MULTIPLE CHOICE: 4 Choices with Choice Images */
                                  <div className="space-y-2">
                                    <span className="text-[11px] font-bold text-slate-500 block">
                                      الاختيارات الأربعة (اضغط الدائرة لتحديد الإجابة الصحيحة):
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      {q.options.map((opt, optIdx) => {
                                        const isCorrect = q.correct_index === optIdx;
                                        const optImage = q.options_images?.[optIdx];

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`flex flex-col gap-1.5 p-2 rounded-xl border transition ${
                                              isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...activeQList];
                                                  updated[qIdx].correct_index = optIdx;
                                                  updateActiveBuilderQuestions(updated);
                                                }}
                                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                                                  isCorrect ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 hover:border-emerald-500'
                                                }`}
                                                title="حدد هذه كإجابة صحيحة"
                                              >
                                                {isCorrect && <Check className="w-3 h-3" />}
                                              </button>

                                              <input
                                                type="text"
                                                placeholder={`الخيار ${optIdx + 1}...`}
                                                value={opt}
                                                onChange={(e) => {
                                                  const updated = [...activeQList];
                                                  updated[qIdx].options[optIdx] = e.target.value;
                                                  updateActiveBuilderQuestions(updated);
                                                }}
                                                className="w-full px-2 py-1 text-xs font-medium outline-none bg-transparent"
                                              />

                                              {/* Option Image Upload */}
                                              <label className="relative p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer" title="إرفاق صورة لهذا الخيار">
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleOptionImageUpload(qIdx, optIdx, e)}
                                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                              </label>
                                            </div>

                                            {optImage && (
                                              <div className="flex items-center gap-2 pr-6">
                                                <img src={optImage} alt="صورة الخيار" className="w-8 h-8 rounded-md object-cover border" />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...activeQList];
                                                    const optImages = updated[qIdx].options_images ? [...updated[qIdx].options_images!] : ['', '', '', ''];
                                                    optImages[optIdx] = '';
                                                    updated[qIdx].options_images = optImages;
                                                    updateActiveBuilderQuestions(updated);
                                                  }}
                                                  className="text-rose-500 text-[10px]"
                                                >
                                                  إزالة الصورة
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                          <button type="button" onClick={resetInlineAdd} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                            إلغاء
                          </button>
                          <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20">
                            ✓ نشر الاختبار داخل المجلد الآن
                          </button>
                        </div>
                      </form>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (teacher.is_blocked) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-['Cairo'] antialiased" dir="rtl">
        <div className="max-w-lg w-full bg-slate-800/95 border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center backdrop-blur-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
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
              🚫 تم حظر حسابك ولوحة التحكم الخاصة بك مؤقتاً بواسطة إدارة المنصة.
            </p>
            <p>
              🔒 لا يمكنك رفع محاضرات أو إضافة كورسات أو متابعة الطلاب حتى يتم فك الحظر.
            </p>
            <p className="text-emerald-400 font-bold pt-1">
              ✓ جميع كورساتك ومحاضراتك والطلاب المشتركين معك محفوظة بالكامل ولم يُحذف منها أي شيء، وستعود كما كانت فور فك الحظر بواسطة الإدارة.
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Cairo'] antialiased" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
                : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/20 rounded-lg transition mr-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmState?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-1.5">{deleteConfirmState.title}</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">{deleteConfirmState.message}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={deleteConfirmState.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteConfirmState.confirmButtonText || 'نعم، حذف'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-xl sm:text-2xl overflow-hidden shrink-0 ring-3 ring-indigo-500/25">
            {teacher.image_data ? (
              <img src={teacher.image_data} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              teacher.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-2xl text-slate-900 leading-tight">
                أهلاً، أستاذ {teacher.name}
              </h1>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full border border-indigo-100">
                {teacher.specialization || 'معلم معتمد'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">لوحة تحكم المعلم لإدارة الكورسات، الحضور، والامتحانات</p>
          </div>
        </div>

        {/* 6 Focused Navigation Tabs */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl text-xs font-bold gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => {
              setActiveTab('courses');
              setIsStudentPreviewMode(false);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'courses' ? 'bg-white text-indigo-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>كورساتي والمحتوى ({teacherCourses.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('lecture-views');
              setIsStudentPreviewMode(false);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'lecture-views' ? 'bg-white text-indigo-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>مشاهدة المحاضرات 📊</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('essay-grading');
              setIsStudentPreviewMode(false);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'essay-grading' ? 'bg-white text-amber-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-4 h-4 text-amber-600" />
            <span>تصحيح المقالي</span>
            {teacherSubmissions.filter((s) => s.status === 'pending_review').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px] font-black animate-pulse">
                {teacherSubmissions.filter((s) => s.status === 'pending_review').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('codes');
              setIsStudentPreviewMode(false);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'codes' ? 'bg-white text-indigo-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>الأكواد ({teacherCodes.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('students');
              setIsStudentPreviewMode(false);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'students' ? 'bg-white text-indigo-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الطلاب المشتركون ({teacherEnrollments.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile');
              setIsStudentPreviewMode(false);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>الملف الشخصي</span>
          </button>
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1 animate-in fade-in duration-200">
        {/* ===================== TAB 1: COURSES & CONTENT ===================== */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-slate-900 text-lg">
                      {activeCourse ? activeCourse.title : 'إدارة الكورسات'}
                    </h2>
                    {activeCourse?.grade && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        {activeCourse.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeCourse
                      ? `سعر الكورس: ${activeCourse.is_free || activeCourse.price === 0 ? 'مجاني' : `${activeCourse.price} ج.م`} • ${(activeCourse.folders || []).length} مجلدات • ${(activeCourse.lessons || []).length} درس ومحتوى`
                      : 'أضف أول كورس لك وابدأ بتنظيم مجلداته ومحتواه'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {teacherCourses.length > 1 && (
                  <select
                    value={activeCourse?.id || ''}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setIsStudentPreviewMode(false);
                      setPreviewActiveLesson(null);
                      resetInlineAdd();
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 hover:bg-white text-slate-800 outline-none cursor-pointer"
                  >
                    {teacherCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.grade || 'عام'})
                      </option>
                    ))}
                  </select>
                )}

                {activeCourse && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudentPreviewMode(!isStudentPreviewMode);
                      if (!isStudentPreviewMode && activeCourse.lessons && activeCourse.lessons.length > 0) {
                        setPreviewActiveLesson(activeCourse.lessons[0]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isStudentPreviewMode ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{isStudentPreviewMode ? 'العودة لوضع التعديل ✏️' : 'معاينة كطالب 👁️'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreatingCourse(!isCreatingCourse)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ كورس جديد</span>
                </button>

                {activeCourse && (
                  <button
                    type="button"
                    onClick={() => {
                      requestDelete(
                        'حذف الكورس نهائياً',
                        `هل أنت متأكد من حذف كورس "${activeCourse.title}" وكافة محتوياته وأكواد تفعيله نهائياً؟`,
                        () => {
                          onDeleteCourse(activeCourse.id);
                          showToast(`تم حذف كورس "${activeCourse.title}" بنجاح.`);
                          setSelectedCourseId(null);
                        }
                      );
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                    title="حذف هذا الكورس بالكامل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* INLINE NEW COURSE CREATOR WITH GRADE SELECTOR */}
            {isCreatingCourse && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-md animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <h3 className="font-black text-slate-900 text-base">إضافة كورس جديد وتحديد الصف الدراسي</h3>
                  </div>
                  <button onClick={() => setIsCreatingCourse(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveNewCourse} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الكورس *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: كورس المراجعة الشاملة لمادة الفيزياء"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الصف الدراسي التابع له الكورس *</label>
                    <select
                      value={newCourseGrade}
                      onChange={(e) => setNewCourseGrade(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none bg-white text-indigo-700"
                    >
                      <option value="أولى ثانوي">أولى ثانوي (الصف الأول الثانوي)</option>
                      <option value="ثانية ثانوي">ثانية ثانوي (الصف الثاني الثانوي)</option>
                      <option value="ثالثة ثانوي">ثالثة ثانوي (الصف الثالث الثانوي)</option>
                      <option value="ثانية بكالوريا">ثانية بكالوريا</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">تسعير الكورس</label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCourseIsFree}
                          onChange={(e) => {
                            setNewCourseIsFree(e.target.checked);
                            if (e.target.checked) setNewCoursePrice('0');
                          }}
                        />
                        <span>مجاني بدون كود</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      required={!newCourseIsFree}
                      disabled={newCourseIsFree}
                      min="0"
                      placeholder={newCourseIsFree ? 'مجاني' : 'مثال: 250'}
                      value={newCourseIsFree ? '0' : newCoursePrice}
                      onChange={(e) => setNewCoursePrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none disabled:bg-slate-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف الكورس</label>
                    <textarea
                      rows={2}
                      placeholder="اكتب نبذة عن الدروس والوحدات المشمولة..."
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-medium outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">صورة غلاف الكورس</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-3 text-center bg-slate-50 cursor-pointer flex flex-col items-center justify-center min-h-[85px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCourseImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {newCourseImageData ? (
                        <div className="flex items-center gap-2">
                          <img src={newCourseImageData} alt="الغلاف" className="w-12 h-10 rounded-lg object-cover" />
                          <span className="text-xs font-bold text-emerald-600">تم اختيار الصورة ✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>رفع صورة من جهازك</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Expiry & Duration Settings */}
                  <div className="md:col-span-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-black text-slate-900">تحديد صلاحية وانتهاء الكورس عند الطالب:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${newCourseExpiryType === 'never' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="teacher_new_expiry_type"
                          checked={newCourseExpiryType === 'never'}
                          onChange={() => setNewCourseExpiryType('never')}
                          className="mt-0.5 text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <span className="block font-black">مستمر دائماً بدون انتهاء</span>
                          <span className="text-[10px] text-slate-500 font-normal">لا يختفي من عند الطالب إلا إذا قمت بحذفه.</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${newCourseExpiryType === 'duration_days' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="teacher_new_expiry_type"
                          checked={newCourseExpiryType === 'duration_days'}
                          onChange={() => setNewCourseExpiryType('duration_days')}
                          className="mt-0.5 text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <span className="block font-black">مدة محددة تبدأ فور التفعيل (مثال: أسبوع)</span>
                          <span className="text-[10px] text-slate-500 font-normal">يعد المدة من لحظة تفعيل الطالب للكود ثم يختفي من عنده، ويظل موجوداً عندك.</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${newCourseExpiryType === 'fixed_date' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="teacher_new_expiry_type"
                          checked={newCourseExpiryType === 'fixed_date'}
                          onChange={() => setNewCourseExpiryType('fixed_date')}
                          className="mt-0.5 text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <span className="block font-black">يوم وتاريخ محدد يختفي فيه عند الجميع</span>
                          <span className="text-[10px] text-slate-500 font-normal">تاريخ معين محدد يختفي فيه الكورس من عند كل الطلاب.</span>
                        </div>
                      </label>
                    </div>

                    {newCourseExpiryType === 'duration_days' && (
                      <div className="pt-2 flex flex-wrap items-center gap-3 animate-in fade-in">
                        <label className="text-xs font-bold text-slate-700 shrink-0">مدة صلاحية الكورس بعد تفعيل الطالب:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={newCourseExpiryDurationDays}
                            onChange={(e) => setNewCourseExpiryDurationDays(Number(e.target.value) || 7)}
                            className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-center bg-white outline-none"
                          />
                          <span className="text-xs text-slate-600 font-bold">أيام</span>
                        </div>

                        {/* Quick preset buttons for duration */}
                        <div className="flex items-center gap-1.5">
                          {[
                            { label: 'أسبوع (7 أيام)', days: 7 },
                            { label: 'أسبوعين (14 يوم)', days: 14 },
                            { label: 'شهر (30 يوم)', days: 30 },
                            { label: 'شهرين (60 يوم)', days: 60 },
                          ].map((preset) => (
                            <button
                              key={preset.days}
                              type="button"
                              onClick={() => setNewCourseExpiryDurationDays(preset.days)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                newCourseExpiryDurationDays === preset.days
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {newCourseExpiryType === 'fixed_date' && (
                      <div className="pt-2 flex items-center gap-3 animate-in fade-in">
                        <label className="text-xs font-bold text-slate-700 shrink-0">اختر يوم انتهاء واختفاء الكورس:</label>
                        <input
                          type="date"
                          value={newCourseExpiryDate}
                          onChange={(e) => setNewCourseExpiryDate(e.target.value)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Prerequisite Locking System (حظر vs فك الحظر) */}
                  <div className="md:col-span-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Lock className={`w-5 h-5 ${newCoursePrerequisiteLock ? 'text-amber-700' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="font-black text-xs text-amber-950">نظام حظر المحتوى التالي للامتحان (حظر / فك الحظر):</h4>
                        <p className="text-[11px] text-amber-800 font-medium">
                          عند تفعيل الحظر: أي محاضرة أو حل اختبار بعد الامتحان يظل مقفولاً 🔒 حتى يجتاز الطالب الامتحان بنسبة 50% فأكثر.
                          وعند فك الحظر: يفتح كل شيء للطالب مباشرة بدون قيد.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-white px-3 py-1.5 rounded-xl border border-amber-300">
                      <input
                        type="checkbox"
                        checked={newCoursePrerequisiteLock}
                        onChange={(e) => setNewCoursePrerequisiteLock(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-0"
                      />
                      <span className="text-xs font-black text-amber-900">
                        {newCoursePrerequisiteLock ? '🔒 نظام الحظر مفعل' : '🔓 فك الحظر (مفتوح بدون شروط)'}
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsCreatingCourse(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                      إلغاء
                    </button>
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20">
                      نشر الكورس والبدء بإضافة المجلدات
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CURRICULUM WORKSPACE */}
            {activeCourse && (
              <div className="space-y-6">
                {/* Course Settings & Policy Bar (نظام الحظر وصلاحية الانتهاء) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Prerequisite Lock Mode (حظر / فك الحظر) */}
                  <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex flex-col justify-between gap-3 ${
                    activeCourse.prerequisite_lock_enabled
                      ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          activeCourse.prerequisite_lock_enabled ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {activeCourse.prerequisite_lock_enabled ? <Lock className="w-5 h-5 text-amber-800" /> : <Unlock className="w-5 h-5 text-slate-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                              نظام الحظر في هذا الكورس
                            </h4>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              activeCourse.prerequisite_lock_enabled
                                ? 'bg-amber-200 text-amber-950 border border-amber-400'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {activeCourse.prerequisite_lock_enabled ? '🔒 الحظر مفعل' : '🔓 فك الحظر'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {activeCourse.prerequisite_lock_enabled
                              ? 'أي محاضرة أو فيديو حل اختبار بعد الامتحان مقفول عند الطالب حتى يجتازه بنسبة 50% فأكثر.'
                              : 'جميع المحاضرات وحلول الاختبارات مفتوحة ومتاحة للطلاب بحرية بدون شروط.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">التبديل بين الحظر وفك الحظر بنقرة واحدة:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateCourse) {
                            const newLock = !activeCourse.prerequisite_lock_enabled;
                            onUpdateCourse(activeCourse.id, { prerequisite_lock_enabled: newLock });
                            showToast(
                              newLock
                                ? '🔒 تم تفعيل نظام الحظر! المحتوى التالي لأي امتحان مقفول عند الطالب حتى يحقق 50% فأكثر.'
                                : '🔓 تم فك الحظر! جميع المحاضرات والحلول مفتوحة للطلاب بحرية.'
                            );
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          activeCourse.prerequisite_lock_enabled
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {activeCourse.prerequisite_lock_enabled ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>فك الحظر الآن 🔓</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>تفعيل نظام الحظر 🔒</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Course Access Expiry Status & Edit */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 border-2 border-slate-200 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                              صلاحية وانتهاء الكورس عند الطالب
                            </h4>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {activeCourse.expiry_type === 'duration_days'
                                ? `مدة محددة (${activeCourse.expiry_duration_days || 7} يوم)`
                                : activeCourse.expiry_type === 'fixed_date'
                                ? 'تاريخ محدد'
                                : 'مستمر دائماً'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                            {activeCourse.expiry_type === 'duration_days' ? (
                              <>
                                ⏳ ينتهي بعد <strong className="text-indigo-800">{activeCourse.expiry_duration_days || 7} أيام {(activeCourse.expiry_duration_days || 7) === 7 ? '(أسبوع كامل)' : ''}</strong> من تاريخ تفعيل الطالب للكود ثم يختفي من عنده، مع بقائه محفوظاً عندك.
                              </>
                            ) : activeCourse.expiry_type === 'fixed_date' && activeCourse.expiry_date ? (
                              <>
                                📅 ينتهي ويختفي عند جميع الطلاب بتاريخ: <strong className="text-amber-800">{activeCourse.expiry_date}</strong>.
                              </>
                            ) : (
                              '♾️ الكورس مستمر دائماً ولا يختفي من عند الطالب إلا إذا قمت بحذفه.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">تغيير مدة الصلاحية أو التاريخ:</span>
                      <button
                        type="button"
                        onClick={() => openEditCourseSettings(activeCourse)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>تعديل الصلاحية ✏️</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-50 via-violet-50 to-slate-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        محتوى الكورس
                      </span>
                      <h3 className="font-black text-slate-900 text-base">{activeCourse.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      أضف مجلدات رئيسية ومجلدات فرعية متداخلة (أكورديون)، وارفع محاضراتك واختباراتك بكل سلاسة في مكانها.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetParentFolderId(undefined);
                        setIsCreatingFolder(!isCreatingFolder);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-indigo-200 text-indigo-700 font-extrabold text-xs shadow-2xs hover:border-indigo-400 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      <span>+ إضافة مجلد رئيسي (أكورديون)</span>
                    </button>
                  </div>
                </div>

                {/* INLINE FOLDER CREATOR (ROOT OR NESTED) */}
                {isCreatingFolder && (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-indigo-300 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-black text-slate-900 text-sm">
                          {targetParentFolderId ? 'إنشاء مجلد فرعي داخل المجلد' : `إنشاء مجلد رئيسي في كورس ${activeCourse.title}`}
                        </h4>
                      </div>
                      <button onClick={() => setIsCreatingFolder(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveNewFolder} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          اسم المجلد الأكورديون *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: الباب الأول / الفصل الثاني / مراجعات ليلة الامتحان"
                          value={newFolderTitle}
                          onChange={(e) => setNewFolderTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">وصف اختياري للمجلد</label>
                        <input
                          type="text"
                          placeholder="اكتب وصفاً سريعاً لما يحتويه هذا المجلد..."
                          value={newFolderDesc}
                          onChange={(e) => setNewFolderDesc(e.target.value)}
                          className="w-full px-4 py-2 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-medium outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsCreatingFolder(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                          إلغاء
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs">
                          إنشاء المجلد الآن ✓
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ACCORDION FOLDERS RECURSIVE TREE */}
                <div className="space-y-4">
                  {(activeCourse.folders || []).filter((f) => !f.parent_id).length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-indigo-100">
                      <Folder className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                      <h4 className="font-extrabold text-slate-800 text-sm mb-1">لا توجد مجلدات في هذا الكورس بعد</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        ابدأ بإضافة أول مجلد أكورديون، ويمكنك لاحقاً إضافة مجلدات فرعية متداخلة بداخله.
                      </p>
                      <button
                        onClick={() => {
                          setTargetParentFolderId(undefined);
                          setIsCreatingFolder(true);
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>إضافة أول مجلد رئيسي</span>
                      </button>
                    </div>
                  ) : (
                    (activeCourse.folders || [])
                      .filter((f) => !f.parent_id)
                      .map((rootFolder) => renderFolderAccordion(rootFolder, 0))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: LECTURE ATTENDANCE & VIEWS TRACKING
        ========================================================================= */}
        {activeTab === 'lecture-views' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                      <Eye className="w-5 h-5" />
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900">سجل مشاهدة وحضور المحاضرات</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    اختر الكورس ثم المحاضرة للاطلاع لحظياً على الطلاب الذين شاهدوها والذين لم يشاهدوها بعد مع أرقام هواتف أولياء الأمور.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">الكورس:</label>
                    <select
                      value={selectedViewCourseId || teacherCourses[0]?.id || ''}
                      onChange={(e) => {
                        setSelectedViewCourseId(e.target.value);
                        setSelectedViewLessonId('');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                    >
                      {teacherCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lecture Selector */}
              {(() => {
                const targetCourse = teacherCourses.find((c) => c.id === (selectedViewCourseId || teacherCourses[0]?.id));
                const courseLessons = targetCourse?.lessons || [];
                const courseEnrollments = teacherEnrollments.filter((e) => e.course_id === targetCourse?.id);
                const activeLessonId = selectedViewLessonId || courseLessons[0]?.id || '';
                const activeLesson = courseLessons.find((l) => l.id === activeLessonId);

                // Students who viewed this lesson
                const viewers = teacherLessonViews.filter((lv) => lv.lesson_id === activeLessonId);
                const viewerStudentIds = new Set(viewers.map((v) => v.student_id));

                // Students who have NOT viewed this lesson
                const notViewedStudents = courseEnrollments.filter((enr) => !viewerStudentIds.has(enr.student_id));

                if (courseLessons.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                      لا توجد محاضرات مضافة في هذا الكورس بعد لمتابعة مشاهدتها.
                    </div>
                  );
                }

                return (
                  <div className="space-y-6 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">اختر المحاضرة:</span>
                      <div className="flex flex-wrap gap-2">
                        {courseLessons.map((ls, idx) => (
                          <button
                            key={ls.id}
                            type="button"
                            onClick={() => setSelectedViewLessonId(ls.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              activeLessonId === ls.id
                                ? 'bg-indigo-600 text-white shadow-xs font-black'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>
                              {idx + 1}. {ls.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stats Card */}
                    {activeLesson && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                          <span className="text-xs text-indigo-700 font-bold block">إجمالي طلاب الكورس</span>
                          <span className="text-2xl font-black text-indigo-950">{courseEnrollments.length} طالب</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                          <span className="text-xs text-emerald-700 font-bold block">شاهدوا المحاضرة ✓</span>
                          <span className="text-2xl font-black text-emerald-700">
                            {viewers.length} طالب ({courseEnrollments.length > 0 ? Math.round((viewers.length / courseEnrollments.length) * 100) : 0}%)
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                          <span className="text-xs text-rose-700 font-bold block">لم يشاهدوها بعد ⚠️</span>
                          <span className="text-2xl font-black text-rose-700">{notViewedStudents.length} طالب</span>
                        </div>
                      </div>
                    )}

                    {/* Two Columns: Watched vs Not Watched */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      {/* 1. Watched Students */}
                      <div className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                          <h4 className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>الطلاب الذين استمعوا للمحاضرة ({viewers.length})</span>
                          </h4>
                        </div>

                        {viewers.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6">لم يستمع أي طالب لهذه المحاضرة بعد.</p>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {viewers.map((v) => (
                              <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900 block">{v.student_name}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">{v.student_phone || '—'}</span>
                                </div>
                                <div className="text-left font-mono text-[11px] text-emerald-700 font-medium">
                                  {v.viewed_at}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Not Watched Students */}
                      <div className="rounded-2xl border border-rose-200 bg-white p-5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                          <h4 className="font-black text-sm text-rose-950 flex items-center gap-1.5">
                            <UserX className="w-4 h-4 text-rose-600" />
                            <span>الطلاب الذين لم يشاهدوها بعد ({notViewedStudents.length})</span>
                          </h4>
                        </div>

                        {notViewedStudents.length === 0 ? (
                          <p className="text-xs text-emerald-600 font-bold text-center py-6">
                            🎉 ممتاز! جميع الطلاب المشتركين شاهدوا هذه المحاضرة.
                          </p>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {notViewedStudents.map((enr) => (
                              <div key={enr.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900 block">{enr.student_name}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">هاتف الطالب: {enr.student_phone || '—'}</span>
                                </div>
                                <div className="text-left">
                                  <span className="block font-mono text-[11px] text-indigo-700 font-bold">
                                    ولي الأمر: {enr.parent_phone || 'غير مسجل'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: CODES MANAGEMENT ===================== */}
        {activeTab === 'codes' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">توليد أكواد التفعيل لطلابك</h3>
                  <p className="text-xs text-slate-500">كل كود صالح للاستخدام مرة واحدة فقط بحساب طالب واحد.</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetCourse = codeGenerationCourseId || teacherCourses[0]?.id;
                  if (!targetCourse) return;
                  onGenerateCodes(targetCourse, codeCountToGenerate);
                  showToast(`🎉 تم توليد ${codeCountToGenerate} أكواد بنجاح!`);
                }}
                className="flex flex-wrap items-end gap-4"
              >
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر الكورس:</label>
                  <select
                    value={codeGenerationCourseId}
                    onChange={(e) => setCodeGenerationCourseId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold outline-none bg-white"
                  >
                    {teacherCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.grade || 'عام'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-36">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الأكواد:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={codeCountToGenerate}
                    onChange={(e) => setCodeCountToGenerate(Number(e.target.value) || 5)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  + توليد الأكواد الآن
                </button>
              </form>
            </div>

            {/* Codes List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-slate-900">سجل الأكواد الصادرة ({teacherCodes.length})</h3>
              </div>

              {teacherCodes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا توجد أكواد مولدة بعد.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="pb-3 pr-2">كود التفعيل</th>
                        <th className="pb-3">الكورس</th>
                        <th className="pb-3">الحالة</th>
                        <th className="pb-3">الطالب المستفيد</th>
                        <th className="pb-3">تاريخ التفعيل</th>
                        <th className="pb-3 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teacherCodes.map((cd) => {
                        const course = courses.find((c) => c.id === cd.course_id);
                        return (
                          <tr key={cd.id} className="hover:bg-slate-50/50">
                            <td className="py-3 pr-2 font-mono font-black text-indigo-600 text-sm">{cd.code}</td>
                            <td className="py-3 font-bold text-slate-800">{course?.title || 'كورس'}</td>
                            <td className="py-3">
                              {cd.is_used ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                                  تم الاستخدام
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  متاح للاستخدام
                                </span>
                              )}
                            </td>
                            <td className="py-3 font-medium text-slate-700">{cd.used_by_student_name || '—'}</td>
                            <td className="py-3 text-slate-400">{cd.used_at || '—'}</td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(cd.code);
                                    setCopiedCodeText(cd.code);
                                    setTimeout(() => setCopiedCodeText(null), 2000);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                                  title="نسخ الكود"
                                >
                                  {copiedCodeText === cd.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => {
                                    requestDelete(
                                      'حذف الكود',
                                      `هل أنت متأكد من حذف كود التفعيل "${cd.code}" نهائياً؟`,
                                      () => {
                                        onDeleteCode(cd.id);
                                        showToast('تم حذف الكود بنجاح.');
                                      }
                                    );
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="حذف الكود"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ENROLLED STUDENTS ===================== */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">الطلاب المشتركون في كورساتك ({teacherEnrollments.length})</h3>
                <p className="text-xs text-slate-500">قائمة بجميع الطلاب المسجلين مع أرقام هواتفهم وهواتف أولياء الأمور.</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="بحث باسم الطالب أو الهاتف..."
                  value={studentSearchText}
                  onChange={(e) => setStudentSearchText(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />

                <select
                  value={studentCourseFilter}
                  onChange={(e) => setStudentCourseFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
                >
                  <option value="all">كافة الكورسات</option>
                  {teacherCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {teacherEnrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">لا يوجد طلاب مسجلون بعد.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-3 pr-2">اسم الطالب</th>
                      <th className="pb-3">هاتف الطالب</th>
                      <th className="pb-3">هاتف ولي الأمر</th>
                      <th className="pb-3">الكورس المشترك به</th>
                      <th className="pb-3">كود التفعيل</th>
                      <th className="pb-3">تاريخ الاشتراك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacherEnrollments
                      .filter((enr) => {
                        const matchC = studentCourseFilter === 'all' || enr.course_id === studentCourseFilter;
                        const q = studentSearchText.trim().toLowerCase();
                        if (!q) return matchC;
                        return (
                          matchC &&
                          (enr.student_name.toLowerCase().includes(q) ||
                            (enr.student_phone && enr.student_phone.includes(q)) ||
                            (enr.parent_phone && enr.parent_phone.includes(q)))
                        );
                      })
                      .map((enr) => (
                        <tr key={enr.id} className="hover:bg-slate-50/50">
                          <td className="py-3 pr-2 font-bold text-slate-900">{enr.student_name}</td>
                          <td className="py-3 font-mono text-slate-700">{enr.student_phone || '—'}</td>
                          <td className="py-3 font-mono font-bold text-indigo-700">{enr.parent_phone || '—'}</td>
                          <td className="py-3 font-medium text-slate-800">{enr.course_title}</td>
                          <td className="py-3 font-mono text-[11px] text-slate-500">{enr.code_used || '—'}</td>
                          <td className="py-3 text-slate-400">{enr.activated_at}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 5: PROFILE ===================== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center overflow-hidden">
                {editImageData ? <img src={editImageData} alt="صورة المعلم" className="w-full h-full object-cover" /> : editName.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{teacher.name}</h3>
                <p className="text-xs text-slate-500">تعديل بياناتك وكلمة مرور حساب المعلم الخاص بك</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateTeacherProfile({
                  name: editName.trim(),
                  specialization: editSpec.trim(),
                  bio: editBio.trim(),
                  password: editPassword.trim(),
                  phone: editPhone.trim(),
                  image_data: editImageData,
                });
                showToast('✅ تم تحديث بياناتك بنجاح!');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المادة والتخصص</label>
                <input
                  type="text"
                  value={editSpec}
                  onChange={(e) => setEditSpec(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الخاصة بلوحة المدرس (Secret Password)
                </label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نبذة عنك (Bio)</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">صورة المعلم الشخصية</label>
                <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="text-xs" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* =========================================================================
          EXAM RESULTS & UNTAKEN STUDENTS MODAL (قائمة الممتحنين والطلبة اللي ممتحنوش)
      ========================================================================= */}
      {viewingExamResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo']" dir="rtl">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block mb-1">
                  متابعة أداء الاختبار
                </span>
                <h4 className="font-black text-lg text-slate-900">{viewingExamResults.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  إجمالي درجات الاختبار: {viewingExamResults.total_points} درجة • المدة: {viewingExamResults.duration_minutes} دقيقة
                </p>
              </div>
              <button onClick={() => setViewingExamResults(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submissions vs Not Submitted Tabs */}
            {(() => {
              const subs = teacherSubmissions.filter((s) => s.exam_id === viewingExamResults.id);
              const submittedStudentIds = new Set(subs.map((s) => s.student_id));
              const courseEnrolled = teacherEnrollments.filter((e) => e.course_id === viewingExamResults.course_id);
              const notSubmittedStudents = courseEnrolled.filter((e) => !submittedStudentIds.has(e.student_id));

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setExamResultsTab('submitted')}
                      className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                        examResultsTab === 'submitted' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>الطلاب الذين أدوا الاختبار ({subs.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExamResultsTab('not-submitted')}
                      className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                        examResultsTab === 'not-submitted' ? 'bg-white text-rose-700 shadow-xs font-black' : 'text-slate-600'
                      }`}
                    >
                      <UserX className="w-4 h-4 text-rose-600" />
                      <span>الطلاب الذين لم يمتحنوا بعد ({notSubmittedStudents.length})</span>
                    </button>
                  </div>

                  {examResultsTab === 'submitted' ? (
                    subs.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">لم يقم أي طالب بحل هذا الاختبار حتى الآن.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold">
                              <th className="pb-3 pr-2">اسم الطالب</th>
                              <th className="pb-3">هاتف الطالب</th>
                              <th className="pb-3">هاتف ولي الأمر</th>
                              <th className="pb-3">الدرجة</th>
                              <th className="pb-3">النسبة</th>
                              <th className="pb-3">وقت الإرسال</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {subs.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50/60">
                                <td className="py-3 pr-2 font-bold text-slate-900">{s.student_name}</td>
                                <td className="py-3 font-mono text-slate-700">{s.student_phone || '—'}</td>
                                <td className="py-3 font-mono font-bold text-indigo-700">{s.parent_phone || '—'}</td>
                                <td className="py-3 font-black text-emerald-600">
                                  {s.score} / {s.total_points}
                                </td>
                                <td className="py-3 font-bold text-slate-800">{s.percentage}%</td>
                                <td className="py-3 text-slate-400 text-[11px]">{s.submitted_at}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : notSubmittedStudents.length === 0 ? (
                    <div className="p-8 text-center text-emerald-600 font-bold text-xs bg-emerald-50 rounded-2xl">
                      🎉 رائع! جميع الطلاب المشتركين في هذا الكورس أدوا الاختبار بنجاح.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="pb-3 pr-2">اسم الطالب</th>
                            <th className="pb-3">هاتف الطالب</th>
                            <th className="pb-3">هاتف ولي الأمر</th>
                            <th className="pb-3">كود التفعيل</th>
                            <th className="pb-3">تاريخ الانضمام</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {notSubmittedStudents.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/60">
                              <td className="py-3 pr-2 font-bold text-slate-900">{st.student_name}</td>
                              <td className="py-3 font-mono text-slate-700">{st.student_phone || '—'}</td>
                              <td className="py-3 font-mono font-bold text-indigo-700">{st.parent_phone || 'غير مسجل'}</td>
                              <td className="py-3 font-mono text-slate-500">{st.code_used || '—'}</td>
                              <td className="py-3 text-slate-400">{st.activated_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          EXAM PREVIEW MODAL (معاينة الأسئلة والصور)
      ========================================================================= */}
      {previewingExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo']" dir="rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg inline-block mb-1">
                  معاينة أسئلة الاختبار
                </span>
                <h4 className="font-black text-base text-slate-900">{previewingExamModal.title}</h4>
              </div>
              <button onClick={() => setPreviewingExamModal(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(previewingExamModal.questions || []).map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-700">السؤال {idx + 1}:</span>
                    <span className="text-slate-400 font-bold">{q.points || 1} درجات</span>
                  </div>

                  {q.question && <p className="font-bold text-slate-900 text-sm">{q.question}</p>}
                  {q.image_url && (
                    <img src={q.image_url} alt="صورة السؤال" className="max-h-48 rounded-xl object-contain border bg-white p-1" />
                  )}

                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correct_index === optIdx;
                      const optImage = q.options_images?.[optIdx];

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl flex items-center justify-between font-medium ${
                            isCorrect ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-bold' : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{opt}</span>
                            {optImage && <img src={optImage} alt="خيار" className="w-7 h-7 rounded object-cover border" />}
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>الإجابة الصحيحة</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          EDIT COURSE SETTINGS MODAL (صلاحية الانتهاء ونظام الحظر)
      ========================================================================= */}
      {editingCourseSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo']" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">إعدادات وصلاحية الكورس</h4>
                  <p className="text-xs text-slate-500">{editingCourseSettings.title}</p>
                </div>
              </div>
              <button onClick={() => setEditingCourseSettings(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expiry Settings */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>صلاحية الكورس واختفائه عند الطالب:</span>
              </label>

              <div className="space-y-2">
                <label className={`p-3 rounded-2xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${
                  editCourseExpiryType === 'never' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="edit_course_expiry"
                    checked={editCourseExpiryType === 'never'}
                    onChange={() => setEditCourseExpiryType('never')}
                    className="mt-0.5 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="block font-black">مستمر دائماً بدون تاريخ انتهاء</span>
                    <span className="text-[10px] text-slate-500 font-normal">لا يختفي من عند الطالب إلا إذا حذفته.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${
                  editCourseExpiryType === 'duration_days' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="edit_course_expiry"
                    checked={editCourseExpiryType === 'duration_days'}
                    onChange={() => setEditCourseExpiryType('duration_days')}
                    className="mt-0.5 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="block font-black">مدة محددة تبدأ فور التفعيل (أسبوع أو أيام محددة)</span>
                    <span className="text-[10px] text-slate-500 font-normal">يعد المدة من لحظة تفعيل الطالب للكود ثم يختفي من عنده، ويظل موجوداً عندك كمعلم.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${
                  editCourseExpiryType === 'fixed_date' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="edit_course_expiry"
                    checked={editCourseExpiryType === 'fixed_date'}
                    onChange={() => setEditCourseExpiryType('fixed_date')}
                    className="mt-0.5 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="block font-black">يوم وتاريخ محدد يختفي فيه عند الجميع</span>
                    <span className="text-[10px] text-slate-500 font-normal">تاريخ محدد يختفي فيه الكورس من عند جميع الطلاب.</span>
                  </div>
                </label>
              </div>

              {editCourseExpiryType === 'duration_days' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">عدد الأيام بعد التفعيل:</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={editCourseExpiryDurationDays}
                      onChange={(e) => setEditCourseExpiryDurationDays(Number(e.target.value) || 7)}
                      className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-center bg-white"
                    />
                    <span className="text-xs text-slate-600 font-bold">يوم</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { label: 'أسبوع (7 أيام)', days: 7 },
                      { label: 'أسبوعين (14 يوم)', days: 14 },
                      { label: 'شهر (30 يوم)', days: 30 },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setEditCourseExpiryDurationDays(preset.days)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          editCourseExpiryDurationDays === preset.days
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editCourseExpiryType === 'fixed_date' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700">اختر يوم انتهاء واختفاء الكورس:</label>
                  <input
                    type="date"
                    value={editCourseExpiryDate}
                    onChange={(e) => setEditCourseExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              )}
            </div>

            {/* Prerequisite Lock Toggle */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-black text-amber-950">نظام الحظر (قفل المحتوى التالي للامتحان)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-xl border border-amber-300">
                  <input
                    type="checkbox"
                    checked={editCoursePrerequisiteLock}
                    onChange={(e) => setEditCoursePrerequisiteLock(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span className="text-xs font-black text-amber-900">
                    {editCoursePrerequisiteLock ? '🔒 حظر مفعل' : '🔓 فك الحظر'}
                  </span>
                </label>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                {editCoursePrerequisiteLock
                  ? 'أي محاضرة أو فيديو حل اختبار بعد الامتحان مقفول عند الطالب حتى يجتازه بنسبة 50% فأكثر.'
                  : 'فك الحظر: كل المحاضرات والحلول مفتوحة للطلاب بحرية تامة وبدون شروط.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCourseSettings(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveCourseSettings}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
