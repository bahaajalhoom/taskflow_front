import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  LOGO_STROKE_CONFIG,
  SQUIRCLE_FRAME_PATH,
  TASKFLOW_BEAM_PATHS,
  clamp,
  lerp,
  easeOutCubic,
  calculateStepProgress,
  calculateDashoffset,
  calculateSparkState,
  getDrawingStateAtTime,
} from '../logo-assembly';

describe('Sequential Logo Stroke Drawing Engine - TDD Tests', () => {
  describe('Path Constants and Geometries', () => {
    it('defines squircle frame path starting at top center', () => {
      assert.strictEqual(typeof SQUIRCLE_FRAME_PATH, 'string');
      assert.strictEqual(SQUIRCLE_FRAME_PATH.startsWith('M 16 2'), true);
    });

    it('defines three horizontal beam lines and spark center coordinates', () => {
      assert.strictEqual(TASKFLOW_BEAM_PATHS.top, 'M 7.5 9 L 24.5 9');
      assert.strictEqual(TASKFLOW_BEAM_PATHS.middle, 'M 7.5 15 L 19.5 15');
      assert.strictEqual(TASKFLOW_BEAM_PATHS.bottom, 'M 7.5 21 L 15.5 21');
      assert.strictEqual(TASKFLOW_BEAM_PATHS.sparkCenter.cx, 21);
      assert.strictEqual(TASKFLOW_BEAM_PATHS.sparkCenter.cy, 20);
    });
  });

  describe('Math and Easing Helpers', () => {
    it('clamps values properly', () => {
      assert.strictEqual(clamp(-10, 0, 1), 0);
      assert.strictEqual(clamp(2, 0, 1), 1);
      assert.strictEqual(clamp(0.45, 0, 1), 0.45);
    });

    it('lerps smoothly between start and end values', () => {
      assert.strictEqual(lerp(0, 100, 0), 0);
      assert.strictEqual(lerp(0, 100, 0.5), 50);
      assert.strictEqual(lerp(0, 100, 1), 100);
    });

    it('applies easeOutCubic curve correctly', () => {
      assert.strictEqual(easeOutCubic(0), 0);
      assert.strictEqual(easeOutCubic(1), 1);
      // easeOut is faster at the beginning (at 0.5 it should be > 0.5)
      assert.strictEqual(easeOutCubic(0.5) > 0.5, true);
    });
  });

  describe('calculateStepProgress()', () => {
    it('returns 0 before step start', () => {
      assert.strictEqual(calculateStepProgress(100, 200, 400), 0);
    });

    it('returns 1 after step end', () => {
      assert.strictEqual(calculateStepProgress(500, 200, 400), 1);
    });

    it('returns interpolated progress between start and end', () => {
      const p = calculateStepProgress(300, 200, 400);
      assert.strictEqual(p > 0 && p < 1, true);
    });
  });

  describe('calculateDashoffset()', () => {
    it('returns full length when progress is 0', () => {
      assert.strictEqual(calculateDashoffset(102, 0), 102);
    });

    it('returns 0 when progress is 1', () => {
      assert.strictEqual(calculateDashoffset(102, 1), 0);
    });

    it('returns proportional offset during stroke draw', () => {
      const offset = calculateDashoffset(100, 0.5);
      assert.strictEqual(offset, 50);
    });
  });

  describe('calculateSparkState()', () => {
    it('returns scale 0 and opacity 0 before spark start time', () => {
      const state = calculateSparkState(1000);
      assert.strictEqual(state.scale, 0);
      assert.strictEqual(state.opacity, 0);
    });

    it('returns full scale and opacity after spark end time', () => {
      const state = calculateSparkState(1350);
      assert.strictEqual(state.scale, 1.0);
      assert.strictEqual(state.opacity, 1.0);
    });
  });

  describe('getDrawingStateAtTime() State Sequence', () => {
    it('shows only frame drawing at early phase (t = 200ms)', () => {
      const state = getDrawingStateAtTime(200);
      assert.strictEqual(state.frameDashoffset < 102, true);
      assert.strictEqual(state.beamTopDashoffset, 17);
      assert.strictEqual(state.beamMiddleDashoffset, 12);
      assert.strictEqual(state.beamBottomDashoffset, 8);
      assert.strictEqual(state.sparkScale, 0);
      assert.strictEqual(state.isComplete, false);
    });

    it('draws top beam sequentially after frame (t = 600ms)', () => {
      const state = getDrawingStateAtTime(600);
      assert.strictEqual(state.frameDashoffset, 0); // Frame complete
      assert.strictEqual(state.beamTopDashoffset < 17, true); // Beam 1 drawing
      assert.strictEqual(state.beamMiddleDashoffset, 12);
      assert.strictEqual(state.beamBottomDashoffset, 8);
    });

    it('draws middle and bottom beams sequentially (t = 800ms and t = 1000ms)', () => {
      const stateMid = getDrawingStateAtTime(800);
      assert.strictEqual(stateMid.beamTopDashoffset, 0);
      assert.strictEqual(stateMid.beamMiddleDashoffset < 12, true);

      const stateBtm = getDrawingStateAtTime(1000);
      assert.strictEqual(stateBtm.beamMiddleDashoffset, 0);
      assert.strictEqual(stateBtm.beamBottomDashoffset < 8, true);
    });

    it('marks entire drawing as complete after total duration (t = 1500ms)', () => {
      const state = getDrawingStateAtTime(1500);
      assert.strictEqual(state.frameDashoffset, 0);
      assert.strictEqual(state.beamTopDashoffset, 0);
      assert.strictEqual(state.beamMiddleDashoffset, 0);
      assert.strictEqual(state.beamBottomDashoffset, 0);
      assert.strictEqual(state.sparkScale, 1.0);
      assert.strictEqual(state.isComplete, true);
    });
  });
});
