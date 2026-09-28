import React, { useState, useEffect } from 'react';
import { StudentUser } from '../types';
import { X, LogIn, UserPlus, Phone, Lock, User, ArrowLeft, GraduationCap, Sparkles, BookOpen, Users } from 'lucide-react';

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
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form Fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState('الصف الثالث الثانوي');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear fields automatically when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setPhoneOrEmail('');
      setPassword('');
      setName('');
      setParentPhone('');
      setErrorMsg('');
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
    onClose();
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setPhoneOrEmail('');
    setPassword('');
    setName('');
    setParentPhone('');
    setErrorMsg('');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        const trimmed = phoneOrEmail.trim();
        if (!trimmed) {
          setErrorMsg('يرجى إدخال رقم الهاتف أو البريد الإلكتروني');
          setIsLoading(false);
          return;
        }

        const found = existingStudents.find(
          (s) =>
            s.email.toLowerCase() === trimmed.toLowerCase() ||
            s.phone === trimmed ||
            (s.name && s.name.toLowerCase() === trimmed.toLowerCase())
        );

        if (found) {
          if (found.is_blocked) {
            setErrorMsg('🚫 تم حظر حسابك مؤقتاً، تواصل مع الدعم لرفع الحظر.');
            setIsLoading(false);
            return;
          }
          onStudentLoginSuccess(found);
          handleClose();
        } else {
          // If student is logging in for first time without prior register, create basic record
          const created: StudentUser = {
            id: 'std_' + Date.now(),
            name: trimmed.includes('@') ? trimmed.split('@')[0] : `طالب (${trimmed})`,
            email: trimmed.includes('@') ? trimmed : `${trimmed}@student.com`,
            phone: trimmed.includes('@') ? '01000000000' : trimmed,
            parent_phone: parentPhone.trim() || '',
            grade: 'الصف الثالث الثانوي',
            created_at: new Date().toISOString().split('T')[0],
          };
          onStudentLoginSuccess(created);
          handleClose();
        }
      } else {
        // Register Mode
        if (!name.trim() || !phoneOrEmail.trim()) {
          setErrorMsg('يرجى كتابة اسم الطالب ورقم هاتفه');
          setIsLoading(false);
          return;
        }

        if (!parentPhone.trim()) {
          setErrorMsg('يرجى كتابة رقم هاتف ولي الأمر (مطلوب)');
          setIsLoading(false);
          return;
        }

        const created: StudentUser = {
          id: 'std_' + Date.now(),
          name: name.trim(),
          phone: phoneOrEmail.trim(),
          parent_phone: parentPhone.trim(),
          email: `${phoneOrEmail.trim().replace(/[^a-zA-Z0-9]/g, '')}@student.com`,
          password: password.trim(),
          grade: grade,
          created_at: new Date().toISOString().split('T')[0],
        };
        onStudentLoginSuccess(created);
        handleClose();
      }
      setIsLoading(false);
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] transition-all duration-300"
      dir="rtl"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 left-5 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Canva Icon & Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-indigo-500/25">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            {mode === 'login' ? 'تسجيل دخول الطالب' : 'إنشاء حساب طالب جديد'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'سجّل دخولك لمتابعة كورساتك وتفعيل الأكواد الجديدة'
              : 'انضم للمنصة الآن لتفعيل الكورسات وخوض الامتحانات'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>حساب جديد</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الطالب الثلاثي أو الرباعي <span className="text-rose-500">*</span>
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
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رقم هاتف الطالب (واتساب) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="01XXXXXXXXX"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم هاتف ولي الأمر (إلزامي لمتابعة الدرجات والنتائج) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition font-mono"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الصف الدراسي</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 text-xs font-semibold bg-white outline-none"
                >
                  <option value="أولى ثانوي">أولى ثانوي (الصف الأول الثانوي)</option>
                  <option value="ثانية ثانوي">ثانية ثانوي (الصف الثاني الثانوي)</option>
                  <option value="ثالثة ثانوي">ثالثة ثانوي (الصف الثالث الثانوي)</option>
                  <option value="ثانية بكالوريا">ثانية بكالوريا</option>
                  <option value="المرحلة الإعدادية">المرحلة الإعدادية</option>
                  <option value="أخرى">مرحلة أخرى</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold outline-none transition font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>جاري التحقق...</span>
            ) : mode === 'login' ? (
              <>
                <span>دخول لحسابي</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>إنشاء الحساب والبدء</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
