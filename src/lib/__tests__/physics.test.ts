import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  lerp,
  calculateVelocity,
  calculateTiltAngle,
  dampValue,
  generatePhysicsTransform,
  getSpringSettlingTransition,
  getDragElevationShadow,
  DEFAULT_PHYSICS_CONFIG,
} from '../physics';

describe('Physics Engine - TDD Unit Tests', () => {
  describe('clamp()', () => {
    it('clamps values below minimum', () => {
      assert.strictEqual(clamp(-10, -5, 5), -5);
    });

    it('clamps values above maximum', () => {
      assert.strictEqual(clamp(15, -5, 5), 5);
    });

    it('preserves values within bounds', () => {
      assert.strictEqual(clamp(2, -5, 5), 2);
      assert.strictEqual(clamp(0, -5, 5), 0);
    });

    it('handles identical min and max correctly', () => {
      assert.strictEqual(clamp(10, 5, 5), 5);
      assert.strictEqual(clamp(2, 5, 5), 5);
    });
  });

  describe('lerp()', () => {
    it('interpolates linearly between start and end', () => {
      assert.strictEqual(lerp(0, 10, 0.5), 5);
      assert.strictEqual(lerp(0, 10, 0), 0);
      assert.strictEqual(lerp(0, 10, 1), 10);
    });

    it('interpolates with negative values', () => {
      assert.strictEqual(lerp(-10, 10, 0.5), 0);
      assert.strictEqual(lerp(-10, -5, 0.5), -7.5);
    });
  });

  describe('calculateVelocity()', () => {
    it('returns zero velocity when deltaTime is zero or negative', () => {
      const res1 = calculateVelocity({ x: 100, y: 100 }, { x: 50, y: 50 }, 0);
      assert.strictEqual(res1.vx, 0);
      assert.strictEqual(res1.vy, 0);
      assert.strictEqual(res1.speed, 0);

      const res2 = calculateVelocity({ x: 100, y: 100 }, { x: 50, y: 50 }, -10);
      assert.strictEqual(res2.vx, 0);
      assert.strictEqual(res2.vy, 0);
      assert.strictEqual(res2.speed, 0);
    });

    it('calculates positive velocity when moving down-right', () => {
      // 100px in 50ms = 2 px/ms
      const res = calculateVelocity({ x: 150, y: 100 }, { x: 50, y: 100 }, 50);
      assert.strictEqual(res.vx, 2);
      assert.strictEqual(res.vy, 0);
      assert.strictEqual(res.speed, 2);
    });

    it('calculates negative velocity when moving left', () => {
      // -60px in 30ms = -2 px/ms
      const res = calculateVelocity({ x: 40, y: 100 }, { x: 100, y: 100 }, 30);
      assert.strictEqual(res.vx, -2);
      assert.strictEqual(res.vy, 0);
      assert.strictEqual(res.speed, 2);
    });

    it('handles high-refresh 120Hz display frames (~8ms)', () => {
      const res = calculateVelocity({ x: 120, y: 110 }, { x: 100, y: 100 }, 8);
      assert.strictEqual(res.vx, 2.5);
      assert.strictEqual(res.vy, 1.25);
      assert.ok(res.speed > 2.5);
    });
  });

  describe('calculateTiltAngle()', () => {
    it('returns 0 rotation when velocity is 0', () => {
      const tilt = calculateTiltAngle(0, 0, DEFAULT_PHYSICS_CONFIG);
      assert.strictEqual(tilt.rotateDeg, 0);
    });

    it('tilts clockwise (positive angle) when dragging right', () => {
      const tilt = calculateTiltAngle(1.5, 0, {
        maxTiltDeg: 8,
        tiltSensitivity: 4,
        velocityThreshold: 0.05,
      });
      assert.ok(tilt.rotateDeg > 0, 'Rotation must be positive when moving right');
      assert.ok(tilt.rotateDeg <= 8, 'Rotation must not exceed maxTiltDeg');
    });

    it('tilts counter-clockwise (negative angle) when dragging left', () => {
      const tilt = calculateTiltAngle(-1.5, 0, {
        maxTiltDeg: 8,
        tiltSensitivity: 4,
        velocityThreshold: 0.05,
      });
      assert.ok(tilt.rotateDeg < 0, 'Rotation must be negative when moving left');
      assert.ok(tilt.rotateDeg >= -8, 'Rotation must not fall below -maxTiltDeg');
    });

    it('clamps to maxTiltDeg under extreme drag velocity', () => {
      const tiltRight = calculateTiltAngle(50, 0, { maxTiltDeg: 7, tiltSensitivity: 5, velocityThreshold: 0.05 });
      assert.strictEqual(tiltRight.rotateDeg, 7);

      const tiltLeft = calculateTiltAngle(-50, 0, { maxTiltDeg: 7, tiltSensitivity: 5, velocityThreshold: 0.05 });
      assert.strictEqual(tiltLeft.rotateDeg, -7);
    });

    it('ignores micro-jitter below velocityThreshold', () => {
      const tilt = calculateTiltAngle(0.01, 0.01, {
        maxTiltDeg: 8,
        tiltSensitivity: 4,
        velocityThreshold: 0.05,
      });
      assert.strictEqual(tilt.rotateDeg, 0);
    });
  });

  describe('dampValue()', () => {
    it('damps value towards target over elapsed time', () => {
      const initial = 10;
      const target = 0;
      const damped = dampValue(initial, target, 12, 50);
      assert.ok(damped < initial, 'Damped value must be smaller than initial');
      assert.ok(damped >= target, 'Damped value must not overshoot below target');
    });

    it('reaches target when deltaTime is sufficiently large', () => {
      const damped = dampValue(10, 0, 20, 2000);
      assert.ok(Math.abs(damped) < 0.001, 'Should effectively reach target');
    });

    it('returns current value when deltaTime is zero or negative', () => {
      assert.strictEqual(dampValue(10, 0, 12, 0), 10);
      assert.strictEqual(dampValue(10, 0, 12, -5), 10);
    });
  });

  describe('generatePhysicsTransform()', () => {
    it('returns identity transform when idle', () => {
      const style = generatePhysicsTransform({
        isDragging: false,
        x: 0,
        y: 0,
        rotateDeg: 0,
        scale: 1,
      });
      assert.strictEqual(style.transform, 'translate3d(0px, 0px, 0px) rotate(0deg) scale(1)');
    });

    it('returns animated transform with dynamic rotation and scale when dragging', () => {
      const style = generatePhysicsTransform({
        isDragging: true,
        x: 25,
        y: -10,
        rotateDeg: 4.5,
        scale: 1.04,
      });
      assert.strictEqual(style.transform, 'translate3d(25px, -10px, 0px) rotate(4.5deg) scale(1.04)');
      assert.ok(style.boxShadow, 'Must contain elevated box shadow during dragging');
    });
  });

  describe('Spring and Shadow Presets', () => {
    it('returns custom cubic-bezier spring transition string', () => {
      const spring = getSpringSettlingTransition();
      assert.ok(spring.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'));
    });

    it('returns high-craft elevation shadow string', () => {
      const shadow = getDragElevationShadow();
      assert.ok(shadow.includes('rgba'));
      assert.ok(shadow.includes('px'));
    });
  });
});
