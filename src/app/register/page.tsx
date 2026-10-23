'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Form, Input, Button, Alert, Tooltip } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import Logo from '@/components/ui/Logo';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { AuthMobileHeroCard } from '@/components/auth/AuthMobileHeroCard';

// ============================================================================
// 2. CONFIGURATION, CONSTANTS & STYLES (EASY EDIT ZONE)
// ============================================================================
const CONFIG = {
  minPasswordLength: 6,
  defaultRole: 'owner' as const,
} as const;

const AUTH_STYLES = {
  root: 'grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] bg-[#F4F4F1] dark:bg-[#0A0908] text-[#141311] dark:text-[#F2EDE4] transition-colors duration-300',
  mainPanel:
    'flex min-w-0 flex-col justify-between px-4 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-14 xl:px-16 overflow-y-auto',
  topHeader: 'flex items-center justify-between gap-3 w-full',
  formContainer:
    'mx-auto w-full max-w-sm sm:max-w-md my-auto py-8 lg:py-10 space-y-6',
  formCard:
    'sm:bg-white sm:dark:bg-[#141210] sm:border sm:border-[#DAD7CF] sm:dark:border-[#2A2621] sm:rounded-2xl sm:p-7 md:p-8 sm:shadow-tactile-card sm:dark:shadow-tactile-card-dark transition-all animate-visceral-slam',
  pageTitle:
    'font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#141311] dark:text-[#F2EDE4]',
  pageSubtitle: 'mt-1.5 text-xs sm:text-sm text-[#635B4E] dark:text-[#B8AFA0] leading-relaxed',
  label: 'block text-xs font-semibold text-[#4F493F] dark:text-[#B8AFA0] mb-1.5',
  inputBase:
    'h-11 rounded-lg text-sm bg-white dark:bg-[#1C1A17] border-[#DAD7CF] dark:border-[#2A2621] hover:border-[#7A5818] dark:hover:border-[#D4B26E] focus:border-[#7A5818] dark:focus:border-[#D4B26E] text-[#141311] dark:text-[#F2EDE4] transition-colors',
  primarySubmitButton:
    'tactile-btn w-full h-11 rounded-lg font-bold text-sm !bg-[#7A5818] dark:!bg-[#D4B26E] hover:!bg-[#5E420E] dark:hover:!bg-[#E2C88E] !text-white dark:!text-[#1A1408] !border-transparent shadow-sm flex items-center justify-center gap-2 select-none active:scale-[0.98]',
  togglePill:
    'tactile-btn h-8 px-2.5 rounded-lg border border-[#DAD7CF] dark:border-[#2A2621] bg-white dark:bg-[#1C1A17] text-[#4F493F] dark:text-[#B8AFA0] hover:text-[#141311] dark:hover:text-[#F2EDE4] flex items-center gap-1.5 text-xs font-semibold select-none cursor-pointer',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

// ============================================================================
// 4. MAIN COMPONENT (RegisterPage)
// صفحة إنشاء الحساب العالمية:
// - شاشة مقسومة (Split Panel) تدمج لوحة العلامة التجارية الفيزيائية على الديسكتوب
// - كرت الموبايل التفاعلي مع شعار تاسك فلو المنضبط
// - تسجيل مباشر وآمن بالبريد المؤسسي مع منح صلاحيات المالك تلقائيا
// - تجاوب لغوي ثنائي كامل (عربي RTL وإنجليزي LTR) مع حظر قاطع للرموز التعبيرية
// ============================================================================
export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { themeMode, toggleTheme } = useTheme();
  const [form] = Form.useForm<RegisterFormValues>();

  const isArabic = language === 'ar';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await register(
        values.name.trim(),
        values.email.trim(),
        values.password,
        CONFIG.defaultRole
      );
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(
        err?.message ||
          (isArabic
            ? 'فشل في إنشاء الحساب. يرجى التحقق من صحة البيانات والمحاولة مجدداً.'
            : 'Failed to create workspace account. Please verify your details and try again.')
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={AUTH_STYLES.root} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Left Desktop Brand Panel: Kinetic Logo Assembly & Resonance */}
      <AuthBrandPanel mode="register" />

      {/* 2. Right Side: Navigation, Mobile Hero, and Registration Form */}
      <main className={AUTH_STYLES.mainPanel}>
        {/* Top Header: Logo on mobile + Theme & Language Switches */}
        <header className={AUTH_STYLES.topHeader}>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A5818] dark:focus:ring-[#D4B26E]"
            >
              <Logo size="medium" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher Pill */}
            <Tooltip title={isArabic ? 'Switch to English' : 'التحويل إلى العربية'}>
              <button
                type="button"
                onClick={toggleLanguage}
                className={AUTH_STYLES.togglePill}
                aria-label={isArabic ? 'Switch to English' : 'التحويل إلى العربية'}
              >
                <GlobalOutlined className="text-xs" />
                <span>{isArabic ? 'EN' : 'العربية'}</span>
              </button>
            </Tooltip>

            {/* Theme Switcher Pill */}
            <Tooltip
              title={
                themeMode === 'dark'
                  ? isArabic
                    ? 'الوضع الفاتح'
                    : 'Light Mode'
                  : isArabic
                  ? 'الوضع الداكن'
                  : 'Dark Mode'
              }
            >
              <button
                type="button"
                onClick={toggleTheme}
                className={AUTH_STYLES.togglePill}
                aria-label="Toggle theme mode"
              >
                {themeMode === 'dark' ? (
                  <SunOutlined className="text-xs text-[#D4B26E]" />
                ) : (
                  <MoonOutlined className="text-xs text-[#4F493F]" />
                )}
                <span className="hidden sm:inline">
                  {themeMode === 'dark'
                    ? isArabic
                      ? 'فاتح'
                      : 'Light'
                    : isArabic
                    ? 'داكن'
                    : 'Dark'}
                </span>
              </button>
            </Tooltip>
          </div>
        </header>

        {/* Form Container */}
        <div className={AUTH_STYLES.formContainer}>
          {/* Mobile Hero Card with Brand Resonance (visible < lg) */}
          <AuthMobileHeroCard mode="register" />

          <div className={AUTH_STYLES.formCard}>
            {/* Title & Subtitle */}
            <div className="mb-6 space-y-1.5">
              <h1 className={AUTH_STYLES.pageTitle}>
                {isArabic ? 'إنشاء حساب جديد' : 'Create Account'}
              </h1>
              <p className={AUTH_STYLES.pageSubtitle}>
                {isArabic
                  ? 'انضم إلى فرق العمل التي تدير مشاريعها ومهامها بوضوح هندسي مطلق'
                  : 'Join modern teams executing with absolute clarity and zero friction'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5">
                <Alert
                  message={errorMessage}
                  type="error"
                  showIcon
                  className="rounded-lg text-xs"
                />
              </div>
            )}

            {/* Registration Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              requiredMark={false}
              className="space-y-4"
            >
              {/* Full Name */}
              <Form.Item
                name="name"
                label={
                  <span className={AUTH_STYLES.label}>
                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: isArabic
                      ? 'يرجى إدخال اسمك الكامل'
                      : 'Please enter your full name',
                  },
                ]}
                className="!mb-0"
              >
                <Input
                  size="large"
                  prefix={<UserOutlined className="text-[#8F8575] me-2 text-sm" />}
                  placeholder={isArabic ? 'أحمد الخالد' : 'Alex Mercer'}
                  autoComplete="name"
                  className={AUTH_STYLES.inputBase}
                />
              </Form.Item>

              {/* Email Address */}
              <Form.Item
                name="email"
                label={
                  <span className={AUTH_STYLES.label}>
                    {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: isArabic
                      ? 'يرجى إدخال عنوان البريد الإلكتروني'
                      : 'Please enter your work email',
                  },
                  {
                    type: 'email',
                    message: isArabic
                      ? 'يرجى إدخال بريد إلكتروني صالح'
                      : 'Please enter a valid email address',
                  },
                ]}
                className="!mb-0"
              >
                <Input
                  size="large"
                  type="email"
                  prefix={<MailOutlined className="text-[#8F8575] me-2 text-sm" />}
                  placeholder="alex@enterprise.dev"
                  autoComplete="email"
                  className={AUTH_STYLES.inputBase}
                />
              </Form.Item>

              {/* Password */}
              <Form.Item
                name="password"
                label={
                  <span className={AUTH_STYLES.label}>
                    {isArabic ? 'كلمة المرور' : 'Password'}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: isArabic
                      ? 'يرجى إدخال كلمة المرور'
                      : 'Please enter your password',
                  },
                  {
                    min: CONFIG.minPasswordLength,
                    message: isArabic
                      ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف'
                      : 'Password must be at least 6 characters',
                  },
                ]}
                className="!mb-0"
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className="text-[#8F8575] me-2 text-sm" />}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className={AUTH_STYLES.inputBase}
                />
              </Form.Item>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isLoading}
                  icon={<ArrowRightOutlined className="rtl:-scale-x-100" />}
                  iconPosition="end"
                  className={AUTH_STYLES.primarySubmitButton}
                >
                  {isLoading
                    ? isArabic
                      ? 'جاري إعداد مساحة العمل...'
                      : 'Initializing workspace...'
                    : isArabic
                    ? 'إنشاء الحساب والمتابعة'
                    : 'Create Workspace Account'}
                </Button>
              </div>
            </Form>

            {/* Switch to Login Link */}
            <div className="mt-6 pt-5 text-center text-xs text-[#635B4E] dark:text-[#B8AFA0] border-t border-[#DAD7CF] dark:border-[#2A2621]">
              <span>
                {isArabic ? 'لديك حساب بالفعل في TaskFlow؟ ' : 'Already have an account? '}
              </span>
              <Link
                href="/login"
                className="font-bold text-[#7A5818] dark:text-[#D4B26E] hover:underline focus:outline-none"
              >
                {isArabic ? 'تسجيل الدخول' : 'Sign in here'}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Footer Notice */}
        <footer className="w-full text-center py-4 text-[11px] text-[#8F8575] select-none">
          {isArabic ? (
            <span>
              نظام محمي بأعلى معايير التشفير • مساحة عمل هندسية موثوقة
            </span>
          ) : (
            <span>
              Protected by enterprise-grade encryption • TaskFlow Systems
            </span>
          )}
        </footer>
      </main>
    </div>
  );
}
