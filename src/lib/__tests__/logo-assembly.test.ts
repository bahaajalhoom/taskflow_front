import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TASKFLOW_LOGO_TARGETS,
  LOGO_ASSEMBLY_CONFIG,
  clamp,
  lerp,
  generateElementScatterVector,
  calculateAssemblyStage,
  calculateConvergenceProgress,
  getElementTransformStyle,
} from '../logo-assembly';

describe('Logo Assembly Kinetic Engine - TDD Tests', () => {
  describe('Brandmark Geometry Targets', () => {
    it('accurately specifies the outer frame dimensions matching Logo.tsx', () => {
      assert.strictEqual(TASKFLOW_LOGO_TARGETS.frame.width, 28);
      assert.strictEqual(TASKFLOW_LOGO_TARGETS.frame.height, 28);
      assert.strictEqual(TASKFLOW_LOGO_TARGETS.frame.rx, 6);
    });

    it('specifies three descending task flow layers with correct height and opacity', () => {
      const { beamTop, beamMiddle, beamBottom } = TASKFLOW_LOGO_TARGETS;
      assert.strictEqual(beamTop.height, 2);
      assert.strictEqual(beamMiddle.height, 2);
      assert.strictEqual(beamBottom.height, 2);

      // Verify descending length hierarchy
      assert.strictEqual(beamTop.width > beamMiddle.width, true);
      assert.strictEqual(beamMiddle.width > beamBottom.width, true);

      // Verify opacity hierarchy
      assert.strictEqual(beamTop.opacity, 1.0);
      assert.strictEqual(beamMiddle.opacity, 0.8);
      assert.strictEqual(beamBottom.opacity, 0.55);
    });

    it('specifies the Champagne Gold spark node coordinates at (21, 20)', () => {
      const { sparkNode } = TASKFLOW_LOGO_TARGETS;
      assert.strictEqual(sparkNode.cx, 21);
      assert.strictEqual(sparkNode.cy, 20);
      assert.strictEqual(sparkNode.r, 2.75);
    });
  });

  describe('Kinetic Math Helpers', () => {
    it('clamps values within bounds', () => {
      assert.strictEqual(clamp(-5, 0, 10), 0);
      assert.strictEqual(clamp(15, 0, 10), 10);
      assert.strictEqual(clamp(5, 0, 10), 5);
    });

    it('interpolates linearly between start and end values', () => {
      assert.strictEqual(lerp(0, 100, 0), 0);
      assert.strictEqual(lerp(0, 100, 0.5), 50);
      assert.strictEqual(lerp(0, 100, 1), 100);
      assert.strictEqual(lerp(50, 10, 0.5), 30);
    });
  });

  describe('generateElementScatterVector()', () => {
    it('produces non-zero scatter offsets within bounds', () => {
      for (let i = 0; i < 5; i++) {
        const vector = generateElementScatterVector(i, 48);
        assert.strictEqual(typeof vector.offsetX, 'number');
        assert.strictEqual(typeof vector.offsetY, 'number');
        assert.strictEqual(typeof vector.rotationDeg, 'number');
        assert.strictEqual(vector.scale >= 0.7 && vector.scale <= 1.2, true);
        assert.strictEqual(vector.opacity >= 0.2 && vector.opacity <= 1.0, true);
      }
    });

    it('is deterministic for the same index and spread parameter', () => {
      const a = generateElementScatterVector(2, 50);
      const b = generateElementScatterVector(2, 50);
      assert.deepStrictEqual(a, b);
    });
  });

  describe('calculateAssemblyStage() State Machine', () => {
    it('returns scattered before convergeDelayMs', () => {
      assert.strictEqual(calculateAssemblyStage(0), 'scattered');
      assert.strictEqual(calculateAssemblyStage(250), 'scattered');
    });

    it('returns converging during the movement window', () => {
      assert.strictEqual(calculateAssemblyStage(500), 'converging');
      assert.strictEqual(calculateAssemblyStage(1000), 'converging');
    });

    it('returns pulse during the resonance phase', () => {
      const { pulseDelayMs } = LOGO_ASSEMBLY_CONFIG;
      assert.strictEqual(calculateAssemblyStage(pulseDelayMs + 50), 'pulse');
    });

    it('returns docked once all animation cycles have settled', () => {
      assert.strictEqual(calculateAssemblyStage(3000), 'docked');
    });
  });

  describe('calculateConvergenceProgress()', () => {
    it('returns 0 when elapsed time is within delay', () => {
      assert.strictEqual(calculateConvergenceProgress(100), 0);
    });

    it('returns 1 when elapsed time has reached or exceeded pulse delay', () => {
      const { pulseDelayMs } = LOGO_ASSEMBLY_CONFIG;
      assert.strictEqual(calculateConvergenceProgress(pulseDelayMs), 1);
      assert.strictEqual(calculateConvergenceProgress(pulseDelayMs + 500), 1);
    });

    it('returns values between 0 and 1 during convergence', () => {
      const progress = calculateConvergenceProgress(850);
      assert.strictEqual(progress > 0 && progress < 1, true);
    });
  });

  describe('getElementTransformStyle()', () => {
    it('returns scattered offset when progress is 0', () => {
      const vector = { offsetX: 30, offsetY: -20, rotationDeg: 15, scale: 0.8, opacity: 0.4 };
      const style = getElementTransformStyle(vector, 0);
      assert.strictEqual(style.transform.includes('30.0px'), true);
      assert.strictEqual(style.transform.includes('-20.0px'), true);
      assert.strictEqual(style.opacity, 0.4);
    });

    it('returns zero offset and full opacity when progress is 1', () => {
      const vector = { offsetX: 30, offsetY: -20, rotationDeg: 15, scale: 0.8, opacity: 0.4 };
      const style = getElementTransformStyle(vector, 1);
      assert.strictEqual(style.transform.includes('0.0px, 0.0px'), true);
      assert.strictEqual(style.transform.includes('rotate(0.0deg)'), true);
      assert.strictEqual(style.transform.includes('scale(1.00)'), true);
      assert.strictEqual(style.opacity, 1);
    });
  });
});
