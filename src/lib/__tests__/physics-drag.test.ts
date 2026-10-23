import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVelocity,
  calculateTiltAngle,
  dampValue,
  PhysicsTiltConfig,
  DEFAULT_PHYSICS_CONFIG,
} from '../physics';

describe('Physics Drag Controller Logic', () => {
  it('tracks pointer movement and produces directional tilt series', () => {
    // Step 1: Pointer moves right rapidly
    const pos1 = { x: 100, y: 100 };
    const pos2 = { x: 220, y: 105 }; // +120px in 30ms = 4 px/ms
    const velRight = calculateVelocity(pos2, pos1, 30);
    const tiltRight = calculateTiltAngle(velRight.vx, velRight.vy);

    assert.ok(tiltRight.rotateDeg > 0, 'Dragging right must produce positive clockwise tilt');
    assert.strictEqual(tiltRight.rotateDeg, DEFAULT_PHYSICS_CONFIG.maxTiltDeg);

    // Step 2: Pointer slows down and reverses to the left
    const pos3 = { x: 160, y: 110 }; // -60px in 30ms = -2 px/ms
    const velLeft = calculateVelocity(pos3, pos2, 30);
    const tiltLeft = calculateTiltAngle(velLeft.vx, velLeft.vy);

    assert.ok(tiltLeft.rotateDeg < 0, 'Dragging left must produce negative counter-clockwise tilt');

    // Step 3: Pointer stops
    const velStop = calculateVelocity(pos3, pos3, 30);
    const tiltStop = calculateTiltAngle(velStop.vx, velStop.vy);
    assert.strictEqual(tiltStop.rotateDeg, 0, 'Stationary pointer must produce 0 tilt');
  });

  it('damps extreme tilt smoothly towards resting angle', () => {
    let currentTilt = 7.5;
    const targetTilt = 0;

    // Simulate 3 animation frames (~16ms each)
    currentTilt = dampValue(currentTilt, targetTilt, 14, 16);
    assert.ok(currentTilt < 7.5 && currentTilt > 0);

    currentTilt = dampValue(currentTilt, targetTilt, 14, 16);
    assert.ok(currentTilt < 6.0);

    // After 250ms of rest, should be nearly 0
    currentTilt = dampValue(currentTilt, targetTilt, 14, 250);
    assert.ok(currentTilt < 0.5);
  });
});
