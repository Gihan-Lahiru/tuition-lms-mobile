import { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import LMSLogo from '../branding/LMSLogo';

export default function AppSplashScreen({
  durationMs = 2600,
  onComplete,
}) {
  const [progress, setProgress] = useState(8);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Smooth, realistic progress animation over durationMs
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out cubic curve for natural, satisfying motion
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.min(100, Math.round(8 + eased * 92));
      setProgress(pct);

      if (t >= 1) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 280);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  // Context-aware micro-status
  const getStatusText = () => {
    if (progress < 25) return 'Initializing MW Tuition Portal...';
    if (progress < 50) return 'Loading past papers, model papers & notes...';
    if (progress < 75) return 'Syncing timed MCQ quiz banks...';
    if (progress < 92) return 'Preparing your personalized dashboard...';
    return 'Welcome back! Launching workspace...';
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b14] font-sans antialiased select-none overflow-hidden transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Cosmic Aura Background */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-[110px] animate-pulse" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-28 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[110px]" />

      <div className="relative mx-auto flex h-[100dvh] md:h-[min(calc(100dvh-2.5rem),840px)] w-full max-w-[430px] flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0a0f1d]/90 via-[#0e172e]/90 to-[#120f26]/90 p-6 text-white backdrop-blur-xl md:rounded-[36px] md:border md:border-white/10 md:shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
        
        {/* Top Status Header */}
        <div className="pt-4 flex justify-center animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur-md shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span>MW Tuition Mobile Platform</span>
          </div>
        </div>

        {/* Center Hero: Glowing 3D App Icon & Typography */}
        <div className="flex flex-col items-center justify-center px-4 text-center my-auto">
          {/* 3D App Icon with Halo Ripple */}
          <div className="relative mb-7">
            {/* Pulsing Aura Rings */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-fuchsia-500 blur-2xl opacity-60 animate-pulse" />
            <div className="absolute -inset-2 rounded-[28px] border border-indigo-400/20 animate-ping opacity-25" />

            {/* Premium Icon Badge */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[26px] bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700 p-0.5 shadow-2xl shadow-indigo-500/40 ring-1 ring-white/30">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-[24px] bg-gradient-to-b from-white/10 via-transparent to-black/20 backdrop-blur-sm">
                <GraduationCap className="h-11 w-11 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]" />
                <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-blue-100">
                  MW Tuition
                </span>
              </div>
            </div>
          </div>

          {/* App Title */}
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl flex items-center justify-center gap-2">
            <span>MW TUITION</span>
            <span className="rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 px-2 py-0.5 text-lg sm:text-xl font-extrabold text-white shadow-md shadow-indigo-500/30">
              LMS
            </span>
          </h1>

          <p className="mt-2.5 text-xs font-medium text-slate-300 max-w-[280px] leading-relaxed">
            Science &amp; Chemistry Excellence • Grades 6–11 &amp; A/L
          </p>

          {/* Modern Capsule Loading Bar */}
          <div className="mt-8 w-full max-w-[280px] space-y-2.5">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10 p-[2px] border border-white/10 backdrop-blur-md">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 transition-all duration-100 ease-out shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                style={{ width: `${progress}%` }}
              >
                {/* Glowing Leading Dot */}
                <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
              </div>
            </div>

            {/* Dynamic Status Text & Percentage */}
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 px-1">
              <span className="text-blue-300 truncate pr-2 text-left">
                {getStatusText()}
              </span>
              <span className="font-mono font-bold text-white tabular-nums shrink-0">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="pb-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>End-to-End Encrypted Student Portal</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">
            Maleesha Wickramasinghe • Version 2.1 PWA
          </p>
        </div>

      </div>
    </div>
  );
}
