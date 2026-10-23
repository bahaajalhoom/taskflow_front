// ============================================================================
// 1. IMPORTS
// ============================================================================
// وحدة صلاحيات محكمة بدون تبعيات خارجية لضمان السرعة والتوافق

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
export interface CustomPermissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canViewTasks: boolean;
  canManageMembers: boolean;
}

export const DEFAULT_CUSTOM_PERMISSIONS: CustomPermissions = {
  canCreateTasks: true,
  canEditTasks: true,
  canDeleteTasks: false,
  canViewTasks: true,
  canManageMembers: false,
};

export const FULL_PERMISSIONS: CustomPermissions = {
  canCreateTasks: true,
  canEditTasks: true,
  canDeleteTasks: true,
  canViewTasks: true,
  canManageMembers: true,
};

export const READONLY_PERMISSIONS: CustomPermissions = {
  canCreateTasks: false,
  canEditTasks: false,
  canDeleteTasks: false,
  canViewTasks: true,
  canManageMembers: false,
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export type ProjectMemberRole = 'owner' | 'maintainer' | 'member' | 'trainee' | 'viewer' | 'custom';

export type ProjectAction =
  | 'createTask'
  | 'editTask'
  | 'deleteTask'
  | 'viewTasks'
  | 'manageMembers';

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

/**
 * تحليل سلسلة الصلاحيات المخصصة بصيغة JSON مع معالجة الأخطاء والتراجع الآمن
 */
export function parseCustomPermissions(
  rawJson: string | null | undefined
): CustomPermissions {
  if (!rawJson || typeof rawJson !== 'string' || rawJson.trim() === '') {
    return { ...DEFAULT_CUSTOM_PERMISSIONS };
  }

  try {
    const parsed = JSON.parse(rawJson);
    return {
      canCreateTasks: Boolean(parsed.canCreateTasks),
      canEditTasks: Boolean(parsed.canEditTasks),
      canDeleteTasks: Boolean(parsed.canDeleteTasks),
      canViewTasks: parsed.canViewTasks !== undefined ? Boolean(parsed.canViewTasks) : true,
      canManageMembers: Boolean(parsed.canManageMembers),
    };
  } catch {
    return { ...DEFAULT_CUSTOM_PERMISSIONS };
  }
}

/**
 * تحويل كائن الصلاحيات المخصصة إلى سلسلة JSON للتخزين في قاعدة البيانات
 */
export function serializeCustomPermissions(
  permissions: Partial<CustomPermissions>
): string {
  const merged: CustomPermissions = {
    ...DEFAULT_CUSTOM_PERMISSIONS,
    ...permissions,
  };
  return JSON.stringify(merged);
}

/**
 * التحقق الصارم من صلاحية المستخدم للقيام بإجراء محدد داخل المشروع
 */
export function canPerformAction(
  role: string,
  customPerms: CustomPermissions | string | null | undefined,
  action: ProjectAction
): boolean {
  // المالك ومدير المشروع يملكان صلاحيات كاملة
  if (role === 'owner' || role === 'maintainer') {
    return true;
  }

  // المشاهد لديه صلاحية العرض فقط
  if (role === 'viewer') {
    return action === 'viewTasks';
  }

  // العضو العادي
  if (role === 'member' || role === 'trainee') {
    if (action === 'deleteTask' || action === 'manageMembers') return false;
    return true;
  }

  // الدور المخصص (Custom Role): يعتمد كلياً على الأعلام المحددة
  if (role === 'custom') {
    const perms =
      typeof customPerms === 'string'
        ? parseCustomPermissions(customPerms)
        : customPerms || DEFAULT_CUSTOM_PERMISSIONS;

    switch (action) {
      case 'createTask':
        return Boolean(perms.canCreateTasks);
      case 'editTask':
        return Boolean(perms.canEditTasks);
      case 'deleteTask':
        return Boolean(perms.canDeleteTasks);
      case 'viewTasks':
        return Boolean(perms.canViewTasks);
      case 'manageMembers':
        return Boolean(perms.canManageMembers);
      default:
        return false;
    }
  }

  return false;
}
