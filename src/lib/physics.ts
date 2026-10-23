// ============================================================================
// 1. IMPORTS
// ============================================================================
import type { CSSProperties } from 'react';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
export interface PhysicsTiltConfig {
  maxTiltDeg: number;
  tiltSensitivity: number;
  velocityThreshold: number;
  liftScale: number;
  dampingLambda: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsTiltConfig = {
  maxTiltDeg: 7.5,
  tiltSensitivity: 4.0,
  velocityThreshold: 0.04,
  liftScale: 1.035,
  dampingLambda: 14.0,
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface Point2D {
  x: number;
  y: number;
}

export interface Velocity2D {
  vx: number;
  vy: number;
  speed: number;
}

export interface CardTiltResult {
  rotateDeg: number;
  tiltX: number;
  tiltY: number;
}

export interface CardPhysicsState {
  isDragging: boolean;
  x: number;
  y: number;
  rotateDeg: number;
  scale: number;
}

// ============================================================================
// 4. PURE MATHEMATICAL HELPER FUNCTIONS
// ============================================================================

/**
 * تقييد القيمة بين الحد الأدنى والأقصى
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * استيفاء خطي بين قيمتين
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * حساب السرعة المتجهة واللحظية لحركة المؤشر
 * السرعة تحسب بوحدة بكسل لكل ميلي ثانية
 */
export function calculateVelocity(
  currentPos: Point2D,
  lastPos: Point2D,
  deltaTimeMs: number
): Velocity2D {
  if (deltaTimeMs <= 0) {
    return { vx: 0, vy: 0, speed: 0 };
  }

  const dx = currentPos.x - lastPos.x;
  const dy = currentPos.y - lastPos.y;

  const vx = dx / deltaTimeMs;
  const vy = dy / deltaTimeMs;
  const speed = Math.hypot(vx, vy);

  return { vx, vy, speed };
}

/**
 * حساب زاوية الدوران والميلان الديناميكي بناءً على اتجاه وسرعة السحب
 * السحب لليمين يعطي دوراناً مع عقارب الساعة موجب
 * السحب لليسار يعطي دوراناً عكس عقارب الساعة سالب
 */
export function calculateTiltAngle(
  vx: number,
  vy: number,
  config: Partial<PhysicsTiltConfig> = {}
): CardTiltResult {
  const cfg = { ...DEFAULT_PHYSICS_CONFIG, ...config };

  const absVx = Math.abs(vx);

  // تجاهل الارتعاشات الطفيفة جداً للمؤشر
  if (absVx < cfg.velocityThreshold) {
    return { rotateDeg: 0, tiltX: 0, tiltY: 0 };
  }

  // زاوية الدوران مع تقييدها بالحد الأقصى
  const rawAngle = vx * cfg.tiltSensitivity;
  const clampedAngle = clamp(rawAngle, -cfg.maxTiltDeg, cfg.maxTiltDeg);

  // إمالة خفيفة ثلاثية الأبعاد للمحاور
  const tiltX = clamp(-vy * 1.5, -4, 4);
  const tiltY = clamp(vx * 1.5, -4, 4);

  return {
    rotateDeg: Math.round(clampedAngle * 100) / 100,
    tiltX: Math.round(tiltX * 100) / 100,
    tiltY: Math.round(tiltY * 100) / 100,
  };
}

/**
 * تخميد القيمة باتجاه الهدف باستخدام دالة التضاؤل الأسي المستمر
 */
export function dampValue(
  current: number,
  target: number,
  lambda: number,
  deltaTimeMs: number
): number {
  if (deltaTimeMs <= 0) return current;
  const t = deltaTimeMs / 1000;
  return target + (current - target) * Math.exp(-lambda * t);
}

/**
 * سلسلة الانتقال الزنبركي للتسوية اللطيفة بعد الإفلات
 */
export function getSpringSettlingTransition(): string {
  return 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease-out';
}

/**
 * ظل الرفع الفيزيائي عالي الحرفية للكرت أثناء السحب
 */
export function getDragElevationShadow(): string {
  return '0 24px 44px -12px rgba(0, 0, 0, 0.32), 0 0 20px -3px rgba(122, 88, 24, 0.22)';
}

// ============================================================================
// 5. مولد تنسيقات التحول الفيزيائي (CSS Properties Generator)
// ============================================================================

/**
 * توليد تنسيقات الـ CSS الفيزيائية للكرت المسحوب
 * يدمج الانتقال، الرفع، والظلال الناعمة
 */
export function generatePhysicsTransform(state: CardPhysicsState): CSSProperties {
  const { isDragging, x, y, rotateDeg, scale } = state;

  if (!isDragging) {
    return {
      transform: 'translate3d(0px, 0px, 0px) rotate(0deg) scale(1)',
      transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease-out',
      willChange: 'auto',
      zIndex: 'auto',
    };
  }

  return {
    transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0px) rotate(${rotateDeg}deg) scale(${scale})`,
    boxShadow:
      '0 20px 38px -10px rgba(0, 0, 0, 0.28), 0 0 16px -2px rgba(122, 88, 24, 0.18)',
    transition: 'box-shadow 150ms ease-out',
    willChange: 'transform',
    zIndex: 50,
  };
}
