'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SafetyCertificateOutlined,
  UserOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  KeyOutlined,
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
  CrownOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Space,
  Avatar,
  Tooltip,
  App,
  Segmented,
  Progress,
  Badge,
  Checkbox,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { DataService } from '@/services/dataStore';
import {
  AdminOverviewData,
  AdminUserRecord,
  AdminProjectRecord,
  AdminTaskRecord,
  TaskStatus,
  TaskPriority,
  CustomPermissions,
} from '@/types';
import Logo from '@/components/ui/Logo';
import { PrioritySignalBadge } from '@/components/ui/PrioritySignalBadge';
import { DEFAULT_CUSTOM_PERMISSIONS } from '@/lib/permissions';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const ADMIN_STYLES = {
  container: 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6',
  card:
    'tactile-card border border-[#DAD7CF] dark:border-[#2A2621] bg-white dark:bg-[#141210] shadow-tactile-card dark:shadow-tactile-card-dark rounded-xl p-5 sm:p-6',
  headerBadge:
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#D4B26E]/15 text-[#7A5818] dark:text-[#D4B26E] border border-[#D4B26E]/30',
  title: 'font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#141311] dark:text-[#F2EDE4]',
  subtitle: 'text-xs sm:text-sm text-[#635B4E] dark:text-[#B8AFA0] leading-relaxed',
  kpiBox:
    'p-4 rounded-xl border border-[#DAD7CF] dark:border-[#2A2621] bg-[#F4F4F1] dark:bg-[#1C1A17] space-y-1',
  kpiLabel: 'text-xs font-mono font-semibold uppercase text-[#635B4E] dark:text-[#8F8575]',
  kpiValue: 'font-display text-2xl font-bold text-[#141311] dark:text-[#F2EDE4] tnum',
  tableInput: 'h-9 text-xs bg-white dark:bg-[#1C1A17] border-[#DAD7CF] dark:border-[#2A2621]',
} as const;

// ============================================================================
// 6. MAIN COMPONENT (AdminConsolePage)
// وحدة التحكم الإدارية السرية والمركزية للمنظومة
// ============================================================================
export default function AdminConsolePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language, isRTL, formatDateLocalized } = useLanguage();
  const { message } = App.useApp();
  const isArabic = language === 'ar';

  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'tasks'>('users');

  // --- Data States ---
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [projectsList, setProjectsList] = useState<AdminProjectRecord[]>([]);
  const [tasksList, setTasksList] = useState<AdminTaskRecord[]>([]);

  // --- Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // --- Password Reset Modal ---
  const [passwordModalUser, setPasswordModalUser] = useState<AdminUserRecord | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // --- Role Management Modal ---
  const [roleModalUser, setRoleModalUser] = useState<AdminUserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // --- Fetch Admin Dataset (Direct Access For All Visitors) ---
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, usersData, projectsData, tasksData] = await Promise.all([
        DataService.getAdminOverview(),
        DataService.getAdminUsers(),
        DataService.getAdminProjects(),
        DataService.getAdminTasks(),
      ]);

      setOverview(overviewData);
      setUsersList(usersData.users || []);
      setProjectsList(projectsData.projects || []);
      setTasksList(tasksData.tasks || []);
    } catch (err: any) {
      console.error('Failed to load admin dataset:', err);
      message.error(err?.message || (isArabic ? 'فشل تحميل بيانات الإدارة' : 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  }, [isArabic, message]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // --- Handlers ---
  const handleOpenPasswordModal = (record: AdminUserRecord) => {
    setPasswordModalUser(record);
    setNewPasswordValue('');
  };

  const handleAdminResetPassword = async () => {
    if (!passwordModalUser || !newPasswordValue) return;
    if (newPasswordValue.length < 6) {
      message.warning(isArabic ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsResettingPassword(true);
      await DataService.adminResetUserPassword(passwordModalUser.id, newPasswordValue);
      message.success(
        isArabic
          ? `تم تحديث وتشفير كلمة مرور ${passwordModalUser.email} بنجاح`
          : `Password reset and encrypted for ${passwordModalUser.email}`
      );
      setPasswordModalUser(null);
      setNewPasswordValue('');
    } catch (err: any) {
      message.error(err?.message || 'Failed to update password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleOpenRoleModal = (record: AdminUserRecord) => {
    setRoleModalUser(record);
    setSelectedRole(record.role);
  };

  const handleAdminUpdateRole = async () => {
    if (!roleModalUser) return;
    try {
      setIsUpdatingRole(true);
      await DataService.adminUpdateUserRole(roleModalUser.id, selectedRole);
      message.success(
        isArabic
          ? `تم تحديث صلاحية ${roleModalUser.email} إلى ${selectedRole}`
          : `Role updated for ${roleModalUser.email} to ${selectedRole}`
      );
      setRoleModalUser(null);
      fetchAdminData();
    } catch (err: any) {
      message.error(err?.message || 'Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // --- Filtered Data ---
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const q = searchQuery.toLowerCase();
    return usersList.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectsList;
    const q = searchQuery.toLowerCase();
    return projectsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.ownerEmail.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q)
    );
  }, [projectsList, searchQuery]);

  const filteredTasks = useMemo(() => {
    let list = tasksList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.projectName.toLowerCase().includes(q) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      list = list.filter((t) => t.priority === priorityFilter);
    }
    return list;
  }, [tasksList, searchQuery, statusFilter, priorityFilter]);

  // --- Guard Clause: Unauthorized or Loading ---
  if (authLoading || (user && loading && !overview)) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#7A5818] dark:border-[#D4B26E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#635B4E] dark:text-[#B8AFA0]">
            {isArabic ? 'جارٍ فحص تصاريح الإدارة واستدعاء السجلات...' : 'Verifying administrative clearance...'}
          </p>
        </div>
      </div>
    );
  }

  // --- Table Columns: Users ---
  const userColumns: ColumnsType<AdminUserRecord> = [
    {
      title: isArabic ? 'المستخدم' : 'USER & IDENTIFIER',
      key: 'user',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={36}
            className="font-bold bg-[#7A5818] dark:bg-[#D4B26E] text-white dark:text-[#1A1408] shrink-0"
          >
            {r.displayName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="min-w-0">
            <div className="font-bold text-sm text-[#141311] dark:text-[#F2EDE4] truncate">
              {r.displayName}
            </div>
            <div className="font-mono text-xs text-[#635B4E] dark:text-[#B8AFA0] truncate">
              {r.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: isArabic ? 'الصلاحية العامة' : 'SYSTEM ROLE',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: string) => {
        const isOwner = role === 'owner';
        return (
          <Tag
            className={`text-xs font-semibold px-2 py-0.5 rounded border ${
              isOwner
                ? 'bg-[#D4B26E]/15 border-[#D4B26E]/30 text-[#7A5818] dark:text-[#D4B26E]'
                : 'bg-[#EDECE8] dark:bg-[#1C1A17] border-[#DAD7CF] dark:border-[#2A2621] text-[#4F493F] dark:text-[#B8AFA0]'
            }`}
          >
            {isOwner && <CrownOutlined className="me-1 text-xs" />}
            {role.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: isArabic ? 'أمان كلمة المرور' : 'PASSWORD SECURITY',
      key: 'passwordSecurity',
      width: 220,
      render: (_, r) => (
        <div className="space-y-0.5">
          <Tooltip title={isArabic ? 'مشفرة بنظام Bcrypt مع Salt غير قابل للاسترجاع لحماية الخصوصية' : 'Encrypted with irreversible Bcrypt 12-round salt hashing'}>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
              <LockOutlined className="text-xs" />
              <span>{r.passwordSecurity.algorithm}</span>
            </div>
          </Tooltip>
          <div className="text-[10px] font-mono text-[#8F8575] ps-0.5">
            Hash: {r.passwordSecurity.hashPreview}
          </div>
        </div>
      ),
    },
    {
      title: isArabic ? 'المشاريع والمهام' : 'WORKLOAD',
      key: 'workload',
      width: 150,
      render: (_, r) => (
        <div className="font-mono text-xs text-[#635B4E] dark:text-[#B8AFA0] space-y-0.5">
          <div>
            <span className="font-bold text-[#141311] dark:text-[#F2EDE4]">{r.projectsCount}</span> {isArabic ? 'مشروع' : 'projects'}
          </div>
          <div>
            <span className="font-bold text-[#141311] dark:text-[#F2EDE4]">{r.tasksCount}</span> {isArabic ? 'مهمة مسندة' : 'tasks'}
          </div>
        </div>
      ),
    },
    {
      title: isArabic ? 'تاريخ التسجيل' : 'JOINED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => (
        <span className="font-mono text-xs text-[#635B4E] dark:text-[#B8AFA0]">
          {formatDateLocalized(d)}
        </span>
      ),
    },
    {
      title: isArabic ? 'إجراءات الإدارة' : 'ADMIN CONTROLS',
      key: 'actions',
      width: 180,
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title={isArabic ? 'تعيين / إعادة ضبط كلمة المرور' : 'Set / Reset user password'}>
            <Button
              size="small"
              icon={<KeyOutlined className="text-xs" />}
              onClick={() => handleOpenPasswordModal(r)}
              className="text-xs tactile-btn"
            >
              {isArabic ? 'كلمة المرور' : 'Password'}
            </Button>
          </Tooltip>

          <Tooltip title={isArabic ? 'تغيير الصلاحية' : 'Change user role'}>
            <Button
              size="small"
              icon={<SettingOutlined className="text-xs" />}
              onClick={() => handleOpenRoleModal(r)}
              className="text-xs tactile-btn"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // --- Table Columns: Projects ---
  const projectColumns: ColumnsType<AdminProjectRecord> = [
    {
      title: isArabic ? 'المشروع' : 'PROJECT',
      key: 'name',
      render: (_, r) => (
        <div>
          <div className="font-bold text-sm text-[#141311] dark:text-[#F2EDE4]">
            <Link href={`/projects/${r.id}`} className="hover:underline text-[#7A5818] dark:text-[#D4B26E]">
              {r.name}
            </Link>
          </div>
          {r.description && (
            <div className="text-xs text-[#635B4E] dark:text-[#B8AFA0] line-clamp-1 max-w-md">
              {r.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: isArabic ? 'المالك' : 'OWNER',
      key: 'owner',
      render: (_, r) => (
        <div>
          <div className="font-semibold text-xs text-[#141311] dark:text-[#F2EDE4]">
            {r.ownerName}
          </div>
          <div className="font-mono text-[11px] text-[#635B4E] dark:text-[#B8AFA0]">
            {r.ownerEmail}
          </div>
        </div>
      ),
    },
    {
      title: isArabic ? 'الأعضاء' : 'MEMBERS',
      dataIndex: 'membersCount',
      key: 'membersCount',
      width: 100,
      render: (c: number) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#EDECE8] dark:bg-[#1C1A17] border border-[#DAD7CF] dark:border-[#2A2621]">
          {c}
        </span>
      ),
    },
    {
      title: isArabic ? 'الإنجاز' : 'PROGRESS',
      key: 'progress',
      width: 180,
      render: (_, r) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span>{r.doneTasksCount}/{r.tasksCount} {isArabic ? 'مكتملة' : 'done'}</span>
            <span className="font-bold">{r.completionRate}%</span>
          </div>
          <Progress
            percent={r.completionRate}
            size="small"
            showInfo={false}
            strokeColor="#D4B26E"
            trailColor="#2A2621"
          />
        </div>
      ),
    },
    {
      title: isArabic ? 'تاريخ التحديث' : 'LAST UPDATED',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 140,
      render: (d: string) => (
        <span className="font-mono text-xs text-[#635B4E] dark:text-[#B8AFA0]">
          {formatDateLocalized(d)}
        </span>
      ),
    },
  ];

  // --- Table Columns: Master Tasks ---
  const taskColumns: ColumnsType<AdminTaskRecord> = [
    {
      title: isArabic ? 'المهمة' : 'TASK & KEY',
      key: 'title',
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EDECE8] dark:bg-[#1C1A17] border border-[#DAD7CF] dark:border-[#2A2621] text-[#635B4E] dark:text-[#B8AFA0]">
              TF-{r.id.slice(0, 4).toUpperCase()}
            </span>
            <PrioritySignalBadge priority={r.priority} size="sm" />
          </div>
          <div className="font-bold text-sm text-[#141311] dark:text-[#F2EDE4] line-clamp-1">
            {r.title}
          </div>
        </div>
      ),
    },
    {
      title: isArabic ? 'المشروع التابع' : 'PROJECT',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (p: string, r) => (
        <Link href={`/projects/${r.projectId}`} className="text-xs font-semibold text-[#7A5818] dark:text-[#D4B26E] hover:underline">
          {p}
        </Link>
      ),
    },
    {
      title: isArabic ? 'الحالة' : 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (st: TaskStatus) => {
        const color = st === 'done' ? 'success' : st === 'in_progress' ? 'processing' : 'default';
        const label = st === 'done' ? (isArabic ? 'مكتملة' : 'Done') : st === 'in_progress' ? (isArabic ? 'قيد التنفيذ' : 'In Progress') : (isArabic ? 'قيد الانتظار' : 'To Do');
        return <Tag color={color} className="text-xs font-semibold uppercase">{label}</Tag>;
      },
    },
    {
      title: isArabic ? 'المسند إليه' : 'ASSIGNEE',
      key: 'assignee',
      render: (_, r) => (
        <span className="text-xs font-medium text-[#141311] dark:text-[#F2EDE4]">
          {r.assigneeName || <span className="text-slate-400 italic">{isArabic ? 'غير مسند' : 'Unassigned'}</span>}
        </span>
      ),
    },
    {
      title: isArabic ? 'تاريخ الاستحقاق' : 'DUE DATE',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      render: (d: string | null) => (
        <span className="font-mono text-xs text-[#635B4E] dark:text-[#B8AFA0]">
          {d ? formatDateLocalized(d) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className={ADMIN_STYLES.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Header & Telemetry Badges */}
      <div className={ADMIN_STYLES.card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={ADMIN_STYLES.headerBadge}>
                <SafetyCertificateOutlined className="text-sm" />
                <span>{isArabic ? 'وحدة الإدارة السرية' : 'ROOT ADMIN CONSOLE'}</span>
              </span>
              <span className="text-xs font-mono text-[#8F8575] bg-[#EDECE8] dark:bg-[#1C1A17] px-2 py-0.5 rounded border border-[#DAD7CF] dark:border-[#2A2621]">
                /admin
              </span>
            </div>
            <h1 className={ADMIN_STYLES.title}>
              {isArabic ? 'التحكم المركزي بالمنظومة والمستخدمين' : 'System & User Directory Control'}
            </h1>
            <p className={ADMIN_STYLES.subtitle}>
              {isArabic
                ? 'عرض شامل لكافة الحسابات المسجلة، حالة التشفير، المشروعات، والمهام عبر قاعدة البيانات المركزية.'
                : 'Global oversight across all registered accounts, cryptographic security, workspaces, and task trees.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              icon={<ReloadOutlined className={loading ? 'animate-spin' : ''} />}
              onClick={fetchAdminData}
              className="tactile-btn text-xs font-semibold"
            >
              {isArabic ? 'تحديث السجلات' : 'Refresh'}
            </Button>
            <Link href="/dashboard">
              <Button type="default" icon={<ArrowLeftOutlined />} className="tactile-btn text-xs font-semibold">
                {isArabic ? 'لوحة العمل' : 'Workspace'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Global KPIs Telemetry Strip */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-[#DAD7CF] dark:border-[#2A2621]">
            <div className={ADMIN_STYLES.kpiBox}>
              <div className={ADMIN_STYLES.kpiLabel}>{isArabic ? 'المستخدمون المسجلون' : 'TOTAL USERS'}</div>
              <div className={ADMIN_STYLES.kpiValue}>{overview.totalUsers}</div>
            </div>
            <div className={ADMIN_STYLES.kpiBox}>
              <div className={ADMIN_STYLES.kpiLabel}>{isArabic ? 'المشروعات النشطة' : 'TOTAL PROJECTS'}</div>
              <div className={ADMIN_STYLES.kpiValue}>{overview.totalProjects}</div>
            </div>
            <div className={ADMIN_STYLES.kpiBox}>
              <div className={ADMIN_STYLES.kpiLabel}>{isArabic ? 'إجمالي المهام' : 'TOTAL TASKS'}</div>
              <div className={ADMIN_STYLES.kpiValue}>{overview.totalTasks}</div>
            </div>
            <div className={ADMIN_STYLES.kpiBox}>
              <div className={ADMIN_STYLES.kpiLabel}>{isArabic ? 'المهام المكتملة' : 'COMPLETED TASKS'}</div>
              <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 tnum">
                {overview.tasksByStatus.done}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Directory Table Tabs */}
      <div className={ADMIN_STYLES.card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <Segmented
            size="middle"
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            options={[
              {
                value: 'users',
                label: (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 font-bold text-xs">
                    <UserOutlined />
                    <span>{isArabic ? 'المستخدمون المسجلون' : 'Users'}</span>
                    <Badge count={usersList.length} overflowCount={999} className="ms-1" />
                  </div>
                ),
              },
              {
                value: 'projects',
                label: (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 font-bold text-xs">
                    <ProjectOutlined />
                    <span>{isArabic ? 'كافة المشروعات' : 'Projects'}</span>
                    <Badge count={projectsList.length} overflowCount={999} className="ms-1" />
                  </div>
                ),
              },
              {
                value: 'tasks',
                label: (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 font-bold text-xs">
                    <CheckSquareOutlined />
                    <span>{isArabic ? 'سجل المهام الشامل' : 'All Tasks'}</span>
                    <Badge count={tasksList.length} overflowCount={999} className="ms-1" />
                  </div>
                ),
              },
            ]}
          />

          {/* Search and Secondary Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder={isArabic ? 'بحث في السجلات...' : 'Search directory...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="w-48 sm:w-60 text-xs"
              size="middle"
            />

            {activeTab === 'tasks' && (
              <>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="middle"
                  className="w-28 text-xs font-semibold"
                  options={[
                    { value: 'all', label: isArabic ? 'كل الحالات' : 'All Status' },
                    { value: 'todo', label: isArabic ? 'قيد الانتظار' : 'To Do' },
                    { value: 'in_progress', label: isArabic ? 'قيد التنفيذ' : 'In Progress' },
                    { value: 'done', label: isArabic ? 'مكتملة' : 'Done' },
                  ]}
                />
                <Select
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  size="middle"
                  className="w-28 text-xs font-semibold"
                  options={[
                    { value: 'all', label: isArabic ? 'كل الأولويات' : 'All Priority' },
                    { value: 'low', label: isArabic ? 'منخفضة' : 'Low' },
                    { value: 'medium', label: isArabic ? 'متوسطة' : 'Medium' },
                    { value: 'high', label: isArabic ? 'عالية' : 'High' },
                  ]}
                />
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <Table
            columns={userColumns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            className="overflow-x-auto text-xs"
          />
        )}

        {/* Tab 2: Projects */}
        {activeTab === 'projects' && (
          <Table
            columns={projectColumns}
            dataSource={filteredProjects}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            className="overflow-x-auto text-xs"
          />
        )}

        {/* Tab 3: Tasks */}
        {activeTab === 'tasks' && (
          <Table
            columns={taskColumns}
            dataSource={filteredTasks}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            className="overflow-x-auto text-xs"
          />
        )}
      </div>

      {/* Modal: Admin Password Reset */}
      <Modal
        open={Boolean(passwordModalUser)}
        onCancel={() => setPasswordModalUser(null)}
        onOk={handleAdminResetPassword}
        confirmLoading={isResettingPassword}
        okText={isArabic ? 'تأكيد وحفظ كلمة المرور' : 'Save New Password'}
        cancelText={isArabic ? 'إلغاء' : 'Cancel'}
        okButtonProps={{ className: '!bg-[#7A5818] dark:!bg-[#D4B26E] !border-transparent font-bold' }}
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-[#DAD7CF] dark:border-[#2A2621]">
            <KeyOutlined className="text-[#D4B26E]" />
            <span className="font-display font-bold">
              {isArabic ? 'إعادة ضبط كلمة المرور بواسطة الإدارة' : 'Admin Password Reset'}
            </span>
          </div>
        }
      >
        {passwordModalUser && (
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-lg bg-[#F4F4F1] dark:bg-[#1C1A17] border border-[#DAD7CF] dark:border-[#2A2621] space-y-1">
              <div className="text-xs text-[#635B4E] dark:text-[#B8AFA0]">{isArabic ? 'المستخدم المستهدف:' : 'Target User:'}</div>
              <div className="font-bold text-sm text-[#141311] dark:text-[#F2EDE4]">{passwordModalUser.displayName}</div>
              <div className="font-mono text-xs text-[#7A5818] dark:text-[#D4B26E]">{passwordModalUser.email}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4F493F] dark:text-[#B8AFA0]">
                {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <Input.Password
                value={newPasswordValue}
                onChange={(e) => setNewPasswordValue(e.target.value)}
                placeholder="••••••••"
                className="h-10 text-sm"
              />
              <span className="text-[11px] text-[#8F8575] block">
                {isArabic ? 'سيتم تشفير كلمة المرور فوراً بنظام Bcrypt (12 Rounds).' : 'Will be immediately salted and hashed with Bcrypt.'}
              </span>
            </div>

            <div className="flex justify-end">
              <Button
                type="dashed"
                size="small"
                onClick={() => setNewPasswordValue(`TF_${Math.random().toString(36).slice(-8)}!`)}
                className="text-xs font-mono"
              >
                {isArabic ? 'توليد كلمة سر عشوائية' : 'Generate Random'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Admin Role Update */}
      <Modal
        open={Boolean(roleModalUser)}
        onCancel={() => setRoleModalUser(null)}
        onOk={handleAdminUpdateRole}
        confirmLoading={isUpdatingRole}
        okText={isArabic ? 'تحديث الصلاحية' : 'Update Role'}
        cancelText={isArabic ? 'إلغاء' : 'Cancel'}
        okButtonProps={{ className: '!bg-[#7A5818] dark:!bg-[#D4B26E] !border-transparent font-bold' }}
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-[#DAD7CF] dark:border-[#2A2621]">
            <CrownOutlined className="text-[#D4B26E]" />
            <span className="font-display font-bold">
              {isArabic ? 'تعديل الدور العام للمستخدم' : 'Modify User System Role'}
            </span>
          </div>
        }
      >
        {roleModalUser && (
          <div className="py-4 space-y-4">
            <div className="text-xs text-[#635B4E] dark:text-[#B8AFA0]">
              {isArabic ? 'اختر الدور الجديد للمستخدم:' : 'Select new system role:'}
            </div>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              className="w-full h-10"
              options={[
                { value: 'owner', label: isArabic ? 'مالك المنظومة (Owner - Full Access)' : 'Owner (Full Access)' },
                { value: 'member', label: isArabic ? 'عضو منتظم (Member)' : 'Member' },
                { value: 'trainee', label: isArabic ? 'متدرب (Trainee)' : 'Trainee' },
                { value: 'viewer', label: isArabic ? 'مشاهد فقط (Viewer - Read Only)' : 'Viewer (Read Only)' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
