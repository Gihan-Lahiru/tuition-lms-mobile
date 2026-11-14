import { useState, useEffect } from 'react';
import LMSLogo from '../branding/LMSLogo';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function AppSplashScreen({
  durationMs = 1800,
  onComplete,
}) {
  const [progress, setProgress] = useState(12);

  // Dynamic progress animation from 12% to 100% over the duration
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  // Dynamic context-aware status updates as it loads
  const getStatusText = () => {
    if (progress < 30) return 'Connecting to MW Tuition Network...';
    if (progress < 65) return 'Loading papers, timed quizzes & notes...';
    if (progress < 90) return 'Syncing student & teacher records...';
    return 'Welcome! Launching workspace...';
  };

  return (
    <div className="min-h-screen bg-slate-950/95 md:py-6 md:px-4 flex items-center justify-center font-sans antialiased select-none">
      <div className="relative mx-auto flex h-[100dvh] md:h-[min(calc(100dvh-2.5rem),840px)] w-full max-w-[430px] flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl md:rounded-[34px] md:border-[6px] md:border-slate-800">
        
        {/* Soft Ambient Background Glows */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-600/25 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />

        {/* Top App Badge */}
        <div className="pt-8 px-6 flex justify-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Mobile Learning Experience</span>
          </div>
        </div>

        {/* Center Hero: Logo & Title */}
        <div className="flex flex-col items-center justify-center px-6 text-center animate-fade-in">
          {/* Logo with Soft Radiant Aura */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-blue-500/35 blur-2xl animate-pulse" />
            <div className="animate-pulse-subtle">
              <LMSLogo size="2xl" variant="gradient" />
            </div>
          </div>

          {/* Clean App Title */}
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            MW TUITION <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">LMS</span>
          </h1>

          <p className="mt-2 text-xs font-medium text-slate-400 max-w-[290px] leading-relaxed">
            Smart Mobile Learning Platform • O/L &amp; A/L Mastery
          </p>

          {/* Clean Animated Progress Bar & Percentage */}
          <div className="mt-9 w-full max-w-[270px] space-y-3">
            {/* Slim Track & Animated Fill */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10 p-[1px] border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-violet-500 transition-all duration-100 ease-out shadow-lg shadow-blue-500/50"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Percentage & Status Feedback */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-0.5">
              <span className="text-blue-300 transition-all duration-300">
                {getStatusText()}
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Security & Version Tag */}
        <div className="pb-8 px-6 text-center animate-fade-in-delayed">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Official Student &amp; Teacher Portal</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">
            MW Tuition Institute • v1.2 PWA
          </p>
        </div>

      </div>
    </div>
  );
}
