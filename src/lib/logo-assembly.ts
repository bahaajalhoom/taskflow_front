// ============================================================================
// 1. IMPORTS
// ============================================================================
// محرك فيزياء التحام وتجميع شعار تاسك فلو - كود نظيف وخالٍ من أي تبعيات خارجية

// ============================================================================
// 2. CONFIGURATION & CONSTANTS (EASY EDIT ZONE)
// ============================================================================
export const LOGO_ASSEMBLY_CONFIG = {
  viewBoxSize: 32,
  animationDurationMs: 1600,
  scatterSpreadPx: 48,
  maxScatterAngleDeg: 35,
  springEasing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  convergeDelayMs: 300,
  pulseDelayMs: 1400,
  pulseDurationMs: 600,
} as const;

// الإحداثيات الهندسية المعتمدة لشعار تاسك فلو بدقة متناهية
export const TASKFLOW_LOGO_TARGETS = {
  frame: { x: 2, y: 2, width: 28, height: 28, rx: 6 },
  beamTop: { x: 7.5, y: 8, width: 17, height: 2, rx: 1, opacity: 1.0 },
  beamMiddle: { x: 7.5, y: 14, width: 12, height: 2, rx: 1, opacity: 0.8 },
  beamBottom: { x: 7.5, y: 20, width: 8, height: 2, rx: 1, opacity: 0.55 },
  sparkNode: { cx: 21, cy: 20, r: 2.75 },
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export type AssemblyStage = 'scattered' | 'converging' | 'docked' | 'pulse';

export interface KineticScatterVector {
  offsetX: number;
  offsetY: number;
  rotationDeg: number;
  scale: number;
  opacity: number;
}

export interface LogoAssemblyState {
  stage: AssemblyStage;
  progress: number;
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
 * توليد متجه تبعثر عشوائي محكوم لعناصر الشعار
 * يحاكي تناثر المهام الحرة في الفضاء قبل دخولها في تدفق العمل المنظم
 */
export function generateElementScatterVector(
  index: number,
  spreadPx: number = LOGO_ASSEMBLY_CONFIG.scatterSpreadPx
): KineticScatterVector {
  // استخدام توجيه قطبي محدد لكل عنصر لضمان تبعثر بصري متوازن وجذاب
  const angles = [-135, -45, 135, 45, 0];
  const angleRad = ((angles[index % angles.length] + (index * 17) % 30) * Math.PI) / 180;
  const distance = spreadPx * (0.65 + ((index * 23) % 40) / 100);

  const offsetX = Math.cos(angleRad) * distance;
  const offsetY = Math.sin(angleRad) * distance;
  const rotationDeg = (((index * 37) % 50) - 25);
  const scale = 0.8 + ((index * 13) % 25) / 100;
  const opacity = 0.3 + ((index * 17) % 30) / 100;

  return {
    offsetX: Math.round(offsetX * 10) / 10,
    offsetY: Math.round(offsetY * 10) / 10,
    rotationDeg: Math.round(rotationDeg),
    scale: Math.round(scale * 100) / 100,
    opacity: Math.round(opacity * 100) / 100,
  };
}

/**
 * تحديد مرحلة التجميع الحالية بناء على الوقت المنقضي
 */
export function calculateAssemblyStage(
  elapsedMs: number,
  config = LOGO_ASSEMBLY_CONFIG
): AssemblyStage {
  if (elapsedMs < config.convergeDelayMs) {
    return 'scattered';
  }
  if (elapsedMs < config.pulseDelayMs) {
    return 'converging';
  }
  if (elapsedMs < config.pulseDelayMs + config.pulseDurationMs) {
    return 'pulse';
  }
  return 'docked';
}

/**
 * حساب نسبة تقدم التقارب الفيزيائي بدالة تنعيم ربيعية
 */
export function calculateConvergenceProgress(
  elapsedMs: number,
  config = LOGO_ASSEMBLY_CONFIG
): number {
  if (elapsedMs <= config.convergeDelayMs) return 0;
  const activeDuration = config.pulseDelayMs - config.convergeDelayMs;
  if (activeDuration <= 0) return 1;

  const raw = (elapsedMs - config.convergeDelayMs) / activeDuration;
  return clamp(raw, 0, 1);
}

/**
 * توليد سلسلة خاصية transform للعنصر أثناء مرحلة التجميع
 */
export function getElementTransformStyle(
  scatter: KineticScatterVector,
  progress: number
): { transform: string; opacity: number } {
  const currentX = lerp(scatter.offsetX, 0, progress);
  const currentY = lerp(scatter.offsetY, 0, progress);
  const currentRot = lerp(scatter.rotationDeg, 0, progress);
  const currentScale = lerp(scatter.scale, 1, progress);
  const currentOpacity = lerp(scatter.opacity, 1, progress);

  return {
    transform: `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0px) rotate(${currentRot.toFixed(1)}deg) scale(${currentScale.toFixed(2)})`,
    opacity: Math.round(currentOpacity * 100) / 100,
  };
}
