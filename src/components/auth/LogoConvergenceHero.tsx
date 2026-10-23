'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  LOGO_STROKE_CONFIG,
  SQUIRCLE_FRAME_PATH,
  TASKFLOW_BEAM_PATHS,
  getDrawingStateAtTime,
  type DrawingProgressState,
} from '@/lib/logo-assembly';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
export const TRACE_STYLES = {
  container: 'relative flex items-center justify-center select-none',
  svgCanvas: 'w-24 h-24 sm:w-28 sm:h-28 drop-shadow-lg select-none',
  framePath: 'fill-transparent stroke-[#D4B26E] transition-colors',
  beamTop: 'stroke-[#EFE9DD] transition-all',
  beamMiddle: 'stroke-[#EFE9DD]/80 transition-all',
  beamBottom: 'stroke-[#EFE9DD]/55 transition-all',
  sparkNode: 'fill-[#D4B26E] transition-all transform-gpu',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface LogoConvergenceHeroProps {
  instant?: boolean;
  className?: string;
  onComplete?: () => void;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================================================
// 5. المكون الرئيسي (LogoConvergenceHero)
// رسم متتابع رسمي لشعار تاسك فلو خطاً بخط (Stroke-by-Stroke):
// 1. رسم الإطار الخارجي المتناسق المحيط
// 2. رسم الخطوط الثلاثة لتدفق المهام تباعاً
// 3. انبثاق النواة الذهبية ونبضة الاستقرار لتشكيل الشعار الرسمي
// ============================================================================
export function LogoConvergenceHero({
  instant = false,
  className = '',
  onComplete,
}: LogoConvergenceHeroProps) {
  const isReduced = instant || prefersReducedMotion();

  const [state, setState] = useState<DrawingProgressState>(() =>
    isReduced ? getDrawingStateAtTime(LOGO_STROKE_CONFIG.totalDurationMs) : getDrawingStateAtTime(0)
  );

  useEffect(() => {
    if (isReduced) {
      setState(getDrawingStateAtTime(LOGO_STROKE_CONFIG.totalDurationMs));
      onComplete?.();
      return;
    }

    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const current = getDrawingStateAtTime(elapsed);
      setState(current);

      if (!current.isComplete) {
        animId = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isReduced, onComplete]);

  return (
    <div className={`${TRACE_STYLES.container} ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={TRACE_STYLES.svgCanvas}
        aria-hidden="true"
      >
        {/* Glow Filter for Golden Spark Node */}
        <defs>
          <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8CFA0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D4B26E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Line 1: Squircle Perimeter Outline Trace (خط الإطار الخارجي) */}
        <path
          d={SQUIRCLE_FRAME_PATH}
          className={TRACE_STYLES.framePath}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={LOGO_STROKE_CONFIG.lengths.framePerimeter}
          strokeDashoffset={state.frameDashoffset}
        />

        {/* 2. Line 2: Top Velocity Flow Beam (الخط العلوي الأول) */}
        <path
          d={TASKFLOW_BEAM_PATHS.top}
          className={TRACE_STYLES.beamTop}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={LOGO_STROKE_CONFIG.lengths.beamTop}
          strokeDashoffset={state.beamTopDashoffset}
        />

        {/* 3. Line 3: Middle Velocity Flow Beam (الخط الأوسط الثاني) */}
        <path
          d={TASKFLOW_BEAM_PATHS.middle}
          className={TRACE_STYLES.beamMiddle}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={LOGO_STROKE_CONFIG.lengths.beamMiddle}
          strokeDashoffset={state.beamMiddleDashoffset}
        />

        {/* 4. Line 4: Bottom Velocity Flow Beam (الخط السفلي الثالث) */}
        <path
          d={TASKFLOW_BEAM_PATHS.bottom}
          className={TRACE_STYLES.beamBottom}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={LOGO_STROKE_CONFIG.lengths.beamBottom}
          strokeDashoffset={state.beamBottomDashoffset}
        />

        {/* 5. Point 5: Champagne Gold Spark Node (نقطة الإنجاز الذهبية) */}
        <g
          style={{
            transform: `translate(${TASKFLOW_BEAM_PATHS.sparkCenter.cx}px, ${TASKFLOW_BEAM_PATHS.sparkCenter.cy}px) scale(${state.sparkScale})`,
            transformOrigin: '0 0',
            opacity: state.sparkOpacity,
          }}
        >
          {state.isComplete && (
            <circle
              cx="0"
              cy="0"
              r="6"
              fill="url(#sparkGlow)"
              className="animate-pulse pointer-events-none"
            />
          )}
          <circle
            cx="0"
            cy="0"
            r={TASKFLOW_BEAM_PATHS.sparkCenter.r}
            className={TRACE_STYLES.sparkNode}
          />
        </g>
      </svg>
    </div>
  );
}
