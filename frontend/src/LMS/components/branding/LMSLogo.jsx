import { useState } from 'react';

/**
 * LMSLogo Component
 * Renders an attractive, high-definition emblem.
 * Automatically tries to load a custom logo image (from customSrc or /lms/icons/logo.png).
 * If no image is available or it fails to load, renders a sleek, premium vector emblem.
 */
export default function LMSLogo({
  size = 'md',
  showText = false,
  subtitle = 'Tuition LMS',
  customSrc,
  className = '',
  textColor = 'text-slate-900',
  subColor = 'text-slate-500',
  variant = 'gradient', // 'gradient' | 'white' | 'glass'
}) {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeMap = {
    sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-sm', sub: 'text-[10px]', rounded: 'rounded-xl' },
    md: { box: 'h-11 w-11', icon: 'h-6 w-6', text: 'text-base', sub: 'text-[11px]', rounded: 'rounded-2xl' },
    lg: { box: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-lg', sub: 'text-xs', rounded: 'rounded-2xl' },
    xl: { box: 'h-20 w-20', icon: 'h-10 w-10', text: 'text-xl', sub: 'text-xs', rounded: 'rounded-3xl' },
    '2xl': { box: 'h-24 w-24', icon: 'h-12 w-12', text: 'text-2xl', sub: 'text-sm', rounded: 'rounded-3xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Background variants
  const variantStyles = {
    gradient: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/25 border border-white/20',
    white: 'bg-white text-blue-600 shadow-lg shadow-black/10 border border-slate-100',
    glass: 'bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-md',
  };

  const imageToTry = customSrc || '/lms/icons/logo.png';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Logo Badge Container */}
      <div
        className={`relative flex items-center justify-center shrink-0 overflow-hidden ${currentSize.box} ${currentSize.rounded} ${variantStyles[variant] || variantStyles.gradient}`}
      >
        {/* Subtle shine / reflection layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30 pointer-events-none" />

        {/* Try image if not marked errored */}
        {!imageError && imageToTry ? (
          <img
            src={imageToTry}
            alt="LMS Logo"
            className="h-full w-full object-contain p-1.5 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Premium Vector Fallback Emblem */
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${currentSize.icon} drop-shadow-sm`}
          >
            {/* Academic Cap / Star Crest */}
            <path
              d="M32 12L52 22L32 32L12 22L32 12Z"
              fill="currentColor"
              fillOpacity="0.95"
            />
            {/* Tassel line */}
            <path
              d="M47 24.5V36C47 37 46 38 45 38"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Open Book Foundation */}
            <path
              d="M18 31V43C22 41 27 41 32 44C37 41 42 41 46 43V31C42 29 37 29 32 32C27 29 22 29 18 31Z"
              fill="currentColor"
              fillOpacity="0.8"
            />
            {/* Base Pillar */}
            <path
              d="M32 44V51"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Optional Title / Subtitle Text */}
      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${currentSize.text} ${textColor}`}>
              MW TUITION
            </span>
            <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-white uppercase">
              LMS
            </span>
          </div>
          {subtitle && (
            <p className={`font-medium ${currentSize.sub} ${subColor}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
