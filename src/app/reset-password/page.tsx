'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SafetyOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Input, Button, message } from 'antd';
import { useLanguage } from '@/context/LanguageContext';
import { DataService } from '@/services/dataStore';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const STYLES = {
  card: 'w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#141211] border border-[#DDDAD3] dark:border-[#2C2824] shadow-xl space-y-6',
  input: 'h-11 rounded-lg text-sm bg-[#F4F4F2] dark:bg-[#1C1A17] border-[#DDDAD3] dark:border-[#2C2824] text-[#1B1915] dark:text-[#EFE9DD]',
  primaryBtn:
    'h-11 !bg-[#7A5818] dark:!bg-[#D4B26E] hover:!bg-[#5e4310] dark:hover:!bg-[#e5c583] !border-transparent !text-white dark:!text-[#1A1408] font-bold text-sm rounded-lg shadow-sm w-full',
};

// ============================================================================
// 3. INNER COMPONENT (With SearchParams)
// ============================================================================
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setVerifying(false);
          setTokenValid(false);
          setErrorMessage(
            isArabic
              ? 'رمز إعادة التعيين مفقود. يرجى استخدام الرابط المرسل إلى بريدك الإلكتروني.'
              : 'Missing reset token. Please follow the link sent to your email.'
          );
        }
        return;
      }

      try {
        setVerifying(true);
        const res = await DataService.verifyResetToken(token);
        if (isMounted) {
          setTokenValid(true);
          setUserEmail(res.email);
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValid(false);
          setErrorMessage(
            err?.message ||
              (isArabic
                ? 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته (الرابط صالح لمدة 60 دقيقة فقط).'
                : 'Invalid or expired password reset link.')
          );
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token, isArabic]);

  // Real-time password criteria
  const passwordCriteria = useMemo(() => {
    return {
      hasLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      isMatched: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const isFormValid =
    passwordCriteria.hasLength &&
    passwordCriteria.hasNumber &&
    passwordCriteria.isMatched &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      message.error(
        isArabic
          ? 'يرجى استيفاء معايير الأمان لكلمة المرور وتطابق الحقلين.'
          : 'Please fulfill all password requirements and ensure passwords match.'
      );
      return;
    }

    try {
      setLoading(true);
      await DataService.resetPassword(token, newPassword);
      setSuccess(true);
      message.success(
        isArabic
          ? 'تم تغيير كلمة المرور بنجاح! سيتم تحويلك لصفحة الدخول...'
          : 'Password successfully changed! Redirecting to login...'
      );
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      message.error(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#F4F4F2] dark:bg-[#0C0B0A] text-[#1B1915] dark:text-[#EFE9DD] transition-colors">
      <div className={STYLES.card}>
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#7A5818]/10 dark:bg-[#D4B26E]/10 text-[#7A5818] dark:text-[#D4B26E] text-2xl mb-1 border border-[#7A5818]/20 dark:border-[#D4B26E]/20">
            <SafetyOutlined />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B1915] dark:text-[#EFE9DD]">
            {isArabic ? 'إنشاء كلمة مرور جديدة' : 'Create New Password'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#B5AC9C]">
            {userEmail
              ? isArabic
                ? `لحساب: ${userEmail}`
                : `For account: ${userEmail}`
              : isArabic
              ? 'اختر كلمة مرور قوية لحماية حسابك وبيانات مشاريعك.'
              : 'Choose a strong password to safeguard your workspace.'}
          </p>
        </div>

        {/* 1. Loading Verification State */}
        {verifying && (
          <div className="py-12 text-center space-y-3">
            <LoadingOutlined className="text-3xl text-[#7A5818] dark:text-[#D4B26E] animate-spin" />
            <div className="text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
              {isArabic ? 'جاري التحقق من صحة الرابط الأمني...' : 'Verifying security token...'}
            </div>
          </div>
        )}

        {/* 2. Error / Expired Link State */}
        {!verifying && !tokenValid && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 text-3xl flex items-center justify-center mx-auto border border-rose-500/20">
              <CloseCircleFilled />
            </div>
            <div className="font-bold text-sm text-[#1B1915] dark:text-[#EFE9DD]">
              {isArabic ? 'تعذر إتمام العملية' : 'Invalid Reset Link'}
            </div>
            <p className="text-xs text-[#5A5348] dark:text-[#B5AC9C] leading-relaxed">
              {errorMessage}
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Link href="/forgot-password">
                <Button type="primary" className={STYLES.primaryBtn}>
                  {isArabic ? 'طلب رابط جديد' : 'Request New Reset Link'}
                </Button>
              </Link>
              <Link href="/login">
                <Button type="text" className="text-xs text-[#7A5818] dark:text-[#D4B26E] font-semibold w-full">
                  {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Celebratory Success State */}
        {!verifying && tokenValid && success && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 text-4xl flex items-center justify-center mx-auto border border-emerald-500/20 animate-bounce">
              <CheckCircleFilled />
            </div>
            <h3 className="font-bold text-base text-[#1B1915] dark:text-[#EFE9DD]">
              {isArabic ? 'تم تحديث كلمة المرور بنجاح!' : 'Password Reset Complete!'}
            </h3>
            <p className="text-xs text-[#5A5348] dark:text-[#B5AC9C] leading-relaxed">
              {isArabic
                ? 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.'
                : 'You can now log in with your updated credentials. Redirecting...'}
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button type="primary" className={STYLES.primaryBtn}>
                  {isArabic ? 'الدخول الآن' : 'Log In Now'}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 4. Active Password Input Form */}
        {!verifying && tokenValid && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="••••••••"
                  prefix={<LockOutlined className="text-[#5A5348] dark:text-[#9A9183] me-1" />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={STYLES.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-[#5A5348] dark:text-[#9A9183] hover:text-[#1B1915] dark:hover:text-[#EFE9DD]"
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                prefix={<LockOutlined className="text-[#5A5348] dark:text-[#9A9183] me-1" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={STYLES.input}
              />
            </div>

            {/* Criteria Checklist */}
            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-[#DDDAD3]/50 dark:border-[#2C2824]/50 space-y-1.5 text-[11px]">
              <div
                className={`flex items-center gap-1.5 ${
                  passwordCriteria.hasLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#736B5E] dark:text-[#9A9183]'
                }`}
              >
                <span>{passwordCriteria.hasLength ? '✓' : '•'}</span>
                <span>{isArabic ? '8 أحرف على الأقل' : 'At least 8 characters'}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  passwordCriteria.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#736B5E] dark:text-[#9A9183]'
                }`}
              >
                <span>{passwordCriteria.hasNumber ? '✓' : '•'}</span>
                <span>{isArabic ? 'تحتوي على أرقام (0-9)' : 'Contains numbers (0-9)'}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  passwordCriteria.isMatched ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#736B5E] dark:text-[#9A9183]'
                }`}
              >
                <span>{passwordCriteria.isMatched ? '✓' : '•'}</span>
                <span>{isArabic ? 'كلمتا المرور متطابقتان' : 'Passwords match'}</span>
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              disabled={!isFormValid}
              loading={loading}
              className={STYLES.primaryBtn}
            >
              {isArabic ? 'تحديث كلمة المرور' : 'Update Password'}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C] hover:text-[#7A5818] dark:hover:text-[#D4B26E] transition-colors"
              >
                {isRTL ? <ArrowRightOutlined className="text-xs" /> : <ArrowLeftOutlined className="text-xs" />}
                <span>{isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. SUSPENSE ROOT EXPORT (Next.js App Router Standard)
// ============================================================================
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F4F2] dark:bg-[#0C0B0A]">
          <LoadingOutlined className="text-3xl text-[#7A5818] dark:text-[#D4B26E] animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
