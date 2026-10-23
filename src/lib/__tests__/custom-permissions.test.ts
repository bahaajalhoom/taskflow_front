import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCustomPermissions,
  serializeCustomPermissions,
  canPerformAction,
  DEFAULT_CUSTOM_PERMISSIONS,
  CustomPermissions,
  ProjectAction,
} from '../permissions';

describe('Custom Permissions Engine - TDD Tests', () => {
  describe('parseCustomPermissions()', () => {
    it('returns default fallback permissions when input is null or empty', () => {
      const parsedNull = parseCustomPermissions(null);
      assert.deepStrictEqual(parsedNull, DEFAULT_CUSTOM_PERMISSIONS);

      const parsedEmpty = parseCustomPermissions('');
      assert.deepStrictEqual(parsedEmpty, DEFAULT_CUSTOM_PERMISSIONS);
    });

    it('parses valid JSON string with custom flags', () => {
      const input = JSON.stringify({
        canCreateTasks: true,
        canEditTasks: false,
        canDeleteTasks: true,
        canViewTasks: true,
        canManageMembers: false,
      });

      const parsed = parseCustomPermissions(input);
      assert.strictEqual(parsed.canCreateTasks, true);
      assert.strictEqual(parsed.canEditTasks, false);
      assert.strictEqual(parsed.canDeleteTasks, true);
      assert.strictEqual(parsed.canViewTasks, true);
      assert.strictEqual(parsed.canManageMembers, false);
    });

    it('gracefully handles malformed JSON without throwing', () => {
      const malformed = '{ invalid: json ]';
      const parsed = parseCustomPermissions(malformed);
      assert.deepStrictEqual(parsed, DEFAULT_CUSTOM_PERMISSIONS);
    });
  });

  describe('serializeCustomPermissions()', () => {
    it('serializes permissions object to clean JSON string', () => {
      const perms: CustomPermissions = {
        canCreateTasks: false,
        canEditTasks: true,
        canDeleteTasks: false,
        canViewTasks: true,
        canManageMembers: false,
      };

      const serialized = serializeCustomPermissions(perms);
      const parsed = JSON.parse(serialized);
      assert.deepStrictEqual(parsed, perms);
    });
  });

  describe('canPerformAction() RBAC Enforcement', () => {
    it('always permits owner and maintainer to perform any action', () => {
      const actions: ProjectAction[] = ['createTask', 'editTask', 'deleteTask', 'viewTasks', 'manageMembers'];
      for (const action of actions) {
        assert.strictEqual(canPerformAction('owner', null, action), true);
        assert.strictEqual(canPerformAction('maintainer', null, action), true);
      }
    });

    it('restricts viewer to viewTasks only', () => {
      assert.strictEqual(canPerformAction('viewer', null, 'viewTasks'), true);
      assert.strictEqual(canPerformAction('viewer', null, 'createTask'), false);
      assert.strictEqual(canPerformAction('viewer', null, 'editTask'), false);
      assert.strictEqual(canPerformAction('viewer', null, 'deleteTask'), false);
      assert.strictEqual(canPerformAction('viewer', null, 'manageMembers'), false);
    });

    it('strictly respects granular flags when role is custom', () => {
      const customConfig: CustomPermissions = {
        canCreateTasks: false,
        canEditTasks: true,
        canDeleteTasks: false,
        canViewTasks: true,
        canManageMembers: false,
      };

      assert.strictEqual(canPerformAction('custom', customConfig, 'createTask'), false);
      assert.strictEqual(canPerformAction('custom', customConfig, 'editTask'), true);
      assert.strictEqual(canPerformAction('custom', customConfig, 'deleteTask'), false);
      assert.strictEqual(canPerformAction('custom', customConfig, 'viewTasks'), true);
      assert.strictEqual(canPerformAction('custom', customConfig, 'manageMembers'), false);
    });

    it('allows custom role to delete tasks if canDeleteTasks is enabled', () => {
      const customConfig: CustomPermissions = {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canViewTasks: true,
        canManageMembers: false,
      };

      assert.strictEqual(canPerformAction('custom', customConfig, 'deleteTask'), true);
      assert.strictEqual(canPerformAction('custom', customConfig, 'manageMembers'), false);
    });
  });
});
