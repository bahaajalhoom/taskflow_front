'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftOutlined, ArrowRightOutlined, LockOutlined, SafetyCertificateOutlined, EyeInvisibleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '@/context/LanguageContext';
import AuditHeader from '@/components/AuditHeader';
import AuditFooter from '@/components/AuditFooter';

export default function PrivacyPage() {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F2] dark:bg-[#0C0B0A] text-[#1B1915] dark:text-[#EFE9DD] transition-colors">
      <AuditHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#7A5818] dark:text-[#D4B26E] hover:underline"
          >
            {isRTL ? <ArrowRightOutlined className="text-[10px]" /> : <ArrowLeftOutlined className="text-[10px]" />}
            <span>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </Link>
        </div>

        {/* Title */}
        <header className="mb-10 pb-6 border-b border-[#DDDAD3] dark:border-[#2C2824]">
          <span className="inline-block px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E] border border-[#7A5818]/20 mb-3">
            {isArabic ? 'الخصوصية والأمان' : 'Privacy & Security Standards'}
          </span>
          <h1 className="text-3xl font-black text-[#1B1915] dark:text-[#EFE9DD] font-display tracking-tight">
            {isArabic ? 'سياسة الخصوصية وحماية البيانات' : 'Enterprise Privacy Policy & Data Guarantees'}
          </h1>
          <p className="mt-2 text-xs text-[#5A5348] dark:text-[#9A9183] font-mono">
            {isArabic ? 'آخر تحديث: 28 أكتوبر 2026 • متوافق مع معايير الأمان المؤسسية' : 'Last Updated: October 28, 2026 • Enterprise Grade Standards'}
          </p>
        </header>

        {/* Privacy Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-[#5A5348] dark:text-[#B5AC9C] leading-relaxed">
          <section aria-labelledby="data-collection-heading" className="space-y-3">
            <h2 id="data-collection-heading" className="text-lg font-bold text-[#1B1915] dark:text-[#EFE9DD] font-display flex items-center gap-2">
              <SafetyCertificateOutlined className="text-[#7A5818] dark:text-[#D4B26E]" />
              <span>{isArabic ? '1. البيانات التي نجمعها واستخدامها' : '1. Collected Information & Purpose'}</span>
            </h2>
            <p>
              {isArabic
                ? 'تلتزم منصة تاسك فلو بجمع الحد الأدنى الضروري من البيانات لتشغيل مساحات العمل، بما يشمل: الاسم، عنوان البريد الإلكتروني، وبيانات المشاريع والمهام التي تقوم بإدخالها طواعية. لا نقوم ببيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تسويقية أو إعلانية نهائياً.'
                : 'TaskFlow strictly adheres to the principle of data minimization. We only collect the necessary parameters required to operate your engineering workspace, including your name, email address, and task artifacts created during project execution. We never sell or monetize your data.'}
            </p>
          </section>

          <section aria-labelledby="security-heading" className="space-y-3">
            <h2 id="security-heading" className="text-lg font-bold text-[#1B1915] dark:text-[#EFE9DD] font-display flex items-center gap-2">
              <LockOutlined className="text-[#7A5818] dark:text-[#D4B26E]" />
              <span>{isArabic ? '2. التشفير والحماية الهندسية' : '2. Cryptographic Security & Password Hashing'}</span>
            </h2>
            <p>
              {isArabic
                ? 'تُحفظ كلمات المرور مشفرة بخوارزمية bcrypt بعدد 12 جولة ملحية (Salt Rounds). رموز إعادة تعيين كلمة المرور تتولد برقم عشوائي مشفر بطول 32 بايت وتُخزن بتجزئة SHA-256 لمرة واحدة وتنقضي صلاحيتها بعد 60 دقيقة. جميع الاتصالات بالخادم مشفرة عبر HTTPS بروتوكول TLS 1.3.'
                : 'Passwords are encrypted using industry-standard bcrypt with 12 salt rounds. Password reset tokens are generated with 32-byte cryptographic entropy, stored hashed via SHA-256, strictly single-use, and expire after 60 minutes. All transport is guarded by TLS 1.3 encryption.'}
            </p>
          </section>

          <section aria-labelledby="webrtc-heading" className="space-y-3">
            <h2 id="webrtc-heading" className="text-lg font-bold text-[#1B1915] dark:text-[#EFE9DD] font-display flex items-center gap-2">
              <EyeInvisibleOutlined className="text-[#7A5818] dark:text-[#D4B26E]" />
              <span>{isArabic ? '3. خصوصية الاجتماعات والاتصال المرئي (WebRTC)' : '3. Real-Time Meeting Confidentiality (WebRTC)'}</span>
            </h2>
            <p>
              {isArabic
                ? 'الاتصال الصوتي والمرئي يتم مباشرة بين أجهزة المشاركين (Peer-to-Peer) عبر بروتوكول WebRTC المشفر دون تسجيل المحادثات على خوادمنا ما لم يقم المستخدم نفسه ببدء تسجيل محلي يُحفظ مباشرة في جهازه الشخصي.'
                : 'Video and audio transmission utilizes peer-to-peer WebRTC protocols with DTLS-SRTP end-to-end encryption. No audio or video streams are stored on our servers; local recordings are processed exclusively on the client machine.'}
            </p>
          </section>

          <section aria-labelledby="rights-heading" className="space-y-3">
            <h2 id="rights-heading" className="text-lg font-bold text-[#1B1915] dark:text-[#EFE9DD] font-display flex items-center gap-2">
              <CheckCircleOutlined className="text-[#7A5818] dark:text-[#D4B26E]" />
              <span>{isArabic ? '4. حقوق المستخدم والتحكم في البيانات' : '4. User Rights & Data Deletion'}</span>
            </h2>
            <p>
              {isArabic
                ? 'يحق لك في أي وقت تعديل بياناتك الشخصية، أو تصدير بيانات مشاريعك، أو طلب حذف حسابك نهائياً من قاعدة البيانات عبر شاشة الإعدادات.'
                : 'You retain full ownership of your data. You may update your profile, export workspace records, or permanently delete your account directly through the Settings panel at any time.'}
            </p>
          </section>
        </div>
      </main>

      <AuditFooter />
    </div>
  );
}
