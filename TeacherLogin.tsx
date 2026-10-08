import React, { useState } from 'react';
import { Teacher } from './types';
import {
  Users,
  Lock,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ScoreLogo } from './ScoreLogo';

interface TeacherLoginProps {
  teachers: Teacher[];
  onLoginSuccess: (teacher: Teacher) => void;
  onBackToHome: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({
  teachers,
  onLoginSuccess,
  onBackToHome,
}) => {
  const [loginMethod, setLoginMethod] = useState<'select' | 'credentials'>('select');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      let targetTeacher: Teacher | undefined;

      if (loginMethod === 'select') {
        if (!selectedTeacherId) {
          setErrorMsg('يرجى اختيار اسم المعلم من القائمة.');
          setIsLoading(false);
          return;
        }
        targetTeacher = teachers.find((t) => t.id === selectedTeacherId);
      } else {
        const cleanInput = phoneOrEmail.trim().toLowerCase();
        if (!cleanInput) {
          setErrorMsg('يرجى إدخال رقم الهاتف أو البريد الإلكتروني الخاص بحسابك.');
          setIsLoading(false);
          return;
        }
        targetTeacher = teachers.find(
          (t) =>
            t.phone?.trim() === cleanInput ||
            t.email?.toLowerCase().trim() === cleanInput ||
            t.name.toLowerCase().includes(cleanInput)
        );
      }

      if (!targetTeacher) {
        setErrorMsg('حساب المدرس غير موجود! يرجى مراجعة مدير المنصة لإنشاء حسابك وتفعيله.');
        setIsLoading(false);
        return;
      }

      // Check if teacher is blocked by admin
      if (targetTeacher.is_blocked) {
        setErrorMsg(
          targetTeacher.blocked_reason
            ? `🚫 تم حظر حسابك: ${targetTeacher.blocked_reason}. يرجى التواصل مع إدارة المنصة.`
            : '🚫 عذراً، تم حظر حسابك مؤقتاً بواسطة إدارة المنصة. يرجى التواصل مع الإدارة لفك الحظر وتفعيل الحساب.'
        );
        setIsLoading(false);
        return;
      }

      // Check teacher password if configured
      if (
        targetTeacher.password &&
        targetTeacher.password.trim() !== '' &&
        targetTeacher.password !== password.trim()
      ) {
        setErrorMsg('كلمة المرور غير صحيحة! يرجى التأكد من كلمة المرور المسلمة لك من الإدارة.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(targetTeacher);
      setIsLoading(false);
    }, 250);
  };

  const currentTeacherObj = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div
      className="min-h-screen bg-[#FBFBFE] font-['Cairo'] text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white"
      dir="rtl"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoreLogo size="sm" />
            <div>
              <h1 className="font-extrabold text-base text-slate-900 leading-tight">بوابة المعلمين المسجلين</h1>
              <p className="text-[11px] text-slate-500 font-medium">تسجيل الدخول إلى لوحة التحكم الخاصة بك</p>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <ScoreLogo size="lg" className="justify-center mb-3" />
            <h2 className="text-2xl font-black text-slate-900">تسجيل دخول المعلم</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              سجّل دخولك للوصول إلى كورساتك، طلابك المشتركين، ونظام الامتحانات وتوليد الأكواد
            </p>
          </div>

          {/* Unlimited Devices & Admin Note */}
          <div className="mb-5 space-y-2">
            <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>متاح الدخول للوحة المعلم من أي عدد من الأجهزة والمتصفحات بحرية.</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>حسابات المعلمين يتم إنشاؤها وتفعيلها بواسطة إدارة المنصة.</span>
            </div>
          </div>

          {teachers.length === 0 ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-extrabold text-amber-900 text-sm">لا يوجد معلمون مسجلون بعد</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                يرجى من مدير المنصة الدخول إلى صفحة المدير (#admin) وإضافة حساب المعلم وكلمة المرور الخاصة به.
              </p>
            </div>
          ) : (
            <>
              {/* Method Switcher */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('select');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition ${
                    loginMethod === 'select'
                      ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  اختيار اسم المعلم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('credentials');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition ${
                    loginMethod === 'credentials'
                      ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  رقم الهاتف / الإيميل
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {loginMethod === 'select' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اختر اسمك من قائمة المعلمين <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold bg-white outline-none transition"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.specialization ? `(${t.specialization})` : ''}
                        </option>
                      ))}
                    </select>

                    {currentTeacherObj && currentTeacherObj.image_data && (
                      <div className="flex items-center gap-3 mt-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <img
                          src={currentTeacherObj.image_data}
                          alt={currentTeacherObj.name}
                          className="w-10 h-10 rounded-xl object-cover border border-indigo-200"
                        />
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {currentTeacherObj.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {currentTeacherObj.specialization || 'معلم معتمد'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      رقم الهاتف أو البريد الإلكتروني <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="01XXXXXXXXX أو teacher@platform.com"
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-semibold outline-none transition"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">كلمة المرور الخاصة بك</label>
                    <span className="text-[10px] text-slate-400">المسلمة لك من الإدارة</span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:border-indigo-600 text-xs font-bold outline-none font-mono transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>جاري التحقق...</span>
                  ) : (
                    <>
                      <span>دخول إلى لوحة التحكم</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
