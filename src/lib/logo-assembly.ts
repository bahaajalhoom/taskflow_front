// ============================================================================
// 1. IMPORTS
// ============================================================================
// محرك رسم وتجميع شعار تاسك فلو خطوة بخطوة (Stroke-by-Stroke Blueprint Engine)
// يعيد ابتكار تجربة النظام الأول بالرسم المتتابع الدقيق لتشكيل الشعار الرسمي

// ============================================================================
// 2. CONFIGURATION & CONSTANTS (EASY EDIT ZONE)
// ============================================================================
export const LOGO_STROKE_CONFIG = {
  viewBoxSize: 32,
  totalDurationMs: 1400,
  morphDurationMs: 700,

  // أطوال المسارات الهندسية الدقيقة بالبكسل
  lengths: {
    framePerimeter: 102,
    beamTop: 17,
    beamMiddle: 12,
    beamBottom: 8,
  },

  // الجداول الزمنية لتسلسل رسم كل خط
  timings: {
    frame: { start: 0, end: 450 },
    beamTop: { start: 450, end: 700 },
    beamMiddle: { start: 700, end: 900 },
    beamBottom: { start: 900, end: 1050 },
    spark: { start: 1050, end: 1300 },
  },
} as const;

// مسار الإطار الخارجي المتناسق (Rounded Squircle Path)
export const SQUIRCLE_FRAME_PATH =
  'M 16 2 L 24 2 A 6 6 0 0 1 30 8 L 30 24 A 6 6 0 0 1 24 30 L 8 30 A 6 6 0 0 1 2 24 L 2 8 A 6 6 0 0 1 8 2 L 16 2 Z';

// خطوط تدفق المهام الثلاثة
export const TASKFLOW_BEAM_PATHS = {
  top: 'M 7.5 9 L 24.5 9',
  middle: 'M 7.5 15 L 19.5 15',
  bottom: 'M 7.5 21 L 15.5 21',
  sparkCenter: { cx: 21, cy: 20, r: 2.75 },
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface DrawingProgressState {
  frameDashoffset: number;
  beamTopDashoffset: number;
  beamMiddleDashoffset: number;
  beamBottomDashoffset: number;
  sparkScale: number;
  sparkOpacity: number;
  isComplete: boolean;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

/**
 * تقييد القيمة العددية بين حد أدنى وحد أقصى
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * استيفاء خطي سلس بين قيمتين
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * دالة التنعيم التكعيبي للحركة الطبيعية
 */
export function easeOutCubic(t: number): number {
  const p = clamp(t, 0, 1);
  return 1 - Math.pow(1 - p, 3);
}

/**
 * حساب نسبة تقدم الخطوة الزمنية بناء على توقيت البداية والنهاية
 */
export function calculateStepProgress(
  elapsedMs: number,
  startMs: number,
  endMs: number
): number {
  if (elapsedMs <= startMs) return 0;
  if (elapsedMs >= endMs) return 1;
  const raw = (elapsedMs - startMs) / (endMs - startMs);
  return easeOutCubic(raw);
}

/**
 * حساب إزاحة شرطة المسار stroke-dashoffset المتبقية
 */
export function calculateDashoffset(
  totalLength: number,
  progress: number
): number {
  const safeProgress = clamp(progress, 0, 1);
  const offset = totalLength * (1 - safeProgress);
  return Math.round(offset * 10) / 10;
}

/**
 * حساب حجم ونبض النواة الذهبية (Champagne Gold Spark)
 */
export function calculateSparkState(elapsedMs: number): { scale: number; opacity: number } {
  const { start, end } = LOGO_STROKE_CONFIG.timings.spark;
  if (elapsedMs < start) {
    return { scale: 0, opacity: 0 };
  }
  const progress = calculateStepProgress(elapsedMs, start, end);
  // قفزة ربيعية معتدلة 0 -> 1.25 -> 1.0
  const scale = progress < 0.6 ? lerp(0, 1.25, progress / 0.6) : lerp(1.25, 1.0, (progress - 0.6) / 0.4);
  const opacity = clamp(progress * 1.5, 0, 1);

  return {
    scale: Math.round(scale * 100) / 100,
    opacity: Math.round(opacity * 100) / 100,
  };
}

/**
 * حساب الحالة الكاملة للرسم المتتابع في اللحظة الزمنية المحددة
 */
export function getDrawingStateAtTime(elapsedMs: number): DrawingProgressState {
  const { timings, lengths } = LOGO_STROKE_CONFIG;

  const frameProg = calculateStepProgress(elapsedMs, timings.frame.start, timings.frame.end);
  const beamTopProg = calculateStepProgress(elapsedMs, timings.beamTop.start, timings.beamTop.end);
  const beamMidProg = calculateStepProgress(elapsedMs, timings.beamMiddle.start, timings.beamMiddle.end);
  const beamBtmProg = calculateStepProgress(elapsedMs, timings.beamBottom.start, timings.beamBottom.end);
  const spark = calculateSparkState(elapsedMs);

  const isComplete = elapsedMs >= LOGO_STROKE_CONFIG.totalDurationMs;

  return {
    frameDashoffset: calculateDashoffset(lengths.framePerimeter, frameProg),
    beamTopDashoffset: calculateDashoffset(lengths.beamTop, beamTopProg),
    beamMiddleDashoffset: calculateDashoffset(lengths.beamMiddle, beamMidProg),
    beamBottomDashoffset: calculateDashoffset(lengths.beamBottom, beamBtmProg),
    sparkScale: spark.scale,
    sparkOpacity: spark.opacity,
    isComplete,
  };
}
