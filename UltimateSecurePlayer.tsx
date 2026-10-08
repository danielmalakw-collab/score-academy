import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const extractYouTubeId = (input?: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  if (
    !trimmed ||
    trimmed === '/' ||
    trimmed === '#' ||
    trimmed === window.location.origin ||
    trimmed === window.location.href
  ) {
    return '';
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2].length === 11) return match[2];

  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch) return extractYouTubeId(srcMatch[1]);

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return '';
};

export interface UltimateSecurePlayerProps {
  videoInput?: string;
  studentName?: string;
  studentPhone?: string;
  title?: string;
  onVideoPlay?: () => void;
}

export const UltimateSecurePlayer: React.FC<UltimateSecurePlayerProps> = ({
  videoInput,
  studentName,
  studentPhone,
  title,
  onVideoPlay,
}) => {
  const videoId = extractYouTubeId(videoInput);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const [playerId] = useState(() => `yt-player-${Math.random().toString(36).slice(2, 9)}`);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });

  // دالة إجبار الجودة بين 720p و 480p لمنع الـ 4K والحفاظ على باقة الطالب
  const enforceOptimizedQuality = (player: any) => {
    if (!player || typeof player.getAvailableQualityLevels !== 'function') return;
    try {
      const availableQualities = player.getAvailableQualityLevels();
      if (Array.isArray(availableQualities)) {
        if (availableQualities.includes('tiny')) {
          player.setPlaybackQuality('tiny'); // 720p
        } else if (availableQualities.includes('large')) {
          player.setPlaybackQuality('tiny'); // 480p
        }
      }
    } catch {}
  };

  // نظام إخفاء الشريط تلقائياً عند توقف الماوس (بعد 2.5 ثانية)
  const resetControlTimeout = () => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // العلامة المائية المتحركة واسعة المجال
  useEffect(() => {
    const corners = [
      { top: '8%', left: '8%' },
      { top: '8%', left: '70%' },
      { top: '75%', left: '8%' },
      { top: '75%', left: '70%' },
      { top: '40%', left: '40%' },
      { top: '15%', left: '50%' },
      { top: '65%', left: '25%' },
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % corners.length;
      setWatermarkPos(corners[index]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // تهيئة مشغل يوتيوب
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    const initPlayer = () => {
      if (destroyed) return;
      if (!window.YT || !window.YT.Player) return;

      const targetEl = document.getElementById(playerId);
      if (!targetEl) return;

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById(videoId);
          return;
        } catch {
          // recreate
        }
      }

      try {
        playerRef.current = new window.YT.Player(playerId, {
          videoId: videoId,
          playerVars: {
            controls: 0,
            rel: 0,
            modestbranding: 1,
            disablekb: 1,
            showinfo: 0,
            fs: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              try {
                const dur = e.target.getDuration();
                if (typeof dur === 'number' && dur > 0) {
                  setDuration(dur);
                }
                enforceOptimizedQuality(e.target);
              } catch {}
            },
            onStateChange: (e: any) => {
              if (window.YT && window.YT.PlayerState) {
                if (e.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  enforceOptimizedQuality(e.target);
                  if (timerRef.current) clearTimeout(timerRef.current);
                  timerRef.current = setTimeout(() => setShowControls(false), 2500);
                  if (onVideoPlay) onVideoPlay();
                }
                if (e.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  setShowControls(true);
                  if (timerRef.current) clearTimeout(timerRef.current);
                }
                if (e.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  setShowControls(true);
                  if (timerRef.current) clearTimeout(timerRef.current);
                }
              }
            },
          },
        });
      } catch (err) {
        console.warn('Error initializing YouTube Player API:', err);
      }
    };

    if (!window.YT || !window.YT.Player) {
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      destroyed = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch {}
      }
    };
  }, [videoId, playerId]);

  // تحديث شريط التقدم
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && isPlaying) {
        try {
          const cur = playerRef.current.getCurrentTime();
          if (typeof cur === 'number' && !isNaN(cur)) {
            setCurrentTime(cur);
          }
          if (typeof playerRef.current.getDuration === 'function') {
            const dur = playerRef.current.getDuration();
            if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
              setDuration(dur);
            }
          }
        } catch {}
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
        setIsPlaying(false);
        setShowControls(true);
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowControls(false), 2500);
      }
    } catch (err) {
      console.warn('togglePlay error:', err);
    }
  };

  const seek = (seconds: number) => {
    if (!playerRef.current) return;
    const newTime = Math.min(Math.max(currentTime + seconds, 0), duration || 100);
    try {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(newTime, true);
      }
    } catch {}
    setCurrentTime(newTime);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(newTime, true);
        }
      } catch {}
      setCurrentTime(newTime);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch {}
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!videoId) {
    return (
      <div
        style={{
          padding: '50px 20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
        }}
      >
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          ⚠️ لم يتم تحديد فيديو للمحاضرة بعد
        </p>
      </div>
    );
  }

  const watermarkText = `${studentName || 'طالب المنصة'}${studentPhone ? ` - ${studentPhone}` : ''}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '56.25%',
        backgroundColor: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        border: 'none',
        userSelect: 'none',
        cursor: showControls ? 'default' : 'none',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div
        id={playerId}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* منطقة الضغط للتشغيل والإيقاف */}
      <div
        onClick={togglePlay}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 65px)',
          zIndex: 5,
          cursor: showControls ? 'pointer' : 'none',
          background: 'transparent',
        }}
      />

      {/* العلامة المائية */}
      <div
        style={{
          position: 'absolute',
          top: watermarkPos.top,
          left: watermarkPos.left,
          color: 'rgba(239, 68, 68, 0.8)',
          fontSize: '13px',
          fontWeight: 300,
          pointerEvents: 'none',
          zIndex: 10,
          transition: 'none',
          direction: 'rtl',
          textShadow: '0px 0px 3px rgba(0,0,0,0.9)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {watermarkText}
      </div>

      {/* شريط التحكم السفلي */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '65px',
          backgroundColor: 'rgba(15, 7, 22, 0.95)',
          borderTop: '1px solid rgba(168, 85, 247, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 15px',
          zIndex: 20,
          direction: 'rtl',
          boxSizing: 'border-box',
          opacity: showControls || !isPlaying ? 1 : 0,
          visibility: showControls || !isPlaying ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}
      >
        {/* شريط الوقت والمدى (من الشمال لليمين LTR دائماً) */}
        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            marginBottom: '4px',
            direction: 'ltr',
          }}
        >
          <span
            dir="ltr"
            style={{
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              minWidth: '38px',
              textAlign: 'center',
              direction: 'ltr',
            }}
          >
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            dir="ltr"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
            style={{
              flex: 1,
              accentColor: '#a855f7',
              cursor: 'pointer',
              height: '6px',
              direction: 'ltr',
              writingMode: 'horizontal-tb',
            }}
          />
          <span
            dir="ltr"
            style={{
              color: '#bbb',
              fontSize: '11px',
              fontFamily: 'monospace',
              minWidth: '38px',
              textAlign: 'center',
              direction: 'ltr',
            }}
          >
            {formatTime(duration)}
          </span>
        </div>

        {/* الأزرار والسرعة وملء الشاشة */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'إيقاف' : 'تشغيل'}
              style={{
                background: '#7e22ce',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(126, 34, 206, 0.4)',
              }}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => seek(-10)}
              style={{
                background: 'transparent',
                color: '#e9d5ff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              10s
            </button>

            <button
              type="button"
              onClick={() => seek(10)}
              style={{
                background: 'transparent',
                color: '#e9d5ff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px',
              }}
            >
              10s
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>

            <select
              value={playbackRate}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              style={{
                background: '#2e1065',
                color: '#fff',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '6px',
                padding: '2px 5px',
                fontSize: '11px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              background: 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Aliases for compatibility
export const AdvancedSecurePlayer = UltimateSecurePlayer;
export const SecurePurplePlayer = UltimateSecurePlayer;
export default UltimateSecurePlayer;
