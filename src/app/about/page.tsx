'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftOutlined, ArrowRightOutlined, SafetyCertificateOutlined, DatabaseOutlined, ThunderboltOutlined, TeamOutlined } from '@ant-design/icons';
import { useLanguage } from '@/context/LanguageContext';
import AuditHeader from '@/components/AuditHeader';
import AuditFooter from '@/components/AuditFooter';

export default function AboutPage() {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F2] dark:bg-[#0C0B0A] text-[#1B1915] dark:text-[#EFE9DD] transition-colors">
      <AuditHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
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

        {/* Hero Section */}
        <header className="mb-12">
          <span className="inline-block px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E] border border-[#7A5818]/20 mb-3">
            {isArabic ? 'رؤيتنا الهندسية' : 'Engineering Vision'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1B1915] dark:text-[#EFE9DD] font-display tracking-tight leading-tight">
            {isArabic
              ? 'بناء منصة إدارة المهام التي يستحقها المهندسون'
              : 'Building the Mission-Critical Task Engine Engineers Deserve'}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#5A5348] dark:text-[#B5AC9C] leading-relaxed max-w-3xl">
            {isArabic
              ? 'تأسست تاسك فلو للتخلص من بطء وتشتت برمجيات إدارة المشاريع التقليدية. نجمع بين الأداء الفائق لقواعد البيانات العلائقية المحلية، والفيزياء التفاعلية للكانبان، وحوكمة الصلاحيات الصارمة.'
              : 'TaskFlow was engineered to eradicate the bloat, latency, and distractions of generic SaaS trackers. We fuse pure relational SQL durability, tactile kinetic physics, and strict enterprise RBAC governance.'}
          </p>
        </header>

        {/* Pillars Grid */}
        <section aria-labelledby="core-pillars-title" className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
          <h2 id="core-pillars-title" className="sr-only">
            {isArabic ? 'الركائز الأساسية' : 'Core Architectural Pillars'}
          </h2>

          <article className="p-6 rounded-xl border border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#141211]">
            <div className="w-10 h-10 rounded-lg bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E] flex items-center justify-center text-lg mb-4">
              <DatabaseOutlined />
            </div>
            <h3 className="text-base font-bold text-[#1B1915] dark:text-[#EFE9DD] mb-2 font-display">
              {isArabic ? 'متانة SQL العلائقية' : 'Relational SQL Durability'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#9A9183] leading-relaxed">
              {isArabic
                ? 'استغناء كامل عن الحلول السحابية غير المهيكلة لصالح محرك SQLite في وضع WAL mode الذي يضمن الحفظ الفوري والاتساق التام للمعاملات.'
                : 'Zero unstructured NoSQL lock-in. Powered by a deterministic embedded SQLite engine in Write-Ahead Logging mode for instant ACID guarantees.'}
            </p>
          </article>

          <article className="p-6 rounded-xl border border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#141211]">
            <div className="w-10 h-10 rounded-lg bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E] flex items-center justify-center text-lg mb-4">
              <ThunderboltOutlined />
            </div>
            <h3 className="text-base font-bold text-[#1B1915] dark:text-[#EFE9DD] mb-2 font-display">
              {isArabic ? 'فيزياء تفاعلية فورية' : 'Zero-Latency Kinetic Physics'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#9A9183] leading-relaxed">
              {isArabic
                ? 'لوحات كانبان تستجيب بسرعة 60 إطاراً في الثانية مع حسابات ميلان البطاقات وكتلتها لتجربة حسية حقيقية أثناء سحب وإفلات المهام.'
                : 'Silky 60fps Kanban board with velocity tracking, directional tilt, and damped spring mechanics for tactile spatial feedback.'}
            </p>
          </article>

          <article className="p-6 rounded-xl border border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#141211]">
            <div className="w-10 h-10 rounded-lg bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E] flex items-center justify-center text-lg mb-4">
              <SafetyCertificateOutlined />
            </div>
            <h3 className="text-base font-bold text-[#1B1915] dark:text-[#EFE9DD] mb-2 font-display">
              {isArabic ? 'حوكمة صارمة للصلاحيات' : 'Strict RBAC Governance'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#9A9183] leading-relaxed">
              {isArabic
                ? 'مصفوفة صلاحيات دقيقة تعتمد على أدوار المالك، المشرف، العضو، والأدوار المخصصة لضبط عمليات الإنشاء والتعديل والحذف بدقة.'
                : 'Fine-grained Role-Based Access Control matrix covering granular flags for task creation, editing, deletion, and member governance.'}
            </p>
          </article>

          <article className="p-6 rounded-xl border border-[#DDDAD3] dark:border-[#2C2824] bg-white dark:bg-[#141211]">
            <div className="w-10 h-10 rounded-lg bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E] flex items-center justify-center text-lg mb-4">
              <TeamOutlined />
            </div>
            <h3 className="text-base font-bold text-[#1B1915] dark:text-[#EFE9DD] mb-2 font-display">
              {isArabic ? 'تعاون حي مدمج' : 'Native Real-Time Collaboration'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#9A9183] leading-relaxed">
              {isArabic
                ? 'غرف اجتماعات WebRTC مدمجة مع تسجيل الشاشة وقنوات محادثة نصية فورية بدون الحاجة لمغادرة مساحة العمل.'
                : 'Direct WebRTC video conference rooms, studio recording compositor, and persistent real-time team communication channels.'}
            </p>
          </article>
        </section>

        {/* CTA */}
        <div className="p-8 rounded-xl border border-[#7A5818]/30 dark:border-[#D4B26E]/30 bg-[#7A5818]/5 dark:bg-[#D4B26E]/5 text-center">
          <h3 className="text-xl font-bold text-[#1B1915] dark:text-[#EFE9DD] font-display mb-2">
            {isArabic ? 'جاهز لترقية إنتاجية فريقك؟' : 'Ready to Elevate Your Engineering Sprint?'}
          </h3>
          <p className="text-xs sm:text-sm text-[#5A5348] dark:text-[#B5AC9C] max-w-xl mx-auto mb-6">
            {isArabic
              ? 'انضم إلى فرق العمل التي تعتمد على تاسك فلو لإنجاز مشاريعها بدقة هندسية موثوقة.'
              : 'Join forward-thinking engineering teams delivering projects with architectural precision.'}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#7A5818] dark:bg-[#D4B26E] text-white dark:text-[#1A1408] font-bold text-sm shadow-xs hover:bg-[#5e4310] dark:hover:bg-[#e5c583] transition-colors"
          >
            <span>{isArabic ? 'إنشاء مساحة عمل مجانية' : 'Create Free Workspace'}</span>
            {isRTL ? <ArrowLeftOutlined className="text-xs" /> : <ArrowRightOutlined className="text-xs" />}
          </Link>
        </div>
      </main>

      <AuditFooter />
    </div>
  );
}
