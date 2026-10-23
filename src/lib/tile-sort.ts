// ============================================================================
// 1. IMPORTS
// ============================================================================
// دالة بحتة لا تتطلب استيرادات خارجية

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
export const TOTAL_TILES = 12;

/**
 * تسلسل ترتيب شبكة البورد (4 أعمدة × 3 صفوف)
 * مسار محيطي حلزوني يبدأ من الزاوية العلوية ويدور حول الحافة ثم يستقر
 */
export const BOARD_SORT_SEQUENCE = [0, 1, 2, 3, 7, 11, 10, 9, 8, 4, 5, 6] as const;

/**
 * تسلسل ترتيب شريط الموبايل العريض (6 أعمدة × صفين)
 */
export const BAND_SORT_SEQUENCE = [6, 0, 1, 2, 3, 4, 5, 11, 10, 9, 8, 7] as const;

export const TILE_ANIMATION_CONFIG = {
  dropStaggerMs: 55,
  initialSortDelayMs: 1625,
  stepDurationMs: 150,
  morphTransitionMs: 700,
  boardTileSizePx: 56,
  bandTileSizePx: 36,
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export type TileState = 'idle' | 'sorted' | 'focus' | 'rest';

export interface ScatterVector {
  rotationDeg: number;
  translateX: number;
  translateY: number;
}

// ============================================================================
// 4. PURE MATHEMATICAL FUNCTIONS
// ============================================================================

/**
 * توليد متجه التبعثر العشوائي والمقيد لكل بلاطة عند السقوط من الأعلى
 * الدوران بين 8 و24 درجة، والإزاحة الأفقية والعمودية بنسبة محددة من مقاس البلاطة
 */
export function generateScatterVector(
  tileSizePx: number,
  randomFn: () => number = Math.random
): ScatterVector {
  const signRot = randomFn() < 0.5 ? -1 : 1;
  const signX = randomFn() < 0.5 ? -1 : 1;
  const signY = randomFn() < 0.5 ? -1 : 1;

  // دوران محسوب ليعطي مظهراً مبعثراً ولكن متناسق بصرياً
  const rotMagnitude = 8 + randomFn() * 16; // 8deg to 24deg
  const rotationDeg = Math.round(signRot * rotMagnitude * 10) / 10;

  // إزاحة بمقدار 6% إلى 20% من حجم البلاطة
  const offsetFracX = 0.06 + randomFn() * 0.14;
  const offsetFracY = 0.06 + randomFn() * 0.14;

  const translateX = Math.round(signX * offsetFracX * tileSizePx * 10) / 10;
  const translateY = Math.round(signY * offsetFracY * tileSizePx * 10) / 10;

  return { rotationDeg, translateX, translateY };
}

/**
 * توليد مصفوفة ترتيب عشوائي لترتيب السقوط (Fisher-Yates Shuffle)
 */
export function generateShuffledOrder(
  count: number = TOTAL_TILES,
  randomFn: () => number = Math.random
): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * حساب تأخير سقوط البلاطة بناءً على موقعها في مصفوفة التبديل
 */
export function calculateTileDropDelay(
  tileIndex: number,
  shuffledOrder: number[],
  staggerMs: number = TILE_ANIMATION_CONFIG.dropStaggerMs
): number {
  const orderIndex = shuffledOrder.indexOf(tileIndex);
  const safeIndex = orderIndex >= 0 ? orderIndex : tileIndex;
  return safeIndex * staggerMs;
}

/**
 * حساب التوقيت الزمني الدقيق لكل خطوة من خطوات الترتيب
 */
export function calculateSortStepTime(
  step: number,
  initialDelayMs: number = TILE_ANIMATION_CONFIG.initialSortDelayMs,
  stepDurationMs: number = TILE_ANIMATION_CONFIG.stepDurationMs
): number {
  return initialDelayMs + step * stepDurationMs;
}

/**
 * آلة حالات البلاطة (State Machine):
 * - idle: البلاطة لا تزال مبعثرة ولم يحن دورها
 * - focus: البلاطة الحالية التي يجري تنظيمها وضبطها الآن
 * - sorted: تم تنظيمها بنجاح واستقرت في موضعها الشبكي الصحيح
 * - rest: البلاطة الأخيرة عند انتهاء كامل الترتيب واستقرار الشبكة
 */
export function getTileState(
  tileIndex: number,
  currentStep: number,
  sequence: readonly number[]
): TileState {
  const isComplete = currentStep >= sequence.length;
  const lastTileIndex = sequence[sequence.length - 1];

  if (isComplete) {
    return tileIndex === lastTileIndex ? 'rest' : 'sorted';
  }

  if (currentStep < 0) {
    return 'idle';
  }

  const activeFocusTile = sequence[currentStep];
  if (tileIndex === activeFocusTile) {
    return 'focus';
  }

  const sortedTilesSet = new Set(sequence.slice(0, currentStep));
  if (sortedTilesSet.has(tileIndex)) {
    return 'sorted';
  }

  return 'idle';
}
