import React, { useState, useEffect } from 'react';
import { StudentUser } from './types';
import { X, LogIn, UserPlus, Phone, Lock, User, GraduationCap, CheckCircle2, Smartphone } from 'lucide-react';
import { getClientDeviceId } from './device';
import { ScoreLogo } from './ScoreLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onStudentLoginSuccess: (user: StudentUser) => void;
  existingStudents: StudentUser[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onStudentLoginSuccess,
  existingStudents,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);

  // Form Fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState('الصف الثالث الثانوي');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPhoneOrEmail('');
      setPassword('');
      setName('');
      setParentPhone('');
      setErrorMsg('');
      setSuccessMsg('');
      setForgotPhone('');
      setForgotNewPassword('');
    } else {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  const handleClose = () => {
    setPhoneOrEmail('');
    setPassword('');
    setName('');
    setParentPhone('');
    setErrorMsg('');
    setSuccessMsg('');
    setForgotPhone('');
    setForgotNewPassword('');
    onClose();
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setPhoneOrEmail('');
    setPassword('');
    setName('');
    setParentPhone('');
    setErrorMsg('');
    setSuccessMsg('');
    setForgotPhone('');
    setForgotNewPassword('');
  };

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmed = phoneOrEmail.trim();
      if (!trimmed || !password.trim()) {
        setErrorMsg('يرجى إدخال رقم الهاتف (أو البريد) وكلمة المرور');
        setIsLoading(false);
        return;
      }

      // Strict search: must match phone or email
      const found = existingStudents.find(
        (s) =>
          s.email.toLowerCase() === trimmed.toLowerCase() ||
          s.phone === trimmed
      );

      if (!found) {
        setErrorMsg('رقم الهاتف أو البريد الإلكتروني غير مسجل في المنصة');
        setIsLoading(false);
        return;
      }

      if (found.is_blocked) {
        setErrorMsg('🚫 تم حظر حسابك مؤقتاً، تواصل مع الدعم لرفع الحظر.');
        setIsLoading(false);
        return;
      }

      if (!found.password || found.password !== password.trim()) {
        setErrorMsg('كلمة المرور غير صحيحة');
        setIsLoading(false);
        return;
      }

      // Strict Single Device Policy for students
      const currentDeviceId = getClientDeviceId();
      if (found.device_id && found.device_id !== currentDeviceId) {
        setErrorMsg(
          '📱 عذراً، هذا الحساب مقترن بجهاز آخر مسجل مسبقاً! المنصة تسمح بجهاز واحد فقط لكل طالب لمنع مشاركة الحسابات. إذا قمت بتغيير جهازك، يرجى التواصل مع إدارة المنصة لفك ارتباط الجهاز.'
        );
        setIsLoading(false);
        return;
      }

      // If this is the student's first login or unbound device, bind to this device
      const studentToLogin: StudentUser = found.device_id ? found : { ...found, device_id: currentDeviceId };

      onStudentLoginSuccess(studentToLogin);
      handleClose();
      setIsLoading(false);
    }, 200);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !phoneOrEmail.trim() || !parentPhone.trim() || !password.trim()) {
      setErrorMsg('يرجى إكمال جميع الحقول المطلوبة (الاسم، رقم الهاتف، رقم ولي الأمر، كلمة المرور)');
      return;
    }

    const phoneTrimmed = phoneOrEmail.trim();
    const existing = existingStudents.find((s) => s.phone === phoneTrimmed);
    if (existing) {
      setErrorMsg('رقم الهاتف مسجل بالفعل، يرجى تسجيل الدخول مباشرة');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const currentDeviceId = getClientDeviceId();
      const newStudent: StudentUser = {
        id: 'std_' + Date.now(),
        name: name.trim(),
        phone: phoneTrimmed,
        parent_phone: parentPhone.trim(),
        email: `${phoneTrimmed.replace(/[^a-zA-Z0-9]/g, '')}@student.com`,
        password: password.trim(),
        grade: grade,
        device_id: currentDeviceId,
        created_at: new Date().toISOString().split('T')[0],
      };
      onStudentLoginSuccess(newStudent);
      handleClose();
      setIsLoading(false);
    }, 200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const phoneTrimmed = forgotPhone.trim();
    if (!phoneTrimmed || !forgotNewPassword.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف وكلمة المرور الجديدة');
      return;
    }

    const student = existingStudents.find((s) => s.phone === phoneTrimmed);
    if (!student) {
      setErrorMsg('رقم الهاتف غير مسجل في المنصة');
      return;
    }

    student.password = forgotNewPassword.trim();
    onStudentLoginSuccess(student);
    setSuccessMsg('تم تحديث كلمة المرور بنجاح وتسجيل الدخول!');
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] transition-all duration-300 overflow-y-auto"
      dir="rtl"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full mb-8 p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 left-5 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <ScoreLogo size="lg" className="justify-center mb-3.5" />
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            {mode === 'login' && 'تسجيل دخول الطالب'}
            {mode === 'register' && 'إنشاء حساب طالب جديد'}
            {mode === 'forgot' && 'استعادة كلمة المرور'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' && 'سجّل دخولك لمتابعة كورساتك وتفعيل الأكواد الجديدة'}
            {mode === 'register' && 'انضم لمنصة سكور أكاديمي للتسجيل في الكورسات'}
            {mode === 'forgot' && 'أدخل رقم هاتفك المسجل وكلمة المرور الجديدة'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only for login or register) */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>حساب جديد</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم الهاتف أو البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="010xxxxxxxx أو البريد"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">كلمة المرور <span className="text-rose-500">*</span></label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>جاري تسجيل الدخول...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الطالب الثلاثي <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد علي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم هاتفك <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم هاتف ولي الأمر (لإرسال درجات الامتحانات) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="011xxxxxxxx"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">السنة الدراسية</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition bg-white"
              >
                <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>جاري إنشاء الحساب...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء الحساب والتسجيل</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم هاتفك المسجل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور الجديدة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-900/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>تحديث كلمة المرور وتسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
            >
              العودة لتسجيل الدخول
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
