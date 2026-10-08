import React, { useState } from 'react';
import { Teacher, Course, CourseCode, StudentUser, Enrollment } from './types';
import {
  Lock,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  BookOpen,
  Users,
  KeyRound,
  GraduationCap,
  ArrowLeft,
  Filter,
  Upload,
  Phone,
  Mail,
  Eye,
  Gift,
  CheckCircle2,
  AlertCircle,
  Search,
  UserCheck,
  Clock,
  FileEdit,
  Smartphone
} from 'lucide-react';
import { ScoreLogo } from './ScoreLogo';

/* =========================================================================
   🔑 خانة تحديد كلمة مرور لوحة الإدارة (ADMIN PASSWORD)
   يمكنك تعديل كلمة المرور المكتوبة هنا إلى أي باسورد تريده بحرية:
========================================================================= */
export const ADMIN_PASSWORD = "1111"; // <--- غير كلمة مرور المدير من هنا كما تشاء

interface AdminPanelProps {
  teachers: Teacher[];
  courses: Course[];
  codes: CourseCode[];
  students: StudentUser[];
  enrollments: Enrollment[];
  onAddCourse: (course: Omit<Course, 'id' | 'is_active'>) => void;
  onUpdateCourse?: (courseId: string, updated: Partial<Course>) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  onDeleteTeacher: (teacherId: string) => void;
  onUpdateTeacher?: (teacherId: string, updated: Partial<Teacher>) => void;
  onGenerateCodes: (courseId: string, count: number) => void;
  onDeleteCode: (codeId: string) => void;
  onDeleteStudent?: (studentId: string) => void;
  onUpdateStudent?: (studentId: string, updated: Partial<StudentUser>) => void;
  onToggleBlockTeacher?: (teacherId: string, isBlocked: boolean) => void;
  onToggleBlockStudent?: (studentId: string, isBlocked: boolean) => void;
  onUpdateCoursesOrder?: (courses: Course[]) => void;
  onUpdateTeachersOrder?: (teachers: Teacher[]) => void;
  onCloseAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  teachers,
  courses,
  codes,
  students,
  enrollments,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddTeacher,
  onDeleteTeacher,
  onUpdateTeacher,
  onGenerateCodes,
  onDeleteCode,
  onDeleteStudent,
  onUpdateStudent,
  onToggleBlockTeacher,
  onToggleBlockStudent,
  onUpdateCoursesOrder,
  onUpdateTeachersOrder,
  onCloseAdmin,
}) => {
  // Password Lock Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('edu_admin_auth') === 'true';
  });
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'courses' | 'codes' | 'landing'>('teachers');

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Safe In-App Delete Confirmation (Never blocked by iframe sandbox)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // New Teacher Form State
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSpec, setNewTeacherSpec] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('123456');
  const [newTeacherBio, setNewTeacherBio] = useState('');
  const [newTeacherImageData, setNewTeacherImageData] = useState<string | undefined>(undefined);
  const [newTeacherShowOnLanding, setNewTeacherShowOnLanding] = useState(true);
  const [newTeacherGrades, setNewTeacherGrades] = useState<string[]>([
    'المرحلة الإعدادية',
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي',
  ]);
  const [teacherAddedSuccess, setTeacherAddedSuccess] = useState(false);

  // New Course Form State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('');
  const [newCourseIsFree, setNewCourseIsFree] = useState(false);
  const [newCourseGrade, setNewCourseGrade] = useState<'أولى ثانوي' | 'ثانية ثانوي' | 'ثالثة ثانوي' | 'ثانية بكالوريا'>('ثالثة ثانوي');
  const [newCourseTeacherId, setNewCourseTeacherId] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseImageData, setNewCourseImageData] = useState<string | undefined>(undefined);
  const [newCourseShowOnLanding, setNewCourseShowOnLanding] = useState(true);
  const [newCourseExpiryType, setNewCourseExpiryType] = useState<'never' | 'fixed_date' | 'duration_days'>('never');
  const [newCourseExpiryDate, setNewCourseExpiryDate] = useState<string>('');
  const [newCourseExpiryDurationDays, setNewCourseExpiryDurationDays] = useState<number>(7);
  const [newCoursePrerequisiteLock, setNewCoursePrerequisiteLock] = useState<boolean>(false);

  // Edit Course Expiry Modal State for Existing Courses
  const [editingCourseExpiry, setEditingCourseExpiry] = useState<Course | null>(null);
  const [editAdminExpiryType, setEditAdminExpiryType] = useState<'never' | 'fixed_date' | 'duration_days'>('never');
  const [editAdminExpiryDate, setEditAdminExpiryDate] = useState<string>('');
  const [editAdminExpiryDays, setEditAdminExpiryDays] = useState<number>(7);

  const openAdminEditExpiry = (crs: Course) => {
    setEditingCourseExpiry(crs);
    setEditAdminExpiryType(crs.expiry_type || 'never');
    setEditAdminExpiryDate(crs.expiry_date || '');
    setEditAdminExpiryDays(crs.expiry_duration_days || 7);
  };

  const handleSaveAdminExpiry = () => {
    if (!editingCourseExpiry || !onUpdateCourse) return;
    onUpdateCourse(editingCourseExpiry.id, {
      expiry_type: editAdminExpiryType,
      expiry_date: editAdminExpiryType === 'fixed_date' ? editAdminExpiryDate : undefined,
      expiry_duration_days: editAdminExpiryType === 'duration_days' ? Number(editAdminExpiryDays) || 7 : undefined,
    });
    setEditingCourseExpiry(null);
  };

  // Generate Codes State
  const [codeCourseId, setCodeCourseId] = useState('');
  const [codeQuantity, setCodeQuantity] = useState(5);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editBlocked, setEditBlocked] = useState(false);

  // Handle Pass Verification
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('edu_admin_auth', 'true');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleAdminLogout = () => {
    setDeleteConfirm({
      title: 'تأكيد العودة للمنصة',
      message: 'هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة تحكم المدير والعودة للمنصة الرئيسية؟',
      onConfirm: () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('edu_admin_auth');
        setDeleteConfirm(null);
        onCloseAdmin();
      },
    });
  };

  // Upload Handlers
  const handleTeacherImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeacherImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCourseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCourseImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    onAddTeacher({
      name: newTeacherName.trim(),
      specialization: newTeacherSpec.trim() || 'معلم خبير',
      phone: newTeacherPhone.trim(),
      email: newTeacherEmail.trim() || `${newTeacherPhone.trim()}@platform.com`,
      password: newTeacherPass.trim() || '123456',
      bio: newTeacherBio.trim(),
      image_data: newTeacherImageData,
      show_on_landing: newTeacherShowOnLanding,
      grades: newTeacherGrades,
    });

    setNewTeacherName('');
    setNewTeacherSpec('');
    setNewTeacherPhone('');
    setNewTeacherEmail('');
    setNewTeacherPass('123456');
    setNewTeacherBio('');
    setNewTeacherImageData(undefined);
    setNewTeacherShowOnLanding(true);
    setNewTeacherGrades([
      'المرحلة الإعدادية',
      'الصف الأول الثانوي',
      'الصف الثاني الثانوي',
      'الصف الثالث الثانوي',
    ]);
    setTeacherAddedSuccess(true);
    setTimeout(() => setTeacherAddedSuccess(false), 3000);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const price = newCourseIsFree ? 0 : Number(newCoursePrice) || 0;

    onAddCourse({
      title: newCourseTitle.trim(),
      price: price,
      is_free: newCourseIsFree || price === 0,
      teacher_id: newCourseTeacherId || teachers[0]?.id || '',
      description: newCourseDesc.trim(),
      grade: newCourseGrade,
      lessons_count: 20,
      duration_hours: 30,
      image_data: newCourseImageData,
      expiry_type: newCourseExpiryType,
      expiry_date: newCourseExpiryType === 'fixed_date' ? newCourseExpiryDate : undefined,
      expiry_duration_days: newCourseExpiryType === 'duration_days' ? Number(newCourseExpiryDurationDays) || 7 : undefined,
      prerequisite_lock_enabled: newCoursePrerequisiteLock,
      show_on_landing: newCourseShowOnLanding,
    });

    setNewCourseTitle('');
    setNewCoursePrice('');
    setNewCourseIsFree(false);
    setNewCourseDesc('');
    setNewCourseImageData(undefined);
    setNewCourseShowOnLanding(true);
    setNewCourseExpiryType('never');
    setNewCourseExpiryDate('');
    setNewCourseExpiryDurationDays(7);
    setNewCoursePrerequisiteLock(false);
  };

  const handleCreateCodes = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = codeCourseId || courses[0]?.id;
    if (!targetId) return;
    onGenerateCodes(targetId, Number(codeQuantity) || 5);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If not authenticated, render the secure password lock screen
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-['Cairo'] text-slate-800"
        dir="rtl"
      >
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200/80 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900">لوحة تحكم المدير</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            هذه المنطقة مخصصة لإدارة المنصة وإضافة حسابات المعلمين ومتابعة الطلاب
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>كلمة المرور غير صحيحة! يرجى إعادة المحاولة.</span>
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <input
                type="password"
                required
                placeholder="أدخل كلمة مرور المدير"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 text-center text-sm font-bold font-mono outline-none tracking-widest"
              />
              <span className="text-[11px] text-slate-400 block mt-2">
                (كلمة المرور الافتراضية محددة في الكود باسم ADMIN_PASSWORD: {ADMIN_PASSWORD})
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              فتح لوحة المدير
            </button>

            <button
              type="button"
              onClick={onCloseAdmin}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              الرجوع للصفحة الرئيسية
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered Students Directory
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.parent_phone && s.parent_phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.phone && t.phone.includes(q)) ||
      (t.specialization && t.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Cairo']" dir="rtl">
      {/* Top Admin Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <ScoreLogo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-slate-900">لوحة تحكم المدير العام</h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
                صلاحيات كاملة
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded-full hidden sm:inline-block">
                متاح من كافة الأجهزة
              </span>
            </div>
            <p className="text-xs text-slate-500">إدارة حسابات المعلمين والطلاب والكورسات والأكواد</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'teachers' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حسابات المدرسين ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'students' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>أكونتات الطلبة ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'courses' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الكورسات ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'codes' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>الأكواد ({codes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'landing' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>ترتيب الواجهة (Landing)</span>
          </button>
        </div>

        <button
          onClick={handleAdminLogout}
          className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>الرجوع للمنصة</span>
        </button>
      </header>

      {/* Main Admin Content */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1 space-y-8">
        {/* ===================== TAB 1: TEACHERS MANAGEMENT ===================== */}
        {activeTab === 'teachers' && (
          <div className="space-y-8">
            {/* Add Teacher Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">إنشاء حساب معلم جديد</h3>
                  <p className="text-xs text-slate-500">
                    أنت المدير المسؤول عن تزويد المعلم بحسابه وكلمة المرور الخاصة به للدخول للوحة تحكمه
                  </p>
                </div>
              </div>

              {teacherAddedSuccess && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم إنشاء حساب المعلم بنجاح! يمكنه تسجيل الدخول الآن ببياناته المسجلة.</span>
                </div>
              )}

              <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم المدرس <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. محمود رشاد"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المادة والتخصص</label>
                  <input
                    type="text"
                    placeholder="مثال: خبير الفيزياء للثانوية العامة"
                    value={newTeacherSpec}
                    onChange={(e) => setNewTeacherSpec(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف (واتساب)</label>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={newTeacherPhone}
                    onChange={(e) => setNewTeacherPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-semibold outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني للمدرس</label>
                  <input
                    type="email"
                    placeholder="teacher@platform.com"
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة مرور المعلم (لتسجيل دخوله) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ضع باسورد للمدرس"
                    value={newTeacherPass}
                    onChange={(e) => setNewTeacherPass(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    صورة المعلم (رفع ملف من الجهاز)
                  </label>
                  <div className="relative border border-slate-300 hover:border-indigo-500 rounded-2xl p-2 text-center cursor-pointer bg-slate-50 flex items-center justify-between">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTeacherImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-xs font-bold text-slate-600">
                      {newTeacherImageData ? '✓ تم تحديد صورة' : 'اضغط لاختيار صورة'}
                    </span>
                    <Upload className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold block mt-1">
                    💡 مقاس مقترح لصورة المعلم: 600 × 800 بكسل (رأسية 3:4)
                  </span>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-2">المراحل والسنوات الدراسية التي يدرسها المعلم:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {['المرحلة الإعدادية', 'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'].map((stage) => {
                      const isChecked = newTeacherGrades.includes(stage);
                      return (
                        <label
                          key={stage}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                            isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeacherGrades([...newTeacherGrades, stage]);
                              } else {
                                setNewTeacherGrades(newTeacherGrades.filter((g) => g !== stage));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                          <span>{stage}</span>
                        </label>
                      );
                    })}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 mb-3">
                    <input
                      type="checkbox"
                      checked={newTeacherShowOnLanding}
                      onChange={(e) => setNewTeacherShowOnLanding(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-indigo-950">عرض المعلم في الواجهة الرئيسية (Landing Page)</span>
                  </label>

                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نبذة عن المعلم</label>
                  <textarea
                    rows={2}
                    placeholder="نبذة مختصرة عن المعلم وخبراته التعليمية..."
                    value={newTeacherBio}
                    onChange={(e) => setNewTeacherBio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-medium outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء حساب المعلم واعتماده</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Teachers List Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="font-black text-lg text-slate-900">
                  قائمة المعلمين المعتمدين ({teachers.length})
                </h3>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث في المدرسين..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="px-3.5 py-1.5 pl-8 rounded-xl border border-slate-300 text-xs font-medium bg-white outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {filteredTeachers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا يوجد معلمون مسجلون.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">المعلم</th>
                        <th className="p-3">التخصص</th>
                        <th className="p-3">رقم الهاتف</th>
                        <th className="p-3">كلمة المرور</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center">الكورسات</th>
                        <th className="p-3 text-center">الطلاب</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTeachers.map((t) => {
                        const tCourses = courses.filter((c) => c.teacher_id === t.id);
                        const tCourseIds = tCourses.map((c) => c.id);
                        const tStudents = enrollments.filter((e) => tCourseIds.includes(e.course_id));

                        return (
                          <tr key={t.id} className={`hover:bg-slate-50/80 transition ${t.is_blocked ? 'bg-rose-50/40' : ''}`}>
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-3">
                              {t.image_data ? (
                                <img
                                  src={t.image_data}
                                  alt={t.name}
                                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shadow-2xs">
                                  {t.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-black text-sm text-slate-900 block leading-tight">{t.name}</span>
                                {t.is_blocked && (
                                  <span className="block text-[10px] text-rose-600 font-bold">محظور مؤقتاً</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">{t.specialization || '—'}</td>
                            <td className="p-3 font-mono font-bold text-slate-700">{t.phone || '—'}</td>
                            <td className="p-3 font-mono font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg inline-block my-2">
                              {t.password || '—'}
                            </td>
                            <td className="p-3 text-center">
                              {t.is_blocked ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] border border-rose-200">
                                  🚫 محظور
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                  ✓ مفعّل
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold">{tCourses.length}</td>
                            <td className="p-3 text-center font-bold text-emerald-600">{tStudents.length}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {onToggleBlockTeacher && (
                                  <button
                                    onClick={() => onToggleBlockTeacher(t.id, !t.is_blocked)}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                      t.is_blocked
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                    }`}
                                    title={t.is_blocked ? 'فك حظر المعلم' : 'حظر المعلم مؤقتاً'}
                                  >
                                    {t.is_blocked ? 'فك الحظر' : 'حظر الحساب'}
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setDeleteConfirm({
                                      title: 'حذف حساب الأستاذ',
                                      message: `هل أنت متأكد من حذف حساب الأستاذ "${t.name}" وجميع كورساته نهائياً؟`,
                                      onConfirm: () => onDeleteTeacher(t.id),
                                    });
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                  title="حذف حساب المدرس"
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

        {/* ===================== TAB 2: STUDENTS DIRECTORY & ENROLLMENTS ===================== */}
        {activeTab === 'students' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    أكونتات جميع الطلبة المسجلين بالمنصة ({students.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    استعراض بيانات الطلاب، أرقام هواتفهم، أرقام أولياء أمورهم، والكورسات المشتركين فيها
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث باسم الطالب أو رقم الهاتف..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="px-4 py-2 pl-9 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-medium bg-white outline-none w-64"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  لا يوجد طلاب مسجلون يطابقون البحث.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">رقم هاتف الطالب</th>
                        <th className="p-3">رقم ولي الأمر</th>
                        <th className="p-3">الصف الدراسي</th>
                        <th className="p-3">الكورسات المشترك فيها</th>
                        <th className="p-3 text-center">حالة الحساب</th>
                        <th className="p-3">تاريخ الانضمام</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => {
                        const studentEnrollments = enrollments.filter((e) => e.student_id === st.id);

                        return (
                          <tr key={st.id} className={`hover:bg-slate-50/80 transition ${st.is_blocked ? 'bg-rose-50/40' : ''}`}>
                            <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {st.name.charAt(0)}
                              </div>
                              <div>
                                <span>{st.name}</span>
                                {st.email && <span className="block text-[10px] text-slate-400">{st.email}</span>}
                                {st.is_blocked && (
                                  <span className="block text-[10px] text-rose-600 font-bold">محظور مؤقتاً</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700">
                              {st.phone || '—'}
                            </td>
                            <td className="p-3 font-mono font-bold text-indigo-700">
                              {st.parent_phone || '—'}
                            </td>
                            <td className="p-3 text-slate-600">
                              {st.grade || '—'}
                            </td>
                            <td className="p-3">
                              {studentEnrollments.length === 0 ? (
                                <span className="text-slate-400 text-[11px]">لا يوجد كورسات مفعلة</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {studentEnrollments.map((enr) => (
                                    <span
                                      key={enr.id}
                                      className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px]"
                                    >
                                      {enr.course_title}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {st.is_blocked ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] border border-rose-200">
                                    🚫 محظور
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                    ✓ مفعّل
                                  </span>
                                )}
                                {st.device_id ? (
                                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={st.device_id}>
                                    <Smartphone className="w-2.5 h-2.5" />
                                    <span>جهاز مقترن</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                    بدون جهاز
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">
                              {st.created_at}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudent(st);
                                    setEditName(st.name);
                                    setEditPhone(st.phone || '');
                                    setEditParentPhone(st.parent_phone || '');
                                    setEditGrade(st.grade || '');
                                    setEditPassword(st.password || '');
                                    setEditBlocked(st.is_blocked || false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                  title="تعديل بيانات الحساب"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>تعديل</span>
                                </button>
                                {st.device_id && onUpdateStudent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateStudent(st.id, { device_id: undefined });
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                                    title="فك ارتباط الجهاز الحالي ليتمكن الطالب من الدخول من جهاز جديد"
                                  >
                                    <Smartphone className="w-3 h-3 text-amber-700" />
                                    <span>فك الجهاز</span>
                                  </button>
                                )}
                                {onToggleBlockStudent && (
                                  <button
                                    onClick={() => onToggleBlockStudent(st.id, !st.is_blocked)}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                      st.is_blocked
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                    }`}
                                    title={st.is_blocked ? 'فك حظر الطالب' : 'حظر الطالب مؤقتاً'}
                                  >
                                    {st.is_blocked ? 'فك الحظر' : 'حظر الحساب'}
                                  </button>
                                )}
                                {onDeleteStudent && (
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm({
                                        title: 'حذف حساب الطالب',
                                        message: `هل أنت متأكد من حذف حساب الطالب "${st.name}" نهائياً من المنصة؟`,
                                        onConfirm: () => onDeleteStudent(st.id),
                                      });
                                    }}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="حذف حساب الطالب"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
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

        {/* ===================== TAB 3: ALL COURSES ===================== */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* Add Course Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">إضافة كورس وتنسيبه لمعلم</h3>
                  <p className="text-xs text-slate-500">اختر المعلم وحدد هل الكورس مجاني أو سعره بالجنيه</p>
                </div>
              </div>

              <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الكورس</label>
                  <input
                    type="text"
                    required
                    placeholder="عنوان الكورس"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المعلم المنسوب له الكورس</label>
                  <select
                    value={newCourseTeacherId || teachers[0]?.id || ''}
                    onChange={(e) => setNewCourseTeacherId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold bg-white outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الصف الدراسي</label>
                  <select
                    value={newCourseGrade}
                    onChange={(e) => setNewCourseGrade(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold bg-white outline-none"
                  >
                    <option value="أولى ثانوي">أولى ثانوي</option>
                    <option value="ثانية ثانوي">ثانية ثانوي</option>
                    <option value="ثالثة ثانوي">ثالثة ثانوي</option>
                    <option value="ثانية بكالوريا">ثانية بكالوريا</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">السعر (ج.م)</label>
                    <label className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCourseIsFree}
                        onChange={(e) => {
                          setNewCourseIsFree(e.target.checked);
                          if (e.target.checked) setNewCoursePrice('0');
                        }}
                      />
                      <span>مجاني</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={newCourseIsFree}
                    min="0"
                    placeholder={newCourseIsFree ? '0' : '200'}
                    value={newCourseIsFree ? '0' : newCoursePrice}
                    onChange={(e) => setNewCoursePrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none disabled:bg-slate-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">صورة غلاف الكورس</label>
                  <div className="relative border border-slate-300 hover:border-indigo-500 rounded-2xl p-2 text-center cursor-pointer bg-slate-50 flex items-center justify-between">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCourseImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="text-xs font-bold text-slate-600">
                      {newCourseImageData ? '✓ تم تحديد صورة' : 'اضغط لاختيار صورة من جهازك'}
                    </span>
                    <Upload className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold block mt-1">
                    💡 مقاس مقترح للبوستر: 1200 × 600 بكسل (أفقية بنسبة 2:1 - الربع الفوقاني للبوستر)
                  </span>
                </div>

                <div className="md:col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 mb-3">
                    <input
                      type="checkbox"
                      checked={newCourseShowOnLanding}
                      onChange={(e) => setNewCourseShowOnLanding(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-indigo-950">عرض الكورس في الواجهة الرئيسية (Landing Page)</span>
                  </label>

                  <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف الكورس</label>
                  <textarea
                    rows={2}
                    placeholder="وصف مختصر لمحتوى الكورس..."
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-medium outline-none resize-none"
                  />
                </div>

                {/* Expiry & Access Duration Settings */}
                <div className="md:col-span-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">تحديد صلاحية وانتهاء الكورس عند الطالب:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${newCourseExpiryType === 'never' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="admin_expiry_type"
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
                        name="admin_expiry_type"
                        checked={newCourseExpiryType === 'duration_days'}
                        onChange={() => setNewCourseExpiryType('duration_days')}
                        className="mt-0.5 text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <span className="block font-black">مدة محددة تبدأ فور التفعيل (مثال: أسبوع)</span>
                        <span className="text-[10px] text-slate-500 font-normal">يعد المدة من لحظة تفعيل الطالب للكود ثم يختفي من عنده.</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${newCourseExpiryType === 'fixed_date' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <input
                        type="radio"
                        name="admin_expiry_type"
                        checked={newCourseExpiryType === 'fixed_date'}
                        onChange={() => setNewCourseExpiryType('fixed_date')}
                        className="mt-0.5 text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <span className="block font-black">يوم محدد يختفي فيه عند الجميع</span>
                        <span className="text-[10px] text-slate-500 font-normal">تاريخ معين محدد يختفي فيه الكورس من عند كل الطلاب.</span>
                      </div>
                    </label>
                  </div>

                  {newCourseExpiryType === 'duration_days' && (
                    <div className="pt-2 flex items-center gap-3 animate-in fade-in">
                      <label className="text-xs font-bold text-slate-700 shrink-0">عدد الأيام بعد تفعيل الطالب للكود:</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={newCourseExpiryDurationDays}
                        onChange={(e) => setNewCourseExpiryDurationDays(Number(e.target.value) || 7)}
                        className="w-28 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-center bg-white outline-none"
                      />
                      <span className="text-xs text-slate-500 font-bold">
                        {newCourseExpiryDurationDays === 7 ? '(أسبوع كامل)' : `${newCourseExpiryDurationDays} يوم`}
                      </span>
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
                      <h4 className="font-black text-xs text-amber-950">نظام حظر المحتوى التالي للامتحان (حظر / غير حظر):</h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        عند تفعيل الحظر: أي محاضرة أو حل اختبار بعد الامتحان يظل مقفولاً 🔒 حتى يجتاز الطالب الامتحان بنسبة 50% فأكثر.
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
                      {newCoursePrerequisiteLock ? '🔒 نظام الحظر مفعل' : '🔓 فك الحظر (مفتوح بدون شرط)'}
                    </span>
                  </label>
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    حفظ وإضافة الكورس
                  </button>
                </div>
              </form>
            </div>

            {/* Courses List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h3 className="font-black text-lg text-slate-900 mb-4">
                جميع الكورسات بالمنصة ({courses.length})
              </h3>

              {courses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا توجد كورسات مضافة.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">الكورس</th>
                        <th className="p-3">المعلم</th>
                        <th className="p-3">السعر</th>
                        <th className="p-3">صلاحية الانتهاء</th>
                        <th className="p-3 text-center">نظام الحظر</th>
                        <th className="p-3 text-center">المشتركون</th>
                        <th className="p-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses.map((crs) => {
                        const teacherObj = teachers.find((t) => t.id === crs.teacher_id);
                        const enrolledCount = enrollments.filter((e) => e.course_id === crs.id).length;
                        const isFree = crs.price === 0 || crs.is_free;
                        const hasLock = crs.prerequisite_lock_enabled;

                        return (
                          <tr key={crs.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-bold text-slate-900">{crs.title}</td>
                            <td className="p-3 font-bold text-indigo-700">{teacherObj?.name || '—'}</td>
                            <td className="p-3 font-bold">
                              {isFree ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">مجاني</span>
                              ) : (
                                `${crs.price} ج.م`
                              )}
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              <button
                                type="button"
                                onClick={() => openAdminEditExpiry(crs)}
                                className="text-right hover:opacity-80 transition cursor-pointer flex items-center gap-1.5"
                                title="اضغط لتعديل صلاحية وتاريخ انتهاء الكورس"
                              >
                                {crs.expiry_type === 'duration_days' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{crs.expiry_duration_days || 7} أيام من التفعيل</span>
                                  </span>
                                ) : crs.expiry_type === 'fixed_date' && crs.expiry_date ? (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>ينتهي: {crs.expiry_date}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                    دائم بدون انتهاء ✏️
                                  </span>
                                )}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateCourse) {
                                    onUpdateCourse(crs.id, { prerequisite_lock_enabled: !hasLock });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                                  hasLock
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                                title="اضغط لتبديل حالة الحظر/فك الحظر لهذا الكورس"
                              >
                                {hasLock ? <span>🔒 حظر مفعل</span> : <span>🔓 فك الحظر</span>}
                              </button>
                            </td>
                            <td className="p-3 text-center font-bold">{enrolledCount}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    title: 'حذف الكورس',
                                    message: `هل أنت متأكد من حذف كورس "${crs.title}" نهائياً؟`,
                                    onConfirm: () => onDeleteCourse(crs.id),
                                  });
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

        {/* ===================== TAB 4: CODES ===================== */}
        {activeTab === 'codes' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">توليد أكواد التفعيل لمرة واحدة</h3>
                  <p className="text-xs text-slate-500">اختر الكورس والكمية لتوليد أكواد مشفرة لبيعها للطلاب</p>
                </div>
              </div>

              <form onSubmit={handleCreateCodes} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر الكورس</label>
                  <select
                    value={codeCourseId || courses[0]?.id || ''}
                    onChange={(e) => setCodeCourseId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold bg-white outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الأكواد</label>
                  <select
                    value={codeQuantity}
                    onChange={(e) => setCodeQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold bg-white outline-none"
                  >
                    <option value={1}>1 كود</option>
                    <option value={5}>5 أكواد</option>
                    <option value={10}>10 أكواد</option>
                    <option value={20}>20 كود</option>
                    <option value={50}>50 كود</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    توليد الأكواد الآن
                  </button>
                </div>
              </form>
            </div>

            {/* Codes List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h3 className="font-black text-lg text-slate-900 mb-4">
                سجل أكواد التفعيل بالمنصة ({codes.length})
              </h3>

              {codes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا توجد أكواد مولدة بعد.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">الكود</th>
                        <th className="p-3">الكورس</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">الطالب المستخدم</th>
                        <th className="p-3 text-center">نسخ / حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {codes.map((cd) => {
                        const crs = courses.find((c) => c.id === cd.course_id);
                        return (
                          <tr key={cd.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-black text-slate-900 text-sm tracking-wider">
                              {cd.code}
                            </td>
                            <td className="p-3 font-bold text-indigo-700">{crs?.title || 'كورس'}</td>
                            <td className="p-3">
                              {cd.is_used ? (
                                <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                                  مستخدم
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                                  متاح للبيع
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">
                              {cd.used_by_student_name ? `${cd.used_by_student_name} (${cd.used_at})` : '—'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => copyToClipboard(cd.code)}
                                  className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
                                  title="نسخ"
                                >
                                  {copiedCode === cd.code ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onDeleteCode(cd.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="حذف"
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

        {/* ===================== TAB 5: LANDING PAGE ORDERING ===================== */}
        {activeTab === 'landing' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">ترتيب وتخصيص الواجهة الرئيسية (Landing Page)</h3>
                  <p className="text-xs text-slate-500">
                    رتب ظهور الكورسات حسب الأولوية وحدد أي الكورسات والمعلمين تظهر للزوار في الصفحة الرئيسية.
                  </p>
                </div>
              </div>

              {/* Course Order Management */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-800">
                    ترتيب الكورسات في الواجهة (أعلى / أسفل):
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (!onUpdateCoursesOrder) return;
                      const sorted = [...courses].sort((a, b) => {
                        const countA = enrollments.filter((e) => e.course_id === a.id).length;
                        const countB = enrollments.filter((e) => e.course_id === b.id).length;
                        return countB - countA;
                      });
                      onUpdateCoursesOrder(sorted);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <span>⚡ ترتيب تلقائي للكورسات حسب الأكثر اشتراكاً</span>
                  </button>
                </div>
                {courses.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4">لا توجد كورسات مضافة بعد.</div>
                ) : (
                  <div className="space-y-3">
                    {courses.map((crs, index) => {
                      const teacher = teachers.find((t) => t.id === crs.teacher_id);
                      const courseStudentCount = enrollments.filter((e) => e.course_id === crs.id).length;
                      return (
                        <div
                          key={crs.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="font-black text-sm text-slate-900">{crs.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                المعلم: {teacher ? teacher.name : 'غير محدد'} · السعر: {crs.price} ج.م · المشتركون: {courseStudentCount} طالب
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                              <input
                                type="checkbox"
                                checked={crs.show_on_landing !== false}
                                onChange={(e) => {
                                  if (onUpdateCourse) {
                                    onUpdateCourse(crs.id, { show_on_landing: e.target.checked });
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-0"
                              />
                              <span>عرض في الواجهة</span>
                            </label>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => {
                                  if (index === 0 || !onUpdateCoursesOrder) return;
                                  const newArr = [...courses];
                                  const temp = newArr[index];
                                  newArr[index] = newArr[index - 1];
                                  newArr[index - 1] = temp;
                                  onUpdateCoursesOrder(newArr);
                                }}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs shadow-2xs cursor-pointer"
                                title="تحريك لأعلى"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={index === courses.length - 1}
                                onClick={() => {
                                  if (index === courses.length - 1 || !onUpdateCoursesOrder) return;
                                  const newArr = [...courses];
                                  const temp = newArr[index];
                                  newArr[index] = newArr[index + 1];
                                  newArr[index + 1] = temp;
                                  onUpdateCoursesOrder(newArr);
                                }}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs shadow-2xs cursor-pointer"
                                title="تحريك لأسفل"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Teacher Order Management */}
              <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h4 className="font-black text-sm text-slate-800">
                    ترتيب وتخصيص ظهور المعلمين في الواجهة (أعلى / أسفل):
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (!onUpdateTeachersOrder) return;
                      const sorted = [...teachers].sort((a, b) => {
                        const getCount = (tchId: string) => {
                          const cIds = courses.filter((c) => c.teacher_id === tchId).map((c) => c.id);
                          return new Set(enrollments.filter((e) => cIds.includes(e.course_id)).map((e) => e.student_id)).size;
                        };
                        return getCount(b.id) - getCount(a.id);
                      });
                      onUpdateTeachersOrder(sorted);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <span>⚡ ترتيب تلقائي للمدرسين حسب عدد الاشتراكات</span>
                  </button>
                </div>
                {teachers.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4">لا يوجد معلمون مضافون بعد.</div>
                ) : (
                  <div className="space-y-3">
                    {teachers.map((tch, index) => {
                      const tCourses = courses.filter((c) => c.teacher_id === tch.id);
                      const tStudentCount = new Set(
                        enrollments.filter((e) => tCourses.map((c) => c.id).includes(e.course_id)).map((e) => e.student_id)
                      ).size;

                      return (
                        <div
                          key={tch.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="font-black text-sm text-slate-900">{tch.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                التخصص: {tch.specialization || 'غير محدد'} · إجمالي الطلاب المشتركين: {tStudentCount} طالب
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                              <input
                                type="checkbox"
                                checked={tch.show_on_landing !== false}
                                onChange={(e) => {
                                  if (onUpdateTeacher) {
                                    onUpdateTeacher(tch.id, { show_on_landing: e.target.checked });
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-0"
                              />
                              <span>عرض في الواجهة</span>
                            </label>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => {
                                  if (index === 0 || !onUpdateTeachersOrder) return;
                                  const newArr = [...teachers];
                                  const temp = newArr[index];
                                  newArr[index] = newArr[index - 1];
                                  newArr[index - 1] = temp;
                                  onUpdateTeachersOrder(newArr);
                                }}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs shadow-2xs cursor-pointer"
                                title="تحريك لأعلى"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={index === teachers.length - 1}
                                onClick={() => {
                                  if (index === teachers.length - 1 || !onUpdateTeachersOrder) return;
                                  const newArr = [...teachers];
                                  const temp = newArr[index];
                                  newArr[index] = newArr[index + 1];
                                  newArr[index + 1] = temp;
                                  onUpdateTeachersOrder(newArr);
                                }}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs shadow-2xs cursor-pointer"
                                title="تحريك لأسفل"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Edit Course Expiry Modal */}
      {editingCourseExpiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo']" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-black text-slate-900 text-sm">تعديل صلاحية وانتهاء الكورس</h4>
                  <p className="text-xs text-slate-500">{editingCourseExpiry.title}</p>
                </div>
              </div>
              <button onClick={() => setEditingCourseExpiry(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${
                editAdminExpiryType === 'never' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="admin_modal_expiry"
                  checked={editAdminExpiryType === 'never'}
                  onChange={() => setEditAdminExpiryType('never')}
                  className="mt-0.5 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="block font-black">مستمر دائماً بدون انتهاء</span>
                  <span className="text-[10px] text-slate-500 font-normal">لا يختفي إلا إذا قمت بحذفه.</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${
                editAdminExpiryType === 'duration_days' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="admin_modal_expiry"
                  checked={editAdminExpiryType === 'duration_days'}
                  onChange={() => setEditAdminExpiryType('duration_days')}
                  className="mt-0.5 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="block font-black">مدة محددة تبدأ فور التفعيل (أسبوع أو أيام)</span>
                  <span className="text-[10px] text-slate-500 font-normal">يعد المدة من تاريخ تفعيل الطالب ثم يختفي من حسابه.</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer text-xs transition flex items-start gap-2.5 ${
                editAdminExpiryType === 'fixed_date' ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="admin_modal_expiry"
                  checked={editAdminExpiryType === 'fixed_date'}
                  onChange={() => setEditAdminExpiryType('fixed_date')}
                  className="mt-0.5 text-indigo-600 focus:ring-0"
                />
                <div>
                  <span className="block font-black">يوم محدد يختفي فيه عند الجميع</span>
                  <span className="text-[10px] text-slate-500 font-normal">تاريخ معين يختفي فيه الكورس من عند كافة الطلاب.</span>
                </div>
              </label>
            </div>

            {editAdminExpiryType === 'duration_days' && (
              <div className="p-3 bg-indigo-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>عدد الأيام بعد التفعيل:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editAdminExpiryDays}
                    onChange={(e) => setEditAdminExpiryDays(Number(e.target.value) || 7)}
                    className="w-20 px-2.5 py-1 rounded-lg border border-slate-300 text-center bg-white"
                  />
                  <span>يوم</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'أسبوع (7)', days: 7 },
                    { label: 'أسبوعين (14)', days: 14 },
                    { label: 'شهر (30)', days: 30 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setEditAdminExpiryDays(p.days)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editAdminExpiryType === 'fixed_date' && (
              <div className="p-3 bg-indigo-50 rounded-xl space-y-1">
                <label className="text-xs font-bold text-slate-700 block">اختر تاريخ الانتهاء:</label>
                <input
                  type="date"
                  value={editAdminExpiryDate}
                  onChange={(e) => setEditAdminExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCourseExpiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAdminExpiry}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe In-App Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full mb-8 p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-1">{deleteConfirm.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{deleteConfirm.message}</p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirm.onConfirm();
                  setDeleteConfirm(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                نعم، حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-['Cairo']" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">تعديل حساب الطالب</h3>
                  <p className="text-xs text-slate-500">{editingStudent.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateStudent && editingStudent) {
                  onUpdateStudent(editingStudent.id, {
                    name: editName.trim() || editingStudent.name,
                    phone: editPhone.trim(),
                    parent_phone: editParentPhone.trim(),
                    grade: editGrade.trim(),
                    password: editPassword,
                    is_blocked: editBlocked,
                  });
                }
                setEditingStudent(null);
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="block text-slate-700 mb-1">اسم الطالب الكامل</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white outline-none font-medium text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">رقم الهاتف (الطالب)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white outline-none font-mono font-medium text-xs"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">رقم هاتف ولي الأمر</label>
                <input
                  type="text"
                  value={editParentPhone}
                  onChange={(e) => setEditParentPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white outline-none font-mono font-medium text-xs"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الصف الدراسي</label>
                <input
                  type="text"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white outline-none font-medium text-xs"
                  placeholder="مثال: الصف الأول الثانوي"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">كلمة المرور (الباسورد)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white outline-none font-mono font-medium text-xs"
                  placeholder="كلمة مرور الحساب"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="block text-slate-900 font-bold">حالة الحظر / الحساب</span>
                  <span className="block text-[11px] text-slate-500 font-normal">تعطيل أو تفعيل دخول الطالب للمنصة</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editBlocked}
                    onChange={(e) => setEditBlocked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
