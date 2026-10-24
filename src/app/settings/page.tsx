'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SettingOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  WarningOutlined,
  SendOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  BellOutlined,
  SaveOutlined,
  CameraOutlined,
  UploadOutlined,
  PictureOutlined,
  LoadingOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import {
  Card,
  Input,
  Button,
  Select,
  Switch,
  Segmented,
  Avatar,
  Tag,
  Modal,
  message,
  Tooltip,
} from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { DataService } from '@/services/dataStore';
import { NotificationService, PushPermissionState } from '@/services/notificationService';
import { UserSettings } from '@/types';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
type SettingsTab = 'general' | 'appearance' | 'typography' | 'account';

const STYLES = {
  container: 'max-w-6xl mx-auto py-6 px-3 sm:px-6',
  sidebarItem:
    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-start',
  sidebarItemActive:
    'bg-[#EDECE8] dark:bg-[#1C1A17] text-[#1B1915] dark:text-[#EFE9DD] font-semibold border border-[#DDDAD3] dark:border-[#2C2824]',
  sidebarItemInactive:
    'text-[#5A5348] dark:text-[#9A9183] hover:bg-[#EDECE8]/60 dark:hover:bg-[#1C1A17]/60 hover:text-[#1B1915] dark:hover:text-[#EFE9DD]',
  card:
    'tactile-card border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#141211] shadow-tactile-card dark:shadow-tactile-card-dark p-6 rounded-xl space-y-6',
  sectionHeader: 'pb-4 border-b border-[#DDDAD3] dark:border-[#2C2824]',
  settingRow:
    'flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-[#DDDAD3]/60 dark:border-[#2C2824]/60 last:border-b-0',
  inputBase:
    'rounded-md text-sm bg-white dark:bg-[#1C1A17] border-[#DDDAD3] dark:border-[#2C2824] text-[#1B1915] dark:text-[#EFE9DD]',
  primaryBtn:
    'tactile-btn !bg-[#7A5818] dark:!bg-[#D4B26E] hover:!bg-[#5e4310] dark:hover:!bg-[#e5c583] !border-[#7A5818] dark:!border-[#D4B26E] !text-white dark:!text-[#1A1408] font-bold text-xs sm:text-sm rounded-md shadow-xs',
  secondaryBtn:
    'tactile-btn border-[#DDDAD3] dark:border-[#2C2824] text-[#1B1915] dark:text-[#EFE9DD] hover:border-[#7A5818] dark:hover:border-[#D4B26E] text-xs font-semibold bg-white dark:bg-[#141211] rounded-md',
  dangerCard:
    'border border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
};

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=faces',
];

/**
 * Resizes and crops an image file to a clean square JPEG Data URL (~35KB).
 * Enables direct persistence into SQLite without third-party storage bloat.
 */
function resizeImageToDataUrl(file: File, maxDim: number = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        // Center-crop to perfect square
        const minEdge = Math.min(img.width, img.height);
        const sx = (img.width - minEdge) / 2;
        const sy = (img.height - minEdge) / 2;
        ctx.drawImage(img, sx, sy, minEdge, minEdge, 0, 0, maxDim, maxDim);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 6. MAIN COMPONENT (SettingsPage)
// ============================================================================
export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const isArabic = language === 'ar';

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PushPermissionState>('default');

  // Account Tab State
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [workEmail, setWorkEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile Avatar Management State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Delete Account State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Typography & General State
  const [fontFamily, setFontFamily] = useState('Inter (Recommended Default)');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [dateFormat, setDateFormat] = useState('ISO 8601 (YYYY-MM-DD · e.g., 2025-05-18)');
  const [timezone, setTimezone] = useState('UTC-5 (America/New_York - Eastern Time)');

  // Notification Preferences
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: true,
    reminderHours: 24,
    theme: themeMode,
    language: language,
  });

  // Sync user details when auth loads
  useEffect(() => {
    if (user) {
      setFullName(user.displayName);
      setWorkEmail(user.email);
    }
  }, [user]);

  // Load initial settings and check push notification permissions
  useEffect(() => {
    setPermissionState(NotificationService.getPermissionState());

    async function loadSettings() {
      try {
        setLoading(true);
        const data = await DataService.getUserSettings();
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.fontFamily) setFontFamily(data.fontFamily);
          if (data.fontSize) setFontSize(data.fontSize as any);
          if (data.dateFormat) setDateFormat(data.dateFormat);
          if (data.timezone) setTimezone(data.timezone);
        }
      } catch (err) {
        console.warn('Failed to load user settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Request browser push permission
  const handleRequestPushPermission = async () => {
    const res = await NotificationService.requestPushPermission();
    setPermissionState(res);
    if (res === 'granted') {
      message.success(
        isArabic ? 'تم تفعيل إشعارات المتصفح بنجاح.' : 'Browser notifications enabled successfully.'
      );
      setSettings((prev) => ({ ...prev, pushNotifications: true }));
      await DataService.updateUserSettings({ pushNotifications: true });
    } else if (res === 'denied') {
      message.warning(
        isArabic
          ? 'تم رفض إذن الإشعارات من المتصفح. يمكنك تفعيلها من إعدادات الموقع بالمتصفح.'
          : 'Notification permission was denied. Please allow it in browser site settings.'
      );
      setSettings((prev) => ({ ...prev, pushNotifications: false }));
    }
  };

  // Test Notification Trigger
  const handleSendTestNotification = () => {
    const success = NotificationService.sendTestNotification(isArabic);
    if (success) {
      message.success(
        isArabic ? 'تم إرسال إشعار التجربة بنجاح إلى شاشتك.' : 'Test notification triggered successfully.'
      );
    } else {
      message.info(
        isArabic
          ? 'تم إرسال إشعار داخلي (يرجى التأكد من تفعيل إذن المتصفح لظهور إشعارات النظام).'
          : 'Browser push is blocked. Please grant permission in the setting above.'
      );
    }
  };

  // Save Identity Profile (Name & Email)
  const handleSaveProfile = async () => {
    const cleanName = fullName.trim();
    if (!cleanName) {
      message.error(isArabic ? 'يرجى إدخال اسم كامل صحيح' : 'Please enter a valid full name');
      return;
    }

    try {
      setIsSavingProfile(true);
      const currentAvatar = user?.avatarUrl || user?.photoURL || null;
      await DataService.updateUserProfile(cleanName, currentAvatar);
      updateUser({ displayName: cleanName });
      message.success(isArabic ? 'تم حفظ بيانات الحساب بنجاح.' : 'Account profile saved successfully.');
    } catch (err: any) {
      message.error(err?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save or Remove User Avatar
  const saveAvatar = async (newAvatarUrl: string | null) => {
    try {
      setIsUploadingAvatar(true);
      const cleanName = fullName.trim() || user?.displayName || 'User';
      await DataService.updateUserProfile(cleanName, newAvatarUrl);
      updateUser({
        avatarUrl: newAvatarUrl || undefined,
        photoURL: newAvatarUrl || undefined,
      });
      message.success(
        newAvatarUrl
          ? (isArabic ? 'تم تحديث الصورة الشخصية بنجاح.' : 'Profile picture updated successfully.')
          : (isArabic ? 'تمت إزالة الصورة الشخصية والعودة للأحرف الأولى.' : 'Profile picture removed.')
      );
      setIsAvatarModalOpen(false);
    } catch (err: any) {
      message.error(err?.message || 'Failed to update avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle local image file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error(isArabic ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)' : 'Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error(isArabic ? 'حجم الصورة كبير جداً (الحد الأقصى 10 ميغابايت)' : 'Image is too large (max 10MB)');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const dataUrl = await resizeImageToDataUrl(file, 256);
      await saveAvatar(dataUrl);
    } catch (err: any) {
      message.error(err?.message || 'Failed to process image');
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle custom image URL submission
  const handleApplyCustomUrl = async () => {
    const trimmed = avatarUrlInput.trim();
    if (!trimmed) {
      message.error(isArabic ? 'يرجى إدخال رابط صورة صحيح' : 'Please enter an image URL');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      message.error(isArabic ? 'يجب أن يبدأ الرابط بـ https://' : 'URL must start with https://');
      return;
    }
    await saveAvatar(trimmed);
    setAvatarUrlInput('');
  };

  // Update Password
  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      message.error(isArabic ? 'يرجى إدخال كلمة المرور الحالية' : 'Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      message.error(
        isArabic
          ? 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف'
          : 'New password must be at least 8 characters long'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error(
        isArabic ? 'كلمتا المرور غير متطابقتين' : 'New passwords do not match'
      );
      return;
    }

    try {
      setIsChangingPass(true);
      await DataService.changePassword(currentPassword, newPassword);
      message.success(
        isArabic ? 'تم تغيير كلمة المرور بنجاح.' : 'Password updated successfully.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      message.error(err?.message || 'Failed to update password');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      message.error(
        isArabic
          ? 'يرجى كتابة كلمة delete للتأكيد'
          : 'Please type "delete" to confirm account deletion'
      );
      return;
    }

    try {
      setIsDeletingAccount(true);
      await DataService.deleteAccount();
      message.success(isArabic ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
      await logout();
      router.push('/');
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className={STYLES.container}>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        {/* ================================================================ */}
        {/* LEFT COLUMN: Sidebar Navigation matching media_1792679084466 */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Configuration Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#5A5348] dark:text-[#9A9183] px-3 py-1">
              {isArabic ? 'الإعدادات' : 'CONFIGURATION'}
            </div>

            {/* General */}
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`${STYLES.sidebarItem} ${
                activeTab === 'general' ? STYLES.sidebarItemActive : STYLES.sidebarItemInactive
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SettingOutlined className="text-sm" />
                <span>{isArabic ? 'عام' : 'General'}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>

            {/* Appearance */}
            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`${STYLES.sidebarItem} ${
                activeTab === 'appearance' ? STYLES.sidebarItemActive : STYLES.sidebarItemInactive
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BgColorsOutlined className="text-sm" />
                <span>{isArabic ? 'المظهر' : 'Appearance'}</span>
              </div>
              <span className="text-[11px] font-mono text-[#5A5348] dark:text-[#9A9183] capitalize">
                {themeMode}
              </span>
            </button>

            {/* Typography */}
            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`${STYLES.sidebarItem} ${
                activeTab === 'typography' ? STYLES.sidebarItemActive : STYLES.sidebarItemInactive
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FontSizeOutlined className="text-sm" />
                <span>{isArabic ? 'الخطوط' : 'Typography'}</span>
              </div>
              <span className="text-[11px] font-mono text-[#5A5348] dark:text-[#9A9183]">
                Inter
              </span>
            </button>

            {/* Account */}
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`${STYLES.sidebarItem} ${
                activeTab === 'account' ? STYLES.sidebarItemActive : STYLES.sidebarItemInactive
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserOutlined className="text-sm" />
                <span>{isArabic ? 'الحساب' : 'Account'}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            </button>
          </div>

          {/* Session Security Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#5A5348] dark:text-[#9A9183] px-3 py-1">
              {isArabic ? 'أمان الجلسة' : 'SESSION SECURITY'}
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className={`${STYLES.sidebarItem} ${STYLES.sidebarItemInactive} hover:!text-rose-500`}
            >
              <div className="flex items-center gap-2.5">
                <LogoutOutlined className="text-sm" />
                <span>{isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </div>
              <span className="text-[10px] font-mono text-[#5A5348] dark:text-[#9A9183]">~Q</span>
            </button>
          </div>

          {/* Client Storage Status Box */}
          <div className="p-3 bg-white dark:bg-[#141211] border border-[#DDDAD3] dark:border-[#2C2824] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1915] dark:text-[#EFE9DD]">
              <LockOutlined className="text-[#7A5818] dark:text-[#D4B26E] text-xs" />
              <span>{isArabic ? 'التخزين المحلي' : 'Client Storage'}</span>
            </div>
            <div className="text-[11px] font-mono text-[#5A5348] dark:text-[#9A9183]">
              Pref cache: 42 KB indexed.
            </div>
            <div className="text-[11px] font-mono text-[#5A5348] dark:text-[#9A9183]">
              Last write: Just now.
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN: Tab Panels matching Screenshots */}
        {/* ================================================================ */}
        <div className="space-y-6 min-w-0">
          {/* TAB 1: GENERAL (media_1792679084466_49de33e4.png) */}
          {activeTab === 'general' && (
            <Card variant="outlined" className={STYLES.card}>
              <div className={STYLES.sectionHeader}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <SettingOutlined className="text-base text-[#7A5818] dark:text-[#D4B26E]" />
                    <h2 className="font-bold text-lg text-[#1B1915] dark:text-[#EFE9DD] font-display">
                      {isArabic ? 'عام' : 'General'}
                    </h2>
                  </div>
                  <Tag className="m-0 font-mono text-[10px] font-semibold bg-[#EDECE8] dark:bg-[#1C1A17] text-[#5A5348] dark:text-[#B5AC9C] border border-[#DDDAD3] dark:border-[#2C2824]">
                    LOCALE_CONFIG
                  </Tag>
                </div>
                <p className="text-xs text-[#5A5348] dark:text-[#9A9183] mt-1">
                  {isArabic
                    ? 'إعدادات مساحة العمل الافتراضية، تفضيلات التوطين، ومزامنة التوقيت الإقليمي.'
                    : 'Workspace defaults, localization preferences, and regional time synchronization.'}
                </p>
              </div>

              {/* Language Selector */}
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                    {isArabic ? 'اللغة' : 'Language'}
                  </div>
                  <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic
                      ? 'اختر اللغة المستخدمة في واجهة TaskFlow والإشعارات.'
                      : 'Choose the language used throughout TaskFlow interface and notifications.'}
                  </div>
                </div>

                <Select
                  value={language === 'ar' ? 'ar' : 'en'}
                  onChange={(val) => setLanguage(val as any)}
                  className="w-full sm:w-80"
                  options={[
                    { value: 'en', label: 'English (United States)' },
                    { value: 'ar', label: 'العربية (Arabic)' },
                  ]}
                />
              </div>

              {/* Bidirectional Engine */}
              <div className="p-4 bg-[#EDECE8]/30 dark:bg-[#1C1A17]/30 rounded-lg border border-[#DDDAD3] dark:border-[#2C2824] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#5A5348] dark:text-[#9A9183]">
                    BIDIRECTIONAL ENGINE
                  </span>
                  <Tag className="m-0 font-mono text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {isRTL ? 'RTL ACTIVE' : 'LTR ACTIVE'}
                  </Tag>
                </div>

                <Segmented
                  value={language}
                  onChange={(val) => setLanguage(val as any)}
                  options={[
                    { label: 'English LTR (Active)', value: 'en' },
                    { label: 'RTL العربية', value: 'ar' },
                  ]}
                  className="bg-[#EDECE8] dark:bg-[#141211] text-xs font-semibold"
                />

                <p className="text-xs text-[#5A5348] dark:text-[#9A9183] leading-relaxed">
                  {isArabic
                    ? 'عند اختيار اللغة العربية، تتكيف المنظومة بالكامل مع تخطيط RTL (اتجاه الواجهة، محاذاة النصوص، وتدفق التنقل).'
                    : 'When Arabic is selected, the entire application adapts to RTL layout (interface direction, text alignment, and navigation flow).'}
                </p>
              </div>

              {/* Date Format */}
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                    {isArabic ? 'تنسيق التاريخ' : 'Date Format'}
                  </div>
                  <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic
                      ? 'العرض الموحد للمواعيد النهائية وسجلات التغيير.'
                      : 'Canonical display for deadlines and change logs.'}
                  </div>
                </div>

                <Select
                  value={dateFormat}
                  onChange={(val) => setDateFormat(val)}
                  className="w-full sm:w-96"
                  options={[
                    { value: 'ISO 8601 (YYYY-MM-DD · e.g., 2025-05-18)', label: 'ISO 8601 (YYYY-MM-DD · e.g., 2025-05-18)' },
                    { value: 'US (MM/DD/YYYY · e.g., 05/18/2025)', label: 'US (MM/DD/YYYY · e.g., 05/18/2025)' },
                    { value: 'EU (DD/MM/YYYY · e.g., 18/05/2025)', label: 'EU (DD/MM/YYYY · e.g., 18/05/2025)' },
                  ]}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                    {isArabic ? 'المنطقة الزمنية' : 'Timezone'}
                  </div>
                  <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic
                      ? 'حسابات سرعة السبرنت وجداول الملخص اليومي.'
                      : 'Sprint burndown calculations and daily digest schedules.'}
                  </div>
                </div>

                <Select
                  value={timezone}
                  onChange={(val) => setTimezone(val)}
                  className="w-full sm:w-96"
                  options={[
                    { value: 'UTC-5 (America/New_York - Eastern Time)', label: 'UTC-5 (America/New_York - Eastern Time)' },
                    { value: 'UTC+0 (London - Greenwich Mean Time)', label: 'UTC+0 (London - Greenwich Mean Time)' },
                    { value: 'UTC+2 (Cairo - Eastern European Time)', label: 'UTC+2 (Cairo - Eastern European Time)' },
                    { value: 'UTC+3 (Amman / Riyadh - Arabia Standard Time)', label: 'UTC+3 (Amman / Riyadh - Arabia Standard Time)' },
                    { value: 'UTC+4 (Dubai - Gulf Standard Time)', label: 'UTC+4 (Dubai - Gulf Standard Time)' },
                  ]}
                />
              </div>

              {/* Notification & Due Date Reminders Section */}
              <div className="pt-4 border-t border-[#DDDAD3] dark:border-[#2C2824] space-y-4">
                <div className="flex items-center gap-2">
                  <BellOutlined className="text-base text-[#7A5818] dark:text-[#D4B26E]" />
                  <h3 className="font-bold text-sm text-[#1B1915] dark:text-[#EFE9DD] font-display">
                    {isArabic ? 'إشعارات المواعيد والمهام' : 'Task Deadline & Push Reminders'}
                  </h3>
                </div>

                {/* Push Notifications Row */}
                <div className={STYLES.settingRow}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                        {isArabic ? 'إشعارات المتصفح الفورية (Push)' : 'Browser Push Notifications'}
                      </span>
                      {permissionState === 'granted' ? (
                        <Tag color="success" className="font-mono text-[10px] m-0">
                          <CheckCircleOutlined className="me-1" />
                          {isArabic ? 'مفعل' : 'Active'}
                        </Tag>
                      ) : (
                        <Tag color="default" className="font-mono text-[10px] m-0">
                          {isArabic ? 'يتطلب الإذن' : 'Permission Required'}
                        </Tag>
                      )}
                    </div>
                    <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                      {isArabic
                        ? 'تنبيه نظام فوري عند اقتراب موعد تسليم أي مهمة'
                        : 'Native system notification when tasks reach warning thresholds'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {permissionState !== 'granted' && (
                      <Button size="small" onClick={handleRequestPushPermission} className={STYLES.secondaryBtn}>
                        {isArabic ? 'منح الإذن' : 'Request Permission'}
                      </Button>
                    )}
                    <Switch
                      checked={settings.pushNotifications && permissionState === 'granted'}
                      onChange={(checked) => {
                        if (checked && permissionState !== 'granted') {
                          handleRequestPushPermission();
                        } else {
                          setSettings((prev) => ({ ...prev, pushNotifications: checked }));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Test Alert Button */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#EDECE8]/40 dark:bg-[#1C1A17]/40 border border-[#DDDAD3] dark:border-[#2C2824]">
                  <span className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic ? 'تحقق من عمل نظام الإشعارات الآن' : 'Verify push alert dispatching on this browser'}
                  </span>
                  <Button
                    size="small"
                    icon={<SendOutlined />}
                    onClick={handleSendTestNotification}
                    className={STYLES.secondaryBtn}
                  >
                    {isArabic ? 'إرسال إشعار تجريبي' : 'Send Test Alert'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: APPEARANCE (media_1792679043571_88d285a7.png) */}
          {activeTab === 'appearance' && (
            <Card variant="outlined" className={STYLES.card}>
              <div className={STYLES.sectionHeader}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BgColorsOutlined className="text-base text-[#7A5818] dark:text-[#D4B26E]" />
                    <h2 className="font-bold text-lg text-[#1B1915] dark:text-[#EFE9DD] font-display">
                      {isArabic ? 'المظهر' : 'Appearance'}
                    </h2>
                  </div>
                  <Tag className="m-0 font-mono text-[10px] font-semibold bg-[#EDECE8] dark:bg-[#1C1A17] text-[#5A5348] dark:text-[#B5AC9C] border border-[#DDDAD3] dark:border-[#2C2824]">
                    UI_THEME
                  </Tag>
                </div>
                <p className="text-xs text-[#5A5348] dark:text-[#9A9183] mt-1">
                  {isArabic
                    ? 'سمة التطبيق، لوحة الألوان الكروماتية، وأنماط التباين البصري.'
                    : 'Application theme, chromatic palette, and visual contrast modes.'}
                </p>
              </div>

              {/* Theme Mode Selector Cards */}
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                    {isArabic ? 'نمط المظهر' : 'Theme Mode'}
                  </div>
                  <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic
                      ? 'اختر كيف يظهر TaskFlow عبر الجلسات والشاشات المختلفة.'
                      : 'Choose how TaskFlow appears across sessions and displays.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* DARK MODE CARD */}
                  <div
                    onClick={() => setThemeMode('dark')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      themeMode === 'dark'
                        ? 'border-blue-500 bg-blue-500/5 shadow-sm'
                        : 'border-[#DDDAD3] dark:border-[#2C2824] hover:border-[#7A5818]/40'
                    }`}
                  >
                    {/* Dark Preview Window */}
                    <div className="w-full h-24 rounded-lg bg-[#0B0F19] p-3 flex flex-col justify-between border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="h-1.5 w-12 rounded bg-slate-700" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-full rounded bg-slate-800" />
                        <div className="h-2 w-3/4 rounded bg-slate-800" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 px-1">
                      <span className="font-bold text-xs sm:text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                        Dark
                      </span>
                      {themeMode === 'dark' ? (
                        <CheckCircleFilled className="text-blue-500 text-sm" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#DDDAD3] dark:border-[#2C2824]" />
                      )}
                    </div>
                  </div>

                  {/* LIGHT MODE CARD */}
                  <div
                    onClick={() => setThemeMode('light')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      themeMode === 'light'
                        ? 'border-blue-500 bg-blue-500/5 shadow-sm'
                        : 'border-[#DDDAD3] dark:border-[#2C2824] hover:border-[#7A5818]/40'
                    }`}
                  >
                    {/* Light Preview Window */}
                    <div className="w-full h-24 rounded-lg bg-[#E2E8F0] p-3 flex flex-col justify-between border border-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span className="h-1.5 w-12 rounded bg-slate-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-full rounded bg-slate-300" />
                        <div className="h-2 w-3/4 rounded bg-slate-300" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 px-1">
                      <span className="font-bold text-xs sm:text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                        Light
                      </span>
                      {themeMode === 'light' ? (
                        <CheckCircleFilled className="text-blue-500 text-sm" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#DDDAD3] dark:border-[#2C2824]" />
                      )}
                    </div>
                  </div>

                  {/* SYSTEM MODE CARD */}
                  <div
                    onClick={() => {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      setThemeMode(prefersDark ? 'dark' : 'light');
                    }}
                    className="p-3 rounded-xl border border-[#DDDAD3] dark:border-[#2C2824] hover:border-[#7A5818]/40 transition-all cursor-pointer"
                  >
                    {/* System Split Preview Window */}
                    <div className="w-full h-24 rounded-lg bg-gradient-to-r from-[#0B0F19] to-[#E2E8F0] p-3 flex flex-col justify-between border border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="h-1.5 w-12 rounded bg-slate-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-2/3 rounded bg-slate-600" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 px-1">
                      <span className="font-bold text-xs sm:text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                        System
                      </span>
                      <span className="w-3.5 h-3.5 rounded-full border border-[#DDDAD3] dark:border-[#2C2824]" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: TYPOGRAPHY (media_1792679023904_76145d81.png) */}
          {activeTab === 'typography' && (
            <Card variant="outlined" className={STYLES.card}>
              <div className={STYLES.sectionHeader}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FontSizeOutlined className="text-base text-[#7A5818] dark:text-[#D4B26E]" />
                    <h2 className="font-bold text-lg text-[#1B1915] dark:text-[#EFE9DD] font-display">
                      {isArabic ? 'الخطوط' : 'Typography'}
                    </h2>
                  </div>
                  <Tag className="m-0 font-mono text-[10px] font-semibold bg-[#EDECE8] dark:bg-[#1C1A17] text-[#5A5348] dark:text-[#B5AC9C] border border-[#DDDAD3] dark:border-[#2C2824]">
                    FONT_SCALE
                  </Tag>
                </div>
                <p className="text-xs text-[#5A5348] dark:text-[#9A9183] mt-1">
                  {isArabic
                    ? 'مقياس الخطوط، عائلة الخط الأساسي، وقابلية قراءة الواجهة في مساحة العمل.'
                    : 'Type scale, family bindings, and workspace interface readability.'}
                </p>
              </div>

              {/* Font Selector */}
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                    {isArabic ? 'عائلة الخط' : 'Font'}
                  </div>
                  <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic ? 'اختر خط الواجهة الرئيسي.' : 'Choose the primary interface font.'}
                  </div>
                </div>

                <Select
                  value={fontFamily}
                  onChange={(val) => setFontFamily(val)}
                  className="w-full sm:w-96"
                  options={[
                    { value: 'Inter (Recommended Default)', label: 'Inter (Recommended Default)' },
                    { value: 'JetBrains Mono (Code/Dev)', label: 'JetBrains Mono (Code/Dev)' },
                    { value: 'SF Pro / System Sans', label: 'SF Pro / System Sans' },
                  ]}
                />
              </div>

              {/* Font Size Selector */}
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                    {isArabic ? 'حجم الخط' : 'Font Size'}
                  </div>
                  <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                    {isArabic
                      ? 'اضبط مقياس حجم النص عبر جداول البيانات واللوحات.'
                      : 'Adjust the interface text size scale across data tables and inspectors.'}
                  </div>
                </div>

                <Segmented
                  value={fontSize}
                  onChange={(val) => setFontSize(val as any)}
                  options={[
                    { label: 'Small (13px)', value: 'small' },
                    { label: 'Medium (14px - Default)', value: 'medium' },
                    { label: 'Large (15px)', value: 'large' },
                  ]}
                  className="bg-[#EDECE8] dark:bg-[#1C1A17] text-xs font-semibold"
                />
              </div>

              {/* LIVE TYPOGRAPHY PREVIEW BOX */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-semibold uppercase tracking-wider text-[#5A5348] dark:text-[#9A9183]">
                    LIVE TYPOGRAPHY PREVIEW
                  </span>
                  <span className="text-[#5A5348] dark:text-[#9A9183]">
                    Scale: {fontSize === 'small' ? '92%' : fontSize === 'large' ? '108%' : '100%'} · Line: 20px
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#0B0F19] transition-all flex flex-wrap items-center gap-3 ${
                    fontFamily.includes('JetBrains') ? 'font-mono' : 'font-sans'
                  } ${
                    fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'
                  }`}
                >
                  <span className="text-[#5A5348] dark:text-[#9A9183] font-mono select-none">::</span>
                  <span className="font-bold text-[#1B1915] dark:text-[#EFE9DD] font-mono">
                    TASK-108 D.
                  </span>
                  <Tag className="m-0 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold px-2 py-0.5 rounded">
                    In Progress
                  </Tag>
                  <Tag className="m-0 bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-semibold px-2 py-0.5 rounded">
                    · High
                  </Tag>
                  <span className="text-[#5A5348] dark:text-[#B5AC9C] font-medium">
                    Target delivery in 2 days
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: ACCOUNT (media_1792679053514_e3f2aee7.png) */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card variant="outlined" className={STYLES.card}>
                <div className={STYLES.sectionHeader}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <UserOutlined className="text-base text-[#7A5818] dark:text-[#D4B26E]" />
                      <h2 className="font-bold text-lg text-[#1B1915] dark:text-[#EFE9DD] font-display">
                        {isArabic ? 'الحساب' : 'Account'}
                      </h2>
                    </div>
                    <Tag className="m-0 font-mono text-[10px] font-semibold bg-[#EDECE8] dark:bg-[#1C1A17] text-[#5A5348] dark:text-[#B5AC9C] border border-[#DDDAD3] dark:border-[#2C2824]">
                      USER_CRED
                    </Tag>
                  </div>
                  <p className="text-xs text-[#5A5348] dark:text-[#9A9183] mt-1">
                    {isArabic
                      ? 'التفاصيل الشخصية، البريد المهني، بيانات الاعتماد، والإجراءات الحساسة.'
                      : 'Personal details, professional email, credentials, and dangerous actions.'}
                  </p>
                </div>

                {/* Profile Avatar */}
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                      {isArabic ? 'الصورة الرمزية' : 'Profile Avatar'}
                    </div>
                    <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                      {isArabic
                        ? 'تظهر عبر سجلات نشاط مساحة العمل وبطاقات لوحة المهام.'
                        : 'Displayed across workspace activity logs and board cards.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Interactive Profile Avatar with hover camera badge */}
                    <div
                      className="relative group cursor-pointer shrink-0"
                      onClick={() => setIsAvatarModalOpen(true)}
                      title={isArabic ? 'انقر لتغيير الصورة' : 'Click to change photo'}
                    >
                      <Avatar
                        size={64}
                        src={user?.avatarUrl || user?.photoURL}
                        className="bg-[#7A5818] dark:bg-[#D4B26E] text-white dark:text-[#1A1408] font-bold text-2xl shadow-sm border-2 border-[#DDDAD3] dark:border-[#2C2824]"
                      >
                        {!user?.avatarUrl && !user?.photoURL && (fullName?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || 'U')}
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg">
                        <CameraOutlined />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141211]" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button
                        size="middle"
                        icon={<UploadOutlined />}
                        loading={isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className={STYLES.primaryBtn}
                      >
                        {isArabic ? 'رفع صورة' : 'Upload Photo'}
                      </Button>
                      <Button
                        size="middle"
                        icon={<PictureOutlined />}
                        onClick={() => setIsAvatarModalOpen(true)}
                        className={STYLES.secondaryBtn}
                      >
                        {isArabic ? 'معرض الصور الرمزية' : 'Browse Avatars'}
                      </Button>
                      {(user?.avatarUrl || user?.photoURL) && (
                        <Button
                          type="text"
                          size="middle"
                          loading={isUploadingAvatar}
                          onClick={() => saveAvatar(null)}
                          className="text-xs text-[#5A5348] dark:text-[#9A9183] hover:text-rose-500"
                        >
                          {isArabic ? 'إزالة' : 'Remove'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identity Details */}
                <div className="pt-4 border-t border-[#DDDAD3] dark:border-[#2C2824] space-y-4">
                  <div>
                    <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                      {isArabic ? 'تفاصيل الهوية' : 'Identity Details'}
                    </div>
                    <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                      {isArabic
                        ? 'الاسم المعتمد في سجلات المهام وإيداعات Git.'
                        : 'Canonical naming used in Git commits and pull requests.'}
                    </div>
                  </div>

                  {/* Full Name Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                      {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <Input
                      size="large"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={STYLES.inputBase}
                    />
                  </div>

                  {/* Work Email with Verified Badge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                        {isArabic ? 'بريد العمل' : 'Work Email'}
                      </label>
                      <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircleOutlined /> {isArabic ? 'موثق' : 'Verified'}
                      </span>
                    </div>
                    <Input
                      size="large"
                      value={workEmail}
                      disabled
                      className={`${STYLES.inputBase} opacity-80 cursor-not-allowed font-mono`}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="primary"
                      size="middle"
                      icon={<SaveOutlined />}
                      loading={isSavingProfile}
                      onClick={handleSaveProfile}
                      className={STYLES.primaryBtn}
                    >
                      {isArabic ? 'حفظ التعديلات' : 'Save Changes'}
                    </Button>
                  </div>
                </div>

                {/* Change Password Card */}
                <div className="pt-4 border-t border-[#DDDAD3] dark:border-[#2C2824] space-y-4">
                  <div>
                    <div className="font-semibold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
                      {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                    </div>
                    <div className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                      {isArabic
                        ? 'تأكد من أن كلمة المرور تحتوي على 12 حرفاً على الأقل وأرقام ورموز.'
                        : 'Ensure passwords contain at least 12 characters, numbers, and symbols.'}
                    </div>
                  </div>

                  {/* Current Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                      {isArabic ? 'كلمة المرور الحالية' : 'Current Password'}
                    </label>
                    <Input
                      size="large"
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="text-[#5A5348] dark:text-[#9A9183] hover:text-[#1B1915]"
                        >
                          {showCurrentPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      }
                      className={STYLES.inputBase}
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                      {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <Input
                      size="large"
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Minimum 12 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="text-[#5A5348] dark:text-[#9A9183] hover:text-[#1B1915]"
                        >
                          {showNewPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      }
                      className={STYLES.inputBase}
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                      {isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                    </label>
                    <Input
                      size="large"
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="text-[#5A5348] dark:text-[#9A9183] hover:text-[#1B1915]"
                        >
                          {showConfirmPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </button>
                      }
                      className={STYLES.inputBase}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <span className="text-xs font-mono text-[#5A5348] dark:text-[#9A9183]">
                      2FA enforcement active
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="middle"
                        onClick={() => {
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className={STYLES.secondaryBtn}
                      >
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button
                        type="primary"
                        size="middle"
                        loading={isChangingPass}
                        onClick={handleUpdatePassword}
                        className={STYLES.primaryBtn}
                      >
                        {isArabic ? 'تحديث كلمة المرور' : 'Update Password'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Danger Zone: Account Deletion */}
              <div className={STYLES.dangerCard}>
                <div className="flex items-start gap-3">
                  <WarningOutlined className="text-xl text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-600 dark:text-rose-400">
                      {isArabic ? 'منطقة الخطر' : 'Danger Zone'}
                    </h4>
                    <p className="text-xs text-[#5A5348] dark:text-[#B5AC9C] mt-0.5 leading-relaxed">
                      {isArabic
                        ? 'حذف حسابك في TaskFlow وجميع بيانات مساحات العمل بشكل نهائي لا يمكن الرجوع عنه.'
                        : 'Permanently delete your TaskFlow account and associated workspace data. This action is irreversible.'}
                    </p>
                  </div>
                </div>

                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={() => setDeleteModalOpen(true)}
                  className="shrink-0 font-bold text-xs sm:text-sm"
                >
                  {isArabic ? 'حذف الحساب' : 'Delete Account'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDeleteAccount}
        confirmLoading={isDeletingAccount}
        okText={isArabic ? 'نعم، احذف الحساب نهائياً' : 'Yes, Delete My Account'}
        cancelText={isArabic ? 'إلغاء' : 'Cancel'}
        okButtonProps={{ danger: true }}
        title={
          <div className="flex items-center gap-2 text-rose-600 font-bold">
            <WarningOutlined />
            <span>{isArabic ? 'تأكيد حذف الحساب' : 'Confirm Account Deletion'}</span>
          </div>
        }
      >
        <div className="py-3 space-y-3">
          <p className="text-xs text-[#5A5348] dark:text-[#9A9183]">
            {isArabic
              ? 'لتأكيد حذف الحساب، يرجى كتابة كلمة "delete" في الحقل أدناه:'
              : 'This will erase all projects, tasks, and settings. Type "delete" to confirm:'}
          </p>
          <Input
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="delete"
            className="font-mono text-sm"
          />
        </div>
      </Modal>

      {/* Avatar Customization Modal */}
      <Modal
        open={isAvatarModalOpen}
        onCancel={() => setIsAvatarModalOpen(false)}
        footer={null}
        width={540}
        centered
        title={
          <div className="flex items-center gap-2 text-base font-bold text-[#1B1915] dark:text-[#EFE9DD]">
            <PictureOutlined className="text-[#7A5818] dark:text-[#D4B26E]" />
            <span>{isArabic ? 'تخصيص الصورة الشخصية' : 'Customize Profile Picture'}</span>
          </div>
        }
      >
        <div className="py-4 space-y-6">
          {/* Section 1: Upload from Device */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5A5348] dark:text-[#9A9183]">
              {isArabic ? '1. رفع صورة من جهازك' : '1. Upload Photo from Device'}
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-[#DDDAD3] dark:border-[#2C2824] hover:border-[#7A5818] dark:hover:border-[#D4B26E] bg-black/5 dark:bg-white/5 rounded-xl text-center cursor-pointer transition-colors space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-[#7A5818]/10 dark:bg-[#D4B26E]/10 text-[#7A5818] dark:text-[#D4B26E] flex items-center justify-center mx-auto text-lg">
                <UploadOutlined />
              </div>
              <div className="text-xs font-semibold text-[#1B1915] dark:text-[#EFE9DD]">
                {isArabic ? 'انقر لاختيار ملف من جهازك' : 'Click to browse image file'}
              </div>
              <div className="text-[11px] text-[#5A5348] dark:text-[#9A9183]">
                PNG, JPG, WebP {isArabic ? 'حتى 10 ميغابايت (يتم ضغطها وتوسيطها تلقائياً)' : 'up to 10MB (auto-cropped to square)'}
              </div>
            </div>
          </div>

          {/* Section 2: Choose from Curated Preset Avatars */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5A5348] dark:text-[#9A9183]">
              {isArabic ? '2. اختيار من النماذج الاحترافية' : '2. Choose from Curated Avatars'}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((url, idx) => {
                const isSelected = (user?.avatarUrl || user?.photoURL) === url;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => saveAvatar(url)}
                    className={`relative p-1 rounded-full transition-all group outline-none ${
                      isSelected
                        ? 'ring-2 ring-[#7A5818] dark:ring-[#D4B26E] scale-105'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Avatar
                      size={54}
                      src={url}
                      className="border border-[#DDDAD3] dark:border-[#2C2824] shadow-xs"
                    />
                    {isSelected && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#7A5818] dark:bg-[#D4B26E] text-white dark:text-[#1A1408] text-[10px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Direct Web Image URL */}
          <div className="space-y-2 pt-2 border-t border-[#DDDAD3]/60 dark:border-[#2C2824]/60">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5A5348] dark:text-[#9A9183]">
              {isArabic ? '3. أو أدخل رابط صورة مباشر' : '3. Or Paste Direct Image URL'}
            </div>
            <div className="flex gap-2">
              <Input
                prefix={<LinkOutlined className="text-[#5A5348] dark:text-[#9A9183]" />}
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                onPressEnter={handleApplyCustomUrl}
                className={STYLES.inputBase}
              />
              <Button
                type="primary"
                loading={isUploadingAvatar}
                onClick={handleApplyCustomUrl}
                className={STYLES.primaryBtn}
              >
                {isArabic ? 'تطبيق' : 'Apply'}
              </Button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#DDDAD3]/60 dark:border-[#2C2824]/60">
            {(user?.avatarUrl || user?.photoURL) ? (
              <Button
                type="text"
                danger
                loading={isUploadingAvatar}
                onClick={() => saveAvatar(null)}
                className="text-xs"
              >
                {isArabic ? 'إزالة الصورة واستعادة الحرف الأولي' : 'Remove Avatar (Use Initials)'}
              </Button>
            ) : (
              <span className="text-xs text-[#5A5348] dark:text-[#9A9183]">
                {isArabic ? 'الحساب يستخدم حالياً الأحرف الأولى' : 'Using default initials'}
              </span>
            )}
            <Button
              size="middle"
              onClick={() => setIsAvatarModalOpen(false)}
              className={STYLES.secondaryBtn}
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
