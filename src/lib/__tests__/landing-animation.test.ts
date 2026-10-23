import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANDING_MOTION,
  getDirectionalSlideX,
  getSectionStaggerDelay,
  calculateSlamImpactKeyframe,
} from '../landing-motion';

test('Landing Page Orchestrated Motion Physics - TDD Tests', async (t) => {
  await t.test('Motion duration and easing constants adhere to high-craft specifications', () => {
    assert.strictEqual(LANDING_MOTION.header.durationMs, 700);
    assert.strictEqual(LANDING_MOTION.heroContent.durationMs, 850);
    assert.strictEqual(LANDING_MOTION.heroWorkbench.durationMs, 850);
    assert.ok(LANDING_MOTION.easing.includes('cubic-bezier(0.16, 1, 0.3, 1)'));
  });

  await t.test('Directional slide calculation supports bidirectional RTL and LTR mechanics', () => {
    // In LTR: Start comes from Left (-48px), End comes from Right (+48px)
    assert.strictEqual(getDirectionalSlideX('start', false), -48);
    assert.strictEqual(getDirectionalSlideX('end', false), 48);

    // In RTL: Start comes from Right (+48px), End comes from Left (-48px)
    assert.strictEqual(getDirectionalSlideX('start', true), 48);
    assert.strictEqual(getDirectionalSlideX('end', true), -48);
  });

  await t.test('Section stagger delays are capped and ergonomically spaced', () => {
    const delay0 = getSectionStaggerDelay(0);
    const delay1 = getSectionStaggerDelay(1);
    const delay2 = getSectionStaggerDelay(2);
    const delay3 = getSectionStaggerDelay(3);

    assert.ok(delay0 >= 100);
    assert.ok(delay1 > delay0);
    assert.ok(delay2 > delay1);
    assert.ok(delay3 <= 800, 'Total stagger does not exceed 800ms motion budget');
  });

  await t.test('Slam and settle physics keyframe progression produces visceral shockwave', () => {
    const atImpact = calculateSlamImpactKeyframe(0.5);
    assert.strictEqual(atImpact.translateY, 0);
    assert.ok(atImpact.scaleX > 1.0, 'Produces squash expansion on impact');
    assert.ok(atImpact.scaleY < 1.0, 'Produces compression on impact');

    const atRebound = calculateSlamImpactKeyframe(0.68);
    assert.ok(atRebound.translateY < 0, 'Rebounds upward after slam');
    assert.notStrictEqual(atRebound.rotateDeg, 0, 'Introduces kinetic tilt oscillation');

    const atSettled = calculateSlamImpactKeyframe(1.0);
    assert.strictEqual(atSettled.translateY, 0);
    assert.strictEqual(atSettled.scaleX, 1);
    assert.strictEqual(atSettled.scaleY, 1);
    assert.strictEqual(atSettled.rotateDeg, 0);
  });
});
