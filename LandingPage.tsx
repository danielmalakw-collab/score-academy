import React, { useState } from 'react';
import { Teacher, Course } from './types';
import {
  BookOpen,
  GraduationCap,
  Users,
  Lock,
  ArrowLeft,
  Star,
  Sparkles,
  ShieldCheck,
  PlayCircle,
  Gift,
  CheckCircle2,
  Phone,
  Award,
  Share2,
  ExternalLink,
  Globe,
  X
} from 'lucide-react';
import { SOCIAL_HUB_URL, getSocialHubUrl, setCustomSocialHubUrl } from './config';

interface LandingPageProps {
  teachers: Teacher[];
  courses: Course[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateToTeacherLogin?: () => void;
  onNavigateToAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  teachers,
  courses,
  onOpenAuth,
  onNavigateToTeacherLogin,
  onNavigateToAdmin,
}) => {
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [tempSocialUrl, setTempSocialUrl] = useState(getSocialHubUrl());
  const [socialSavedNotice, setSocialSavedNotice] = useState(false);

  const handleOpenSocialHub = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const currentUrl = getSocialHubUrl();
    if (currentUrl && currentUrl.trim().length > 0) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowSocialModal(true);
    }
  };

  const handleSaveSocialUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSocialHubUrl(tempSocialUrl);
    setSocialSavedNotice(true);
    setTimeout(() => setSocialSavedNotice(false), 3000);
    if (tempSocialUrl.trim().length > 0) {
      window.open(tempSocialUrl.trim(), '_blank', 'noopener,noreferrer');
      setShowSocialModal(false);
    }
  };
  return (
    <div
      className="min-h-screen bg-[#FBFBFE] text-slate-800 flex flex-col font-['Cairo'] selection:bg-indigo-500 selection:text-white transition-colors duration-200"
      dir="rtl"
    >
      {/* Top Canva-style Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 tracking-tight">منصتي التعليمية</h1>
              <p className="text-[11px] text-slate-500 font-medium">بوابتك للتعلم والتفوق الدراسي</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all duration-200 border border-indigo-200 cursor-pointer active:scale-95"
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span>إنشاء حساب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-[#FBFBFE] pt-16 pb-24 border-b border-slate-200/60">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-xs text-indigo-700 text-xs font-bold mb-6">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>تجربة تعليمية فائقة الجمال والتنظيم</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight max-w-4xl mx-auto mb-6">
            تعلّم بطريقة أسهل وأذكى مع{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              نخبة المعلمين المتخصصين
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            شروحات مبسطة، كورسات مدفوعة ومجانية، امتحانات إلكترونية تفاعلية، وتفعيل فوري بالأكواد. سجّل حسابك وابدأ التعلم الآن.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ابدأ التعلم الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
            >
              تسجيل الدخول
            </button>
          </div>

          {/* Canva-style Feature Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center hover:-translate-y-1 transition-transform duration-200">
              <Gift className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <div className="font-extrabold text-slate-900 text-sm">كورسات مجانية</div>
              <div className="text-xs text-slate-400 mt-0.5">تفعيل بنقرة واحدة مجاناً</div>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center hover:-translate-y-1 transition-transform duration-200">
              <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="font-extrabold text-slate-900 text-sm">أكواد مؤمنة</div>
              <div className="text-xs text-slate-400 mt-0.5">تفعيل فوري لمرة واحدة</div>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center hover:-translate-y-1 transition-transform duration-200">
              <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="font-extrabold text-slate-900 text-sm">امتحانات ذكية</div>
              <div className="text-xs text-slate-400 mt-0.5">تصحيح فوري وإعلان الدرجة</div>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center hover:-translate-y-1 transition-transform duration-200">
              <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="font-extrabold text-slate-900 text-sm">مدرسون خبراء</div>
              <div className="text-xs text-slate-400 mt-0.5">لوحة مستقلة ومتابعة دورية</div>
            </div>
          </div>
        </div>
      </section>

      {/* Teachers Section - ENLARGED BEAUTIFUL CANVA CARDS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-indigo-600 text-xs font-black uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-lg">
              نخبة الأساتذة والمعلمين
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">معلمو المنصة الأفاضل</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              اختر أستاذك وتعرف على خبراته واستعرض كافة كورساته وشروحاته
            </p>
          </div>
          <button
            onClick={() => onOpenAuth('login')}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-extrabold inline-flex items-center gap-1.5 self-start md:self-auto cursor-pointer bg-white px-4 py-2 rounded-2xl border border-indigo-200 shadow-2xs hover:shadow-xs transition"
          >
            <span>عرض كافة المدرسين والكورسات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {teachers.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center border border-slate-200/80 shadow-xs">
            <Users className="w-14 h-14 text-indigo-300 mx-auto mb-4" />
            <h4 className="font-extrabold text-slate-800 text-lg">لا يوجد معلمون مضافون حتى الآن</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
              يقوم مدير المنصة بإضافة المعلمين واعتماد حساباتهم، وستظهر بطاقاتهم هنا فور إضافتهم.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {teachers.map((teacher) => {
              const teacherCoursesList = courses.filter((c) => c.teacher_id === teacher.id);
              const freeCount = teacherCoursesList.filter((c) => c.price === 0 || c.is_free).length;

              return (
                <div
                  key={teacher.id}
                  onClick={() => onOpenAuth('login')}
                  className="group bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-100 hover:border-indigo-400 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Decorative background aura */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-50 rounded-full blur-3xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    {/* ENLARGED PROMINENT TEACHER AVATAR */}
                    <div className="relative shrink-0 mb-4">
                      {teacher.image_data ? (
                        <img
                          src={teacher.image_data}
                          alt={teacher.name}
                          className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl object-cover ring-4 ring-indigo-500/25 group-hover:ring-indigo-600 shadow-xl group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white font-black text-4xl sm:text-5xl flex items-center justify-center ring-4 ring-indigo-500/25 shadow-xl group-hover:scale-105 transition-all duration-300">
                          {teacher.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-md border-3 border-white">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                    </div>

                    {/* ENLARGED PROMINENT TEACHER NAME & SPECIALIZATION */}
                    <div className="w-full mb-3">
                      <span className="inline-block text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl mb-2">
                        {teacher.specialization || 'مدرس معتمد'}
                      </span>
                      <h4 className="font-black text-slate-900 text-xl sm:text-2xl md:text-3xl group-hover:text-indigo-600 transition-colors leading-tight">
                        {teacher.name}
                      </h4>
                      {teacher.phone && (
                        <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5 mt-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{teacher.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Bio Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 bg-slate-50/90 p-3 rounded-2xl border border-slate-100 w-full text-right">
                      {teacher.bio || 'معلم خبير يقدم شروحات متميزة وحلولاً نموذجية للمسائل والامتحانات الدورية.'}
                    </p>

                    {/* Quick Stats Badges */}
                    <div className="grid grid-cols-2 gap-2 mb-4 w-full text-center">
                      <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/60">
                        <span className="block text-indigo-700 font-black text-sm sm:text-base">{teacherCoursesList.length}</span>
                        <span className="text-[10px] sm:text-xs text-slate-500 font-bold">كورسات ومحاضرات</span>
                      </div>
                      <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/60">
                        <span className="block text-emerald-700 font-black text-sm sm:text-base">{freeCount}</span>
                        <span className="text-[10px] sm:text-xs text-slate-500 font-bold">كورس مجاني</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
                    <span className="text-slate-500 font-bold text-xs flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>كورسات المدرس</span>
                    </span>
                    <span className="text-indigo-600 font-extrabold group-hover:translate-x-[-3px] transition-transform inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl text-xs">
                      <span>عرض الكورسات</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Courses Showcase Section */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-indigo-600 text-xs font-black uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-lg">
              الكورسات والمحتوى
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">أحدث الكورسات التعليمية</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">
              تصفح الكورسات المجانية وأضفها لحسابك مباشرة، أو فعّل الكورسات المقفولة بكود التفعيل لمرة واحدة.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="p-14 text-center border-2 border-dashed border-slate-200 rounded-3xl max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-extrabold text-slate-700 text-sm">لا توجد كورسات معروضة حالياً</h4>
              <p className="text-xs text-slate-400 mt-1">
                سيتم نشر الكورسات هنا فور قيام المعلمين برفع محتواهم من لوحة التحكم.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6">
              {courses.map((course) => {
                const teacher = teachers.find((t) => t.id === course.teacher_id);
                const isFree = course.price === 0 || course.is_free;

                return (
                  <div
                    key={course.id}
                    onClick={() => onOpenAuth('login')}
                    className="group bg-[#FBFBFE] rounded-3xl p-4 sm:p-5 border border-slate-200/90 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden min-h-[300px] sm:min-h-[330px]"
                  >
                    {/* ENLARGED PROMINENT TEACHER HEADER IN COURSE CARD */}
                    <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs group-hover:border-indigo-200 transition-colors">
                      {teacher?.image_data ? (
                        <img
                          src={teacher.image_data}
                          alt={teacher.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-indigo-500/25 shadow-md shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md shrink-0">
                          {teacher ? teacher.name.charAt(0) : 'م'}
                        </div>
                      )}
                      <div className="overflow-hidden min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-1">
                          المعلم
                        </span>
                        <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-indigo-600 transition-colors truncate leading-tight">
                          {teacher ? `أ. ${teacher.name}` : 'معلم المنصة'}
                        </h4>
                        {teacher?.specialization && (
                          <span className="text-xs text-slate-500 font-medium truncate block mt-0.5">
                            {teacher.specialization}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Info: Course Title & Pricing */}
                    <div className="flex-1 flex flex-col justify-center py-3 min-h-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h5 className="font-extrabold text-slate-800 text-sm sm:text-base truncate flex-1" title={course.title}>
                          {course.title}
                        </h5>
                        {isFree ? (
                          <span className="bg-emerald-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1 shadow-2xs">
                            <Gift className="w-3 h-3" />
                            مجاني
                          </span>
                        ) : (
                          <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shrink-0 shadow-2xs">
                            {course.price} ج.م
                          </span>
                        )}
                      </div>
                      {course.grade && (
                        <span className="text-xs text-slate-500 font-semibold block truncate">
                          📚 المرحلة الدراسية: {course.grade}
                        </span>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="shrink-0 pt-2 border-t border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAuth('login');
                        }}
                        className={`w-full py-2.5 sm:py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                          isFree
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <span>{isFree ? 'إضافة مجاناً' : 'تفعيل بكود'}</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              م
            </div>
            <div>
              <p className="font-black text-white text-sm">منصتي التعليمية الذكية</p>
              <p className="text-xs text-slate-400">إدارة الكورسات، الامتحانات التفاعلية، والأكواد وحيدة الاستخدام</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            {/* Social Media Link / Custom Hub Gateway */}
            <button
              type="button"
              onClick={handleOpenSocialHub}
              className="text-slate-400 hover:text-sky-400 transition cursor-pointer font-bold flex items-center gap-1.5"
              title="موقع السوشيال ميديا المجمع"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>موقع السوشيال ميديا</span>
            </button>

            {onNavigateToTeacherLogin && (
              <button
                onClick={onNavigateToTeacherLogin}
                className="text-slate-400 hover:text-indigo-300 transition cursor-pointer font-bold"
                title="بوابة تسجيل دخول المعلم"
              >
                تسجيل دخول المعلمين
              </button>
            )}
            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="text-slate-500 hover:text-slate-300 transition cursor-pointer flex items-center gap-1"
                title="لوحة تحكم المدير"
              >
                <Lock className="w-3 h-3" />
                <span>إدارة المنصة</span>
              </button>
            )}
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* Social Hub Modal for Setting / Checking the External Social Hub Link */}
      {showSocialModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Cairo'] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSocialModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">موقع السوشيال ميديا المجمع</h3>
                <p className="text-xs text-slate-500">رابط موقعك الخارجي لجميع حسابات التواصل</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-950 space-y-2">
              <p className="font-bold text-sky-900">
                🌐 تم ترك مكان الرابط فارغاً كما طلبت تماماً!
              </p>
              <p className="text-slate-600 leading-relaxed">
                عندما تنتهي من إنشاء موقعك الجديد المجمع لروابط السوشيال ميديا، يمكنك وضع الرابط في ملف <code className="bg-white px-1.5 py-0.5 rounded font-mono text-indigo-700 font-bold">src/config.ts</code> أو إدخاله في الحقل أدناه ليتم التوجيه إليه مباشرة.
              </p>
            </div>

            <form onSubmit={handleSaveSocialUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط موقع السوشيال ميديا المجمع:
                </label>
                <input
                  type="url"
                  placeholder="https://your-social-hub.com"
                  value={tempSocialUrl}
                  onChange={(e) => setTempSocialUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-left focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {socialSavedNotice && (
                <p className="text-xs font-bold text-emerald-600">✓ تم حفظ الرابط بنجاح وسيتم فتح موقعك الآن</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>حفظ والانتقال للموقع</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSocialModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
