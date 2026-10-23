'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
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
const AUTH_STYLES = {
  root: 'grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] bg-[#F4F4F1] dark:bg-[#0A0908] text-[#141311] dark:text-[#F2EDE4] transition-colors duration-300',
  mainPanel:
    'flex min-w-0 flex-col justify-between px-4 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-14 xl:px-16 overflow-y-auto',
  topHeader: 'flex items-center justify-between gap-3 w-full',
  formContainer:
    'mx-auto w-full max-w-sm sm:max-w-md my-auto py-8 lg:py-10 space-y-6',
  formCard:
    'sm:bg-white sm:dark:bg-[#141210] sm:border sm:border-[#DAD7CF] sm:dark:border-[#2A2621] sm:rounded-2xl sm:p-7 md:p-8 sm:shadow-tactile-card sm:dark:shadow-tactile-card-dark transition-all animate-lateral-collision-end',
  pageTitle:
    'font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#141311] dark:text-[#F2EDE4]',
  pageSubtitle: 'mt-1.5 text-xs sm:text-sm text-[#635B4E] dark:text-[#B8AFA0] leading-relaxed',
  label: 'block text-xs font-semibold text-[#4F493F] dark:text-[#B8AFA0] mb-1.5',
  inputBase:
    'h-11 rounded-lg text-sm bg-white dark:bg-[#1C1A17] border-[#DAD7CF] dark:border-[#2A2621] hover:border-[#7A5818] dark:hover:border-[#D4B26E] focus:border-[#7A5818] dark:focus:border-[#D4B26E] text-[#141311] dark:text-[#F2EDE4] transition-colors',
  primarySubmitButton:
    'tactile-btn w-full h-11 rounded-lg font-bold text-sm !bg-[#7A5818] dark:!bg-[#D4B26E] hover:!bg-[#5E420E] dark:hover:!bg-[#E2C88E] !text-white dark:!text-[#1A1408] !border-transparent shadow-sm flex items-center justify-center gap-2 select-none active:scale-[0.98]',
  socialButton:
    'tactile-btn w-full h-11 rounded-lg font-semibold text-xs sm:text-sm bg-white dark:bg-[#1C1A17] hover:bg-[#EBEAE5] dark:hover:bg-[#24211D] text-[#141311] dark:text-[#F2EDE4] border border-[#DAD7CF] dark:border-[#2A2621] flex items-center justify-center gap-2.5 transition-colors select-none active:scale-[0.98]',
  togglePill:
    'tactile-btn h-8 px-2.5 rounded-lg border border-[#DAD7CF] dark:border-[#2A2621] bg-white dark:bg-[#1C1A17] text-[#4F493F] dark:text-[#B8AFA0] hover:text-[#141311] dark:hover:text-[#F2EDE4] flex items-center gap-1.5 text-xs font-semibold select-none cursor-pointer',
  demoPill:
    'tactile-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-[#D4B26E]/15 hover:bg-[#D4B26E]/25 text-[#7A5818] dark:text-[#D4B26E] border border-[#D4B26E]/30 cursor-pointer transition-colors',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
interface LoginFormValues {
  email: string;
  password: string;
}

// ============================================================================
// 4. SUB-COMPONENTS
// ============================================================================

/**
 * أيقونة جوجل الرسمية رباعية الألوان
 */
function GoogleVectorIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// ============================================================================
// 6. MAIN COMPONENT (LoginPage)
// صفحة تسجيل الدخول العالمية:
// - شاشة مقسومة (Split Panel) تدمج لوحة العلامة التجارية الفيزيائية على الديسكتوب
// - كرت الموبايل التفاعلي مع البلاطات العضوية العائمة على الهواتف والأجهزة اللوحية
// - تعبئة سريعة للحساب التجريبي بنقرة واحدة
// - تجاوب لغوي ثنائي كامل (عربي RTL وإنجليزي LTR) مع حظر قاطع للرموز التعبيرية
// ============================================================================
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { themeMode, toggleTheme } = useTheme();
  const [form] = Form.useForm<LoginFormValues>();

  const isArabic = language === 'ar';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // تعبئة سريعة للحساب التجريبي (Admin Demo)
  const handleQuickDemoFill = () => {
    form.setFieldsValue({
      email: 'admin@taskflow.dev',
      password: 'password123',
    });
    setErrorMessage(null);
  };

  // تسليم النموذج ومعالجة تسجيل الدخول
  const handleFormSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(values.email.trim(), values.password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err?.message ||
          (isArabic
            ? 'خطأ في البريد الإلكتروني أو كلمة المرور. يرجى التحقق من صحة بياناتك.'
            : 'Invalid email or password combination. Please verify your credentials.')
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={AUTH_STYLES.root} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Left Desktop Brand Panel: Kinetic Logo Assembly & Resonance */}
      <AuthBrandPanel mode="login" />

      {/* 2. Right Side: Navigation, Mobile Hero, and Form */}
      <main className={AUTH_STYLES.mainPanel}>
        {/* Top Header: Logo on mobile + Theme & Language Switches */}
        <header className={AUTH_STYLES.topHeader}>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A5818] dark:focus:ring-[#D4B26E]">
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
            <Tooltip title={themeMode === 'dark' ? (isArabic ? 'الوضع الفاتح' : 'Light Mode') : (isArabic ? 'الوضع الداكن' : 'Dark Mode')}>
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
          <AuthMobileHeroCard mode="login" />

          <div className={AUTH_STYLES.formCard}>
            {/* Title & Subtitle */}
            <div className="mb-6 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className={AUTH_STYLES.pageTitle}>
                  {isArabic ? 'مرحباً بعودتك' : 'Welcome back'}
                </h1>

                {/* Quick Demo Fill Pill */}
                <Tooltip title={isArabic ? 'اضغط لتعبئة بيانات الحساب التجريبي بنقرة واحدة' : 'Click to autofill demo credentials'}>
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className={AUTH_STYLES.demoPill}
                  >
                    <ThunderboltOutlined className="text-xs" />
                    <span>{isArabic ? 'حساب تجريبي' : 'Demo Fill'}</span>
                  </button>
                </Tooltip>
              </div>

              <p className={AUTH_STYLES.pageSubtitle}>
                {isArabic
                  ? 'أدخل بيانات حسابك للمتابعة إلى مساحة عملك الهندسية'
                  : 'Enter your credentials to access your engineering workspace'}
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

            {/* Login Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFormSubmit}
              requiredMark={false}
              autoComplete="on"
            >
              {/* Email Address */}
              <Form.Item
                name="email"
                label={
                  <span className={AUTH_STYLES.label}>
                    {isArabic ? 'البريد الإلكتروني' : 'Email address'}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: isArabic
                      ? 'يرجى إدخال البريد الإلكتروني'
                      : 'Please enter your email',
                  },
                  {
                    type: 'email',
                    message: isArabic
                      ? 'يرجى إدخال بريد إلكتروني صحيح'
                      : 'Please enter a valid email address',
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-400 me-2" />}
                  placeholder={
                    isArabic ? 'example@taskflow.dev' : 'name@company.com'
                  }
                  className={AUTH_STYLES.inputBase}
                  size="large"
                />
              </Form.Item>

              {/* Password */}
              <Form.Item
                name="password"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className={AUTH_STYLES.label}>
                      {isArabic ? 'كلمة المرور' : 'Password'}
                    </span>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#7A5818] dark:text-[#D4B26E] hover:underline"
                    >
                      {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </Link>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: isArabic
                      ? 'يرجى إدخال كلمة المرور'
                      : 'Please enter your password',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 me-2" />}
                  placeholder="••••••••"
                  className={AUTH_STYLES.inputBase}
                  size="large"
                />
              </Form.Item>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  className={AUTH_STYLES.primarySubmitButton}
                >
                  <span>{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
                  {isRTL ? (
                    <ArrowLeftOutlined className="text-xs" />
                  ) : (
                    <ArrowRightOutlined className="text-xs" />
                  )}
                </Button>
              </div>
            </Form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DAD7CF] dark:border-[#2A2621]" />
              </div>
              <span className="relative bg-[#F4F4F1] sm:bg-white sm:dark:bg-[#141210] px-3 text-xs text-[#8F8575] uppercase font-mono">
                {isArabic ? 'أو المتابعة عبر' : 'Or continue with'}
              </span>
            </div>

            {/* Google OAuth Simulation */}
            <button
              type="button"
              onClick={() => {
                form.setFieldsValue({
                  email: 'google.engineer@taskflow.dev',
                  password: 'password123',
                });
                handleFormSubmit({
                  email: 'google.engineer@taskflow.dev',
                  password: 'password123',
                });
              }}
              className={AUTH_STYLES.socialButton}
            >
              <GoogleVectorIcon size={18} />
              <span>{isArabic ? 'المتابعة بحساب Google' : 'Continue with Google'}</span>
            </button>

            {/* Footer Registration Link */}
            <div className="mt-6 text-center text-xs text-[#635B4E] dark:text-[#B8AFA0]">
              <span>
                {isArabic ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}
              </span>{' '}
              <Link
                href="/register"
                className="font-bold text-[#7A5818] dark:text-[#D4B26E] hover:underline"
              >
                {isArabic ? 'إنشاء حساب جديد' : 'Sign up'}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Footer Watermark */}
        <footer className="text-center text-xs text-[#8F8575] py-2">
          <span>
            {isArabic
              ? 'تاسك فلو © 2026 • منصة هندسة المهام المؤسسية'
              : 'TaskFlow © 2026 • Enterprise Project Execution'}
          </span>
        </footer>
      </main>
    </div>
  );
}
