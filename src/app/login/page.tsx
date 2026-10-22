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
} from '@ant-design/icons';
import { Card, Form, Input, Button, Alert, Typography } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/ui/Logo';

const { Title, Text } = Typography;

// ============================================================================
// 2. CONFIGURATION, CONSTANTS & STYLES (EASY EDIT ZONE)
// ============================================================================
const STYLES = {
  container: 'flex items-center justify-center min-h-[82vh] px-4 py-10',
  card: 'tactile-card border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#141211] shadow-tactile-card dark:shadow-tactile-card-dark rounded-xl p-3 sm:p-5',
  pageTitle: '!mb-1.5 !font-bold tracking-tight text-[#1B1915] dark:text-[#EFE9DD] font-display',
  pageSubtitle: 'text-xs text-[#5A5348] dark:!text-[#B5AC9C]',
  inputBase:
    'rounded text-sm bg-white dark:bg-[#1C1A17] border-[#DDDAD3] dark:border-[#2C2824] text-[#1B1915] dark:text-[#EFE9DD]',
  primarySubmitButton:
    'tactile-btn font-bold !text-white dark:!text-[#1A1408] h-11 rounded text-sm !bg-[#7A5818] dark:!bg-[#D4B26E] hover:!bg-[#5e4310] dark:hover:!bg-[#e5c583] !border-[#7A5818] dark:!border-[#D4B26E] shadow-xs',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
interface LoginFormValues {
  email: string;
  password: string;
}

// ============================================================================
// 6. MAIN COMPONENT
// ============================================================================
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [form] = Form.useForm();

  const isArabic = language === 'ar';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Handlers ---
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
    <div className={STYLES.container}>
      <div className="w-full max-w-md">
        <Card variant="outlined" className={STYLES.card}>
          {/* Header & Logo */}
          <div className="text-center mb-6 pt-2">
            <div className="flex justify-center mb-4">
              <Logo size="large" />
            </div>
            <Title level={3} className={STYLES.pageTitle}>
              {t('signIn')}
            </Title>
            <Text className={STYLES.pageSubtitle}>
              {isArabic
                ? 'أدخل بيانات الاعتماد المؤسسية للوصول إلى مساحة العمل الهندسية'
                : 'Enter your credentials to access your engineering workspace'}
            </Text>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <Alert
              title={errorMessage}
              type="error"
              showIcon
              role="alert"
              className="mb-5 text-xs rounded-md"
            />
          )}

          {/* Credentials Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                form.submit();
              }
            }}
            requiredMark="optional"
            className="space-y-1"
          >
            <Form.Item
              name="email"
              label={
                <span className="text-xs font-semibold text-[#1B1915] dark:text-[#EFE9DD]">
                  {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                </span>
              }
              rules={[
                {
                  required: true,
                  message: isArabic
                    ? 'يرجى إدخال عنوان البريد الإلكتروني'
                    : 'Please enter your email address',
                },
                {
                  type: 'email',
                  message: isArabic
                    ? 'يرجى إدخال بريد إلكتروني صالح'
                    : 'Please enter a valid email address',
                },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-[#5A5348] dark:text-[#B5AC9C] me-2" />}
                placeholder="name@company.com"
                size="large"
                autoComplete="email"
                className={STYLES.inputBase}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="text-xs font-semibold text-[#1B1915] dark:text-[#EFE9DD]">
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
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-[#5A5348] dark:text-[#B5AC9C] me-2" />}
                placeholder="••••••••••••"
                size="large"
                autoComplete="current-password"
                className={STYLES.inputBase}
              />
            </Form.Item>

            <Form.Item className="!mb-4 pt-2">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isLoading}
                iconPlacement="end"
                icon={<ArrowRightOutlined className="rtl:-scale-x-100" />}
                className={STYLES.primarySubmitButton}
              >
                {t('signIn')}
              </Button>
            </Form.Item>
          </Form>

          {/* Footer Link */}
          <div className="text-center text-xs text-[#5A5348] dark:text-[#B5AC9C] pt-4 border-t border-[#DDDAD3] dark:border-[#2C2824]">
            {isArabic ? 'ليس لديك حساب بعد؟ ' : "Don't have an account? "}
            <Link
              href="/register"
              className="text-[#7A5818] dark:text-[#D4B26E] font-semibold hover:underline"
            >
              {isArabic ? 'إنشاء حساب جديد' : 'Register here'}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
