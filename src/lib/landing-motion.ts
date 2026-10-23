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

export interface SlamKeyframeState {
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
}

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

/**
 * محاكي فيزياء الخبط والارتداد والاهتزاز اللمسي عالي الفخامة (Slam & Seismic Settle)
 * Progress: من 0 إلى 1
 */
export function calculateSlamImpactKeyframe(progress: number): SlamKeyframeState {
  if (progress <= 0) {
    return { translateY: -100, scaleX: 1, scaleY: 1, rotateDeg: 0 };
  }
  if (progress >= 1) {
    return { translateY: 0, scaleX: 1, scaleY: 1, rotateDeg: 0 };
  }

  // 1. مرحلة الهبوط السريع والاصطدام (0 -> 0.5)
  if (progress <= 0.5) {
    const t = progress / 0.5;
    // عند الاصطدام المباشر (t = 1 أي progress = 0.5):
    if (t === 1) {
      return { translateY: 0, scaleX: 1.08, scaleY: 0.92, rotateDeg: 0 };
    }
    const currentY = -100 * (1 - t * t);
    return { translateY: currentY, scaleX: 1, scaleY: 1, rotateDeg: 0 };
  }

  // 2. مرحلة الارتداد والاهتزاز الزلزالي المتلاشي (0.5 -> 0.8)
  if (progress <= 0.8) {
    const t = (progress - 0.5) / 0.3;
    // ارتداد خفيف لأعلى مع تذبذب زاوية
    const reboundHeight = -14 * Math.sin(t * Math.PI);
    const rotation = 1.8 * Math.sin(t * Math.PI * 2);
    const sx = 1 + 0.04 * Math.sin(t * Math.PI);
    const sy = 1 - 0.04 * Math.sin(t * Math.PI);
    return { translateY: reboundHeight, scaleX: sx, scaleY: sy, rotateDeg: rotation };
  }

  // 3. مرحلة الاستقرار النهائي الدقيق (0.8 -> 1.0)
  const t = (progress - 0.8) / 0.2;
  const dampY = -2 * Math.sin(t * Math.PI);
  const dampRot = -0.5 * Math.sin(t * Math.PI);
  return { translateY: dampY, scaleX: 1, scaleY: 1, rotateDeg: dampRot };
}
