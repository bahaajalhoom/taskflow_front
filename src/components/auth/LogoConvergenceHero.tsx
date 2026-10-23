'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ReloadOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  TASKFLOW_LOGO_TARGETS,
  LOGO_ASSEMBLY_CONFIG,
  generateElementScatterVector,
  calculateAssemblyStage,
  calculateConvergenceProgress,
  getElementTransformStyle,
  type AssemblyStage,
  type KineticScatterVector,
} from '@/lib/logo-assembly';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
export const CONVERGENCE_STYLES = {
  container:
    'relative w-full max-w-[420px] aspect-square mx-auto flex flex-col items-center justify-center p-6 select-none',
  ambientAura:
    'absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4B26E]/12 via-[#7A5818]/6 to-transparent blur-3xl pointer-events-none transform-gpu transition-opacity duration-1000',
  gridCanvas:
    'relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center rounded-2xl border border-white/5 bg-[#141210]/60 backdrop-blur-md shadow-2xl overflow-hidden',
  radialGridLines:
    'absolute inset-0 bg-[radial-gradient(#D4B26E_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none',
  pulseRing:
    'absolute w-24 h-24 rounded-full border border-[#D4B26E]/40 pointer-events-none transform-gpu animate-ping',
  brandName:
    'font-display font-black text-2xl tracking-tight text-[#F2EDE4] transition-all duration-700',
  brandTagline:
    'text-xs font-mono text-[#D4B26E] tracking-widest uppercase transition-all duration-700',
  replayBtn:
    'tactile-btn mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-medium text-[#B8AFA0] hover:text-[#F2EDE4] bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer select-none',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface LogoConvergenceHeroProps {
  instant?: boolean;
  className?: string;
  onConvergenceComplete?: () => void;
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
// تجربة التجميع البصري الحركي لشعار تاسك فلو:
// 1. تبدأ طبقات الشعار والنواة الذهبية مبعثرة كجزيئات عمل غير منتظمة
// 2. تنجذب العناصر بفيزياء حركة ربيعية نحو مركز الهدف الهندسي للشعار
// 3. تنطلق نبضة الإنجاز الذهبية لتثبيت الشعار بشكله النهائي الدقيق
// ============================================================================
export function LogoConvergenceHero({
  instant = false,
  className = '',
  onConvergenceComplete,
}: LogoConvergenceHeroProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  const isReduced = instant || prefersReducedMotion();
  const [iteration, setIteration] = useState(0);
  const [stage, setStage] = useState<AssemblyStage>(isReduced ? 'docked' : 'scattered');
  const [progress, setProgress] = useState<number>(isReduced ? 1 : 0);

  // مصفوفة متجهات التبعثر المحكومة لكل عنصر
  const scatterVectors = useMemo<KineticScatterVector[]>(() => {
    return [
      generateElementScatterVector(0, 52), // Outer Frame
      generateElementScatterVector(1, 46), // Top Beam
      generateElementScatterVector(2, 40), // Middle Beam
      generateElementScatterVector(3, 44), // Bottom Beam
      generateElementScatterVector(4, 56), // Golden Spark
    ];
  }, [iteration]);

  // إدارة دورة حياة الحركة والترتيب
  useEffect(() => {
    if (isReduced) {
      setStage('docked');
      setProgress(1);
      onConvergenceComplete?.();
      return;
    }

    setStage('scattered');
    setProgress(0);

    const startTime = performance.now();
    let animFrame: number;

    const animateLoop = (now: number) => {
      const elapsed = now - startTime;
      const currentStage = calculateAssemblyStage(elapsed);
      const currentProgress = calculateConvergenceProgress(elapsed);

      setStage(currentStage);
      setProgress(currentProgress);

      if (elapsed < LOGO_ASSEMBLY_CONFIG.pulseDelayMs + LOGO_ASSEMBLY_CONFIG.pulseDurationMs) {
        animFrame = requestAnimationFrame(animateLoop);
      } else {
        setStage('docked');
        setProgress(1);
        onConvergenceComplete?.();
      }
    };

    animFrame = requestAnimationFrame(animateLoop);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [iteration, isReduced, onConvergenceComplete]);

  const handleReplay = useCallback(() => {
    setIteration((v) => v + 1);
  }, []);

  // حساب التحويلات لكل عنصر
  const frameStyle = getElementTransformStyle(scatterVectors[0], progress);
  const beamTopStyle = getElementTransformStyle(scatterVectors[1], progress);
  const beamMiddleStyle = getElementTransformStyle(scatterVectors[2], progress);
  const beamBottomStyle = getElementTransformStyle(scatterVectors[3], progress);
  const sparkStyle = getElementTransformStyle(scatterVectors[4], progress);

  const isDockedOrPulse = stage === 'docked' || stage === 'pulse';

  return (
    <div className={`${CONVERGENCE_STYLES.container} ${className}`}>
      {/* Ambient Warm Golden Aura */}
      <div
        className={`${CONVERGENCE_STYLES.ambientAura} ${
          isDockedOrPulse ? 'opacity-100 scale-110' : 'opacity-40 scale-95'
        }`}
      />

      {/* Main Interactive Assembly Viewport */}
      <div
        className={CONVERGENCE_STYLES.gridCanvas}
        onClick={handleReplay}
        title={isArabic ? 'انقر لإعادة التحام الشعار' : 'Click to replay logo convergence'}
        role="button"
        tabIndex={0}
      >
        <div className={CONVERGENCE_STYLES.radialGridLines} />

        {/* Shockwave Pulse Ring on Assembly Completion */}
        {stage === 'pulse' && <div className={CONVERGENCE_STYLES.pulseRing} />}

        {/* Kinetic Geometric Assembly SVG */}
        <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-2xl select-none"
            aria-hidden="true"
          >
            {/* Element 0: Outer Squircle Boundary Frame */}
            <g style={frameStyle}>
              <rect
                x={TASKFLOW_LOGO_TARGETS.frame.x}
                y={TASKFLOW_LOGO_TARGETS.frame.y}
                width={TASKFLOW_LOGO_TARGETS.frame.width}
                height={TASKFLOW_LOGO_TARGETS.frame.height}
                rx={TASKFLOW_LOGO_TARGETS.frame.rx}
                className="fill-[#1A1815] stroke-[#38332B] transition-colors"
                strokeWidth={isDockedOrPulse ? '1.25' : '1'}
              />
            </g>

            {/* Element 1: Top Velocity Beam (Full Width) */}
            <g style={beamTopStyle}>
              <rect
                x={TASKFLOW_LOGO_TARGETS.beamTop.x}
                y={TASKFLOW_LOGO_TARGETS.beamTop.y}
                width={TASKFLOW_LOGO_TARGETS.beamTop.width}
                height={TASKFLOW_LOGO_TARGETS.beamTop.height}
                rx={TASKFLOW_LOGO_TARGETS.beamTop.rx}
                fill="#EFE9DD"
              />
            </g>

            {/* Element 2: Middle Velocity Beam (Mid Width) */}
            <g style={beamMiddleStyle}>
              <rect
                x={TASKFLOW_LOGO_TARGETS.beamMiddle.x}
                y={TASKFLOW_LOGO_TARGETS.beamMiddle.y}
                width={TASKFLOW_LOGO_TARGETS.beamMiddle.width}
                height={TASKFLOW_LOGO_TARGETS.beamMiddle.height}
                rx={TASKFLOW_LOGO_TARGETS.beamMiddle.rx}
                fill="#EFE9DD"
                fillOpacity={TASKFLOW_LOGO_TARGETS.beamMiddle.opacity}
              />
            </g>

            {/* Element 3: Bottom Velocity Beam (Focus Width) */}
            <g style={beamBottomStyle}>
              <rect
                x={TASKFLOW_LOGO_TARGETS.beamBottom.x}
                y={TASKFLOW_LOGO_TARGETS.beamBottom.y}
                width={TASKFLOW_LOGO_TARGETS.beamBottom.width}
                height={TASKFLOW_LOGO_TARGETS.beamBottom.height}
                rx={TASKFLOW_LOGO_TARGETS.beamBottom.rx}
                fill="#EFE9DD"
                fillOpacity={TASKFLOW_LOGO_TARGETS.beamBottom.opacity}
              />
            </g>

            {/* Element 4: Champagne Gold Completion Node / Spark */}
            <g style={sparkStyle}>
              <circle
                cx={TASKFLOW_LOGO_TARGETS.sparkNode.cx}
                cy={TASKFLOW_LOGO_TARGETS.sparkNode.cy}
                r={isDockedOrPulse ? 3 : TASKFLOW_LOGO_TARGETS.sparkNode.r}
                fill="#D4B26E"
                className={isDockedOrPulse ? 'animate-pulse' : ''}
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Lock Status & Brand Revelation */}
      <div className="mt-5 text-center space-y-1">
        <div
          className={`${CONVERGENCE_STYLES.brandName} ${
            isDockedOrPulse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {isArabic ? (
            <span>
              <span className="text-[#D4B26E]">تاسك_</span>فلو
            </span>
          ) : (
            <span>
              Task<span className="text-[#D4B26E]">Flow</span>
            </span>
          )}
        </div>

        <div
          className={`${CONVERGENCE_STYLES.brandTagline} ${
            isDockedOrPulse ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isArabic ? 'هندسة الإنجاز بدون تشويش' : 'Engineering Flow Architecture'}
        </div>

        <button
          type="button"
          onClick={handleReplay}
          className={CONVERGENCE_STYLES.replayBtn}
          aria-label={isArabic ? 'إعادة تشغيل تجميع الشعار' : 'Replay logo assembly'}
        >
          <ReloadOutlined className="text-[10px]" />
          <span>{isArabic ? 'إعادة المشهد' : 'Replay Convergence'}</span>
        </button>
      </div>
    </div>
  );
}
