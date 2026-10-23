'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React from 'react';
import Logo from '@/components/ui/Logo';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
export const MOBILE_HERO_STYLES = {
  card:
    'lg:hidden mb-6 flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden rounded-2xl bg-[#11100E] dark:bg-[#0A0908] text-[#F2EDE4] p-5 border border-[#2A2621] shadow-tactile-card select-none',
  heading: 'font-display text-base sm:text-lg font-bold tracking-tight text-[#F2EDE4]',
  subhead: 'mt-1 text-xs text-[#B8AFA0] leading-relaxed',
  badge:
    'inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#D4B26E] uppercase tracking-wider',
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface AuthMobileHeroCardProps {
  mode?: 'login' | 'register';
  instant?: boolean;
}

// ============================================================================
// 5. المكون الرئيسي (AuthMobileHeroCard)
// شريط الهوية التفاعلي على شاشات الموبايل
// ============================================================================
export function AuthMobileHeroCard({ mode = 'login' }: AuthMobileHeroCardProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <section className={MOBILE_HERO_STYLES.card} aria-hidden="true">
      <div className="shrink-0 flex items-center justify-between sm:justify-start gap-3">
        <Logo size="medium" />
        <span className={MOBILE_HERO_STYLES.badge}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4B26E] animate-pulse" />
          {isArabic ? 'تاسك فلو' : 'TaskFlow'}
        </span>
      </div>
      <div className="min-w-0">
        <h2 className={MOBILE_HERO_STYLES.heading}>
          {mode === 'login'
            ? isArabic
              ? 'المساحة التي تتحول فيها الفوضى إلى تدفق منظم.'
              : 'Where operational chaos converges into flow.'
            : isArabic
            ? 'ابدأ بناء مساحة عمل فريقك في ثوانٍ.'
            : 'Spin up your team workspace in seconds.'}
        </h2>
        <p className={MOBILE_HERO_STYLES.subhead}>
          {mode === 'login'
            ? isArabic
              ? 'إدارة متكاملة للمشاريع والمهام بأعلى مستويات التركيز والوضوح.'
              : 'Deterministic engineering clarity, strict RBAC, and zero latency.'
            : isArabic
            ? 'صلاحيات دقيقة، وفيزياء كانبان سلسة لفرق العمل المعاصرة.'
            : 'Granular permissions, tactile Kanban, and complete team sovereignty.'}
        </p>
      </div>
    </section>
  );
}
