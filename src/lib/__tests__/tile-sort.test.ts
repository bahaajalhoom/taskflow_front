import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_TILES,
  BOARD_SORT_SEQUENCE,
  BAND_SORT_SEQUENCE,
  getTileState,
  generateScatterVector,
  generateShuffledOrder,
  calculateTileDropDelay,
  calculateSortStepTime,
  TileState,
} from '../tile-sort';

describe('Tile Drop & Sort Physics Engine - TDD Tests', () => {
  describe('Constants and Traversal Sequences', () => {
    it('has exactly 12 tiles', () => {
      assert.strictEqual(TOTAL_TILES, 12);
    });

    it('board sequence covers all 12 tiles without duplicates in perimeter order', () => {
      assert.strictEqual(BOARD_SORT_SEQUENCE.length, 12);
      const set = new Set(BOARD_SORT_SEQUENCE);
      assert.strictEqual(set.size, 12);
      // Validates perimeter snake traversal: top row -> right edge -> bottom row backwards -> left edge
      assert.deepStrictEqual(BOARD_SORT_SEQUENCE, [0, 1, 2, 3, 7, 11, 10, 9, 8, 4, 5, 6]);
    });

    it('band sequence covers all 12 tiles for responsive mobile layout', () => {
      assert.strictEqual(BAND_SORT_SEQUENCE.length, 12);
      const set = new Set(BAND_SORT_SEQUENCE);
      assert.strictEqual(set.size, 12);
    });
  });

  describe('generateScatterVector()', () => {
    it('generates rotation and translation within expected craft bounds', () => {
      const vector = generateScatterVector(56, () => 0.5);
      assert.strictEqual(typeof vector.rotationDeg, 'number');
      assert.strictEqual(typeof vector.translateX, 'number');
      assert.strictEqual(typeof vector.translateY, 'number');

      // Test across multiple seeds
      for (let i = 0; i < 20; i++) {
        const v = generateScatterVector(56);
        assert.ok(Math.abs(v.rotationDeg) >= 8 && Math.abs(v.rotationDeg) <= 24);
        assert.ok(Math.abs(v.translateX) <= 56 * 0.25);
        assert.ok(Math.abs(v.translateY) <= 56 * 0.25);
      }
    });
  });

  describe('generateShuffledOrder()', () => {
    it('produces a permutation of indices from 0 to TOTAL_TILES - 1', () => {
      const shuffled = generateShuffledOrder(12);
      assert.strictEqual(shuffled.length, 12);
      const set = new Set(shuffled);
      assert.strictEqual(set.size, 12);
      for (let i = 0; i < 12; i++) {
        assert.ok(set.has(i));
      }
    });
  });

  describe('Timing Functions', () => {
    it('calculates staggered drop delays based on shuffle position', () => {
      const shuffled = [3, 0, 2, 1];
      // Index of tile 2 is 2 -> delay = 2 * 55 = 110ms
      assert.strictEqual(calculateTileDropDelay(2, shuffled, 55), 110);
      // Index of tile 3 is 0 -> delay = 0 * 55 = 0ms
      assert.strictEqual(calculateTileDropDelay(3, shuffled, 55), 0);
    });

    it('calculates sort step timeouts sequentially', () => {
      const initialDelay = 1625;
      const stepDuration = 150;
      assert.strictEqual(calculateSortStepTime(0, initialDelay, stepDuration), 1625);
      assert.strictEqual(calculateSortStepTime(1, initialDelay, stepDuration), 1775);
      assert.strictEqual(calculateSortStepTime(11, initialDelay, stepDuration), 1625 + 11 * 150);
    });
  });

  describe('getTileState() State Machine', () => {
    const sequence = [0, 1, 2, 3, 7, 11, 10, 9, 8, 4, 5, 6];

    it('returns idle for all tiles when sorting has not started (step = -1)', () => {
      for (let i = 0; i < 12; i++) {
        assert.strictEqual(getTileState(i, -1, sequence), 'idle');
      }
    });

    it('returns focus for the current active tile at step k', () => {
      // At step 0, sequence[0] is 0 -> focus
      assert.strictEqual(getTileState(0, 0, sequence), 'focus');
      // Other tiles are still idle
      assert.strictEqual(getTileState(1, 0, sequence), 'idle');

      // At step 4, sequence[4] is 7 -> focus
      assert.strictEqual(getTileState(7, 4, sequence), 'focus');
    });

    it('returns sorted for previously completed tiles in sequence', () => {
      // At step 2 (tile 2 is focus), tiles 0 and 1 must be sorted
      assert.strictEqual(getTileState(0, 2, sequence), 'sorted');
      assert.strictEqual(getTileState(1, 2, sequence), 'sorted');
      assert.strictEqual(getTileState(2, 2, sequence), 'focus');
      assert.strictEqual(getTileState(3, 2, sequence), 'idle');
    });

    it('returns rest for the last tile and sorted for all others when completed', () => {
      const completedStep = 12;
      for (let i = 0; i < 12; i++) {
        if (i === 6) {
          // 6 is the final tile in sequence
          assert.strictEqual(getTileState(i, completedStep, sequence), 'rest');
        } else {
          assert.strictEqual(getTileState(i, completedStep, sequence), 'sorted');
        }
      }
    });
  });
});
