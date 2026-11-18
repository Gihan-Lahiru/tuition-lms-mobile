import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AppSplashScreen({
  durationMs = 3800,
  onComplete,
}) {
  const [progress, setProgress] = useState(6);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Smooth, satisfying progress animation over durationMs (3.8s)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Natural ease-out cubic curve so it starts crisp and lands gently at 100%
      const eased = 1 - Math.pow(1 - t, 2.4);
      const pct = Math.min(100, Math.round(6 + eased * 94));
      setProgress(pct);

      if (t >= 1) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 320);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  // Dynamic context-aware micro-status through the stages
  const getStatusText = () => {
    if (progress < 25) return 'Loading papers, timed quizzes & notes...';
    if (progress < 55) return 'Syncing student attendance & progress...';
    if (progress < 80) return 'Securing encrypted workspace session...';
    return 'Welcome back! Launching workspace...';
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#030611] font-sans antialiased select-none overflow-hidden transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Container simulating high-end mobile frame or full viewport */}
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col justify-between overflow-hidden bg-[#030712] px-6 py-8 text-white">

        {/* --- Background Ambient Glows & Neon Laser Beams --- */}
        {/* Top-Left Ambient Blue Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-600/30 blur-[90px]" />
        
        {/* Center Ambient Indigo Glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        
        {/* Bottom-Right Ambient Violet/Fuchsia Glow */}
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-[90px]" />

        {/* Diagonal Neon Laser Light Rays (SVG for ultra-sharp cyber neon feel) */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 400 800"
        >
          <defs>
            {/* Top-left Blue Neon Laser Gradient */}
            <linearGradient id="laserBlueGrad" x1="0%" y1="100%" x2="70%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
              <stop offset="30%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#93c5fd" stopOpacity="1" />
              <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
            </linearGradient>

            {/* Bottom-right Magenta/Violet Neon Laser Gradient */}
            <linearGradient id="laserVioletGrad" x1="100%" y1="100%" x2="40%" y2="50%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="25%" stopColor="#c026d3" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#f472b6" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#e879f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>

            {/* Bottom-left Subtle Cyan Flare */}
            <linearGradient id="laserCyanGrad" x1="0%" y1="80%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>

            {/* Glow Filters */}
            <filter id="glowBlue" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowViolet" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Top-Left Laser Ray Beam */}
          <path
            d="M -30,150 Q 60,65 190,-15"
            fill="none"
            stroke="url(#laserBlueGrad)"
            strokeWidth="2.8"
            filter="url(#glowBlue)"
          />
          <path
            d="M -40,120 Q 40,45 150,-25"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="1.2"
            opacity="0.85"
            filter="drop-shadow(0 0 4px #38bdf8)"
          />

          {/* Bottom-Right Laser Ray Beam */}
          <path
            d="M 220,810 Q 320,730 430,680"
            fill="none"
            stroke="url(#laserVioletGrad)"
            strokeWidth="3.2"
            filter="url(#glowViolet)"
          />
          <path
            d="M 270,820 Q 350,750 440,715"
            fill="none"
            stroke="#fdf4ff"
            strokeWidth="1.2"
            opacity="0.8"
            filter="drop-shadow(0 0 5px #f472b6)"
          />

          {/* Bottom-Left Cyan Sweep */}
          <path
            d="M -20,780 Q 45,790 120,815"
            fill="none"
            stroke="url(#laserCyanGrad)"
            strokeWidth="2.5"
            opacity="0.65"
          />
        </svg>

        {/* --- Top Pill Status --- */}
        <div className="pt-2 flex justify-center z-10 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[12px] font-medium text-slate-200 backdrop-blur-xl shadow-lg shadow-black/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="tracking-wide">MW Tuition Mobile Platform</span>
          </div>
        </div>

        {/* --- Center 3D Icon & Title Group --- */}
        <div className="flex flex-col items-center justify-center px-2 text-center my-auto z-10">
          
          {/* 3D Glass Icon Container */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Outer Diffuse Radiant Glow */}
            <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 opacity-70 blur-2xl animate-pulse" />
            
            {/* The 3D Glass Squircle Icon */}
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-[30px] bg-gradient-to-br from-[#3b82f6]/95 via-[#4f46e5]/95 to-[#7c3aed]/95 p-3 shadow-[0_15px_35px_rgba(79,70,229,0.5),0_0_20px_rgba(59,130,246,0.4)] border border-white/30 backdrop-blur-md overflow-hidden">
              
              {/* Glossy Diagonal Top-Reflection */}
              <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-white/25 blur-lg" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />

              {/* Graduation Cap & Open Book Crest */}
              <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 sm:h-16 sm:w-16 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
              >
                {/* Academic Cap diamond top */}
                <path
                  d="M32 12L52 22L32 32L12 22L32 12Z"
                  fill="white"
                />
                {/* Tassel */}
                <path
                  d="M48 24.5V36C48 37 47 38 46 38"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="46" cy="38.5" r="1.5" fill="white" />
                {/* Open Book Foundation */}
                <path
                  d="M18 31V43C22 41 27 41 32 44C37 41 42 41 46 43V31C42 29 37 29 32 32C27 29 22 29 18 31Z"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>

              {/* MW TUITION Text below emblem */}
              <span className="mt-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white drop-shadow">
                MW TUITION
              </span>
            </div>
          </div>

          {/* Title Row: MW TUITION + LMS Pill Badge */}
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              MW TUITION
            </span>
            <span className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3.5 py-1 text-xl sm:text-2xl font-black tracking-wide text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              LMS
            </span>
          </div>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-sm font-normal text-slate-300 tracking-wide">
            Science &amp; Chemistry Excellence • Grades 6–11 &amp; A/L
          </p>

          {/* Progress Capsule Track */}
          <div className="mt-8 w-full max-w-[320px] space-y-2.5">
            {/* Pill Capsule with Glowing Leading Bead */}
            <div className="relative h-2.5 sm:h-3 w-full rounded-full bg-white/[0.08] p-[2px] border border-white/10 backdrop-blur-md shadow-inner">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#38bdf8] via-[#6366f1] to-[#d946ef] transition-all duration-100 ease-out shadow-[0_0_16px_rgba(129,140,248,0.7)]"
                style={{ width: `${progress}%` }}
              >
                {/* Bright Glowing White Circular Bead at Leading Edge */}
                <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_#ffffff,0_0_22px_#c084fc]" />
              </div>
            </div>

            {/* Status Line & Percentage Counter */}
            <div className="flex items-center justify-between text-xs text-slate-300 px-0.5 pt-0.5">
              <span className="text-slate-300 font-normal truncate pr-2 text-left">
                {getStatusText()}
              </span>
              <span className="font-bold text-white tabular-nums shrink-0 font-mono">
                {progress}%
              </span>
            </div>
          </div>

        </div>

        {/* --- Bottom Security Footer --- */}
        <div className="pb-2 text-center flex flex-col items-center justify-center z-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span>End-to-End Encrypted Student Portal</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 tracking-wider">
            Maleesha Wickramasinghe • Version 2.1 • PWA
          </p>
        </div>

      </div>
    </div>
  );
}
