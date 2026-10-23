// ============================================================================
// 1. IMPORTS & CONSTANTS
// ============================================================================
export const LANDING_MOTION = {
  header: {
    durationMs: 700,
    delayMs: 50,
  },
  heroContent: {
    durationMs: 850,
    delayMs: 120,
    offsetPx: 48,
  },
  heroWorkbench: {
    durationMs: 850,
    delayMs: 180,
    offsetPx: 48,
  },
  sectionStagger: {
    baseDelayMs: 160,
    stepDelayMs: 120,
    maxDelayMs: 800,
    offsetPx: 40,
  },
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

/**
 * يحسب إزاحة الانزلاق الأفقية وفقاً لاتجاه اللغة:
 * في الإنجليزية (LTR): start يأتي من اليسار (-48px) و end يأتي من اليمين (+48px)
 * في العربية (RTL): start يأتي من اليمين (+48px) و end يأتي من اليسار (-48px)
 */
export function getDirectionalSlideX(
  alignment: 'start' | 'end',
  isRtl: boolean,
  offset = LANDING_MOTION.heroContent.offsetPx
): number {
  if (alignment === 'start') {
    return isRtl ? offset : -offset;
  }
  return isRtl ? -offset : offset;
}

/**
 * يحسب زمن التأخير التتابعي لكل قسم متتالي لضمان تدفق بصري فاخر بدون تجاوز الميزانية الحركية
 */
export function getSectionStaggerDelay(index: number): number {
  const calculated =
    LANDING_MOTION.sectionStagger.baseDelayMs +
    index * LANDING_MOTION.sectionStagger.stepDelayMs;
  return Math.min(calculated, LANDING_MOTION.sectionStagger.maxDelayMs);
}
