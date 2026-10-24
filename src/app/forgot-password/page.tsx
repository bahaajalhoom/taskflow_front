'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState } from 'react';
import Link from 'next/link';
import { MailOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckCircleFilled, SafetyOutlined } from '@ant-design/icons';
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
// 3. MAIN COMPONENT (ForgotPasswordPage)
// ============================================================================
export default function ForgotPasswordPage() {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      message.error(isArabic ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await DataService.requestPasswordReset(cleanEmail);
      setSubmitted(true);
      if (res.previewUrl) {
        setPreviewUrl(res.previewUrl);
      }
      message.success(
        isArabic
          ? 'تم إرسال تعليمات إعادة التعيين إلى بريدك الإلكتروني.'
          : 'Password reset instructions have been dispatched.'
      );
    } catch (err: any) {
      message.error(err?.message || 'Failed to request password reset');
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
            {isArabic ? 'استعادة كلمة المرور' : 'Reset Your Password'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#B5AC9C] leading-relaxed">
            {isArabic
              ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور.'
              : 'Enter your registered email address and we will send you a secure one-time reset link.'}
          </p>
        </div>

        {submitted ? (
          /* Success State */
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 text-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircleFilled />
            </div>

            <div className="space-y-2">
              <div className="font-bold text-sm sm:text-base text-[#1B1915] dark:text-[#EFE9DD]">
                {isArabic ? 'تم إرسال رابط التعيين بنجاح' : 'Reset Link Sent Successfully'}
              </div>
              <p className="text-xs text-[#5A5348] dark:text-[#B5AC9C] leading-relaxed">
                {isArabic ? (
                  <>
                    أرسلنا رسالة أمنية رسمية إلى <strong className="text-[#1B1915] dark:text-[#EFE9DD]">{email}</strong>. 
                    يرجى فحص صندوق الوارد (أو مجلد الرسائل غير المرغوبة/Spam) والضغط على الرابط خلال <strong>60 دقيقة</strong>.
                  </>
                ) : (
                  <>
                    We have dispatched an email to <strong className="text-[#1B1915] dark:text-[#EFE9DD]">{email}</strong>. 
                    Please check your inbox (including Spam folder) and click the link within <strong>60 minutes</strong>.
                  </>
                )}
              </p>
            </div>

            {/* In local/dev testing, surface the test link button */}
            {previewUrl && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                <div className="font-bold mb-1">Development Mailer Preview:</div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-mono text-[11px] break-all"
                >
                  View Sent Email in Ethereal
                </a>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                size="middle"
                onClick={() => setSubmitted(false)}
                className="text-xs font-semibold"
              >
                {isArabic ? 'إعادة الإرسال أو تغيير البريد' : 'Resend or Try Another Email'}
              </Button>

              <Link href="/login" className="block mt-2">
                <Button type="text" className="text-xs text-[#7A5818] dark:text-[#D4B26E] font-semibold w-full">
                  {isRTL ? <ArrowRightOutlined className="me-1" /> : <ArrowLeftOutlined className="me-1" />}
                  {isArabic ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#5A5348] dark:text-[#B5AC9C]">
                {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <Input
                type="email"
                required
                autoFocus
                placeholder="name@company.com"
                prefix={<MailOutlined className="text-[#5A5348] dark:text-[#9A9183] me-1" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={STYLES.input}
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className={STYLES.primaryBtn}
            >
              {isArabic ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}
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
