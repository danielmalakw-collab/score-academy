import React from 'react';

interface ScoreLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export const ScoreLogo: React.FC<ScoreLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textColor = 'text-slate-900',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-lg rounded-xl',
    md: 'w-11 h-11 text-2xl rounded-2xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 text-3xl sm:text-4xl rounded-2xl',
    xl: 'w-20 h-20 text-5xl rounded-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Emblem: Arabic letter "س" in vibrant violet/indigo gradient */}
      <div
        className={`relative bg-gradient-to-tr from-violet-700 via-indigo-600 to-purple-500 shadow-md shadow-indigo-600/30 flex items-center justify-center text-white font-black font-['Cairo'] select-none border border-white/20 overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105 ${sizeMap[size]}`}
        aria-label="سكور أكاديمي"
      >
        {/* Subtle shine glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />
        <span className="relative z-10 leading-none drop-shadow-md pb-0.5">س</span>
      </div>

      {showText && (
        <div>
          <h1 className={`font-black tracking-tight ${size === 'lg' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'} ${textColor}`}>
            سكور أكاديمي
          </h1>
        </div>
      )}
    </div>
  );
};
