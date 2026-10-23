'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React from 'react';
import { TileSortHero } from './TileSortHero';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
export const MOBILE_HERO_STYLES = {
  card:
    'lg:hidden mb-6 flex flex-col sm:flex-row sm:items-center gap-5 overflow-hidden rounded-2xl bg-[#11100E] dark:bg-[#0D0C0A] text-[#F2EDE4] p-5 sm:p-6 border border-[#2A2621] shadow-tactile-card',
  heading: 'font-display text-lg sm:text-xl font-bold tracking-tight text-[#F2EDE4]',
  subhead: 'mt-1 text-xs sm:text-sm text-[#B8AFA0] leading-relaxed',
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface AuthMobileHeroCardProps {
  instant?: boolean;
}

// ============================================================================
// 5. المكون الرئيسي (AuthMobileHeroCard)
// شريط الموبايل التفاعلي الصغير الذي يعرض نسخة مصغرة من محاكاة البلاطات على الشاشات الصغيرة
// ============================================================================
export function AuthMobileHeroCard({ instant = false }: AuthMobileHeroCardProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <section className={MOBILE_HERO_STYLES.card} aria-hidden="true">
      <div className="shrink-0 flex justify-center">
        <TileSortHero layout="band" instant={instant} />
      </div>
      <div className="min-w-0">
        <h2 className={MOBILE_HERO_STYLES.heading}>
          {isArabic ? 'ركّز على ما يُحدث الفارق.' : 'Focus on what moves the needle.'}
        </h2>
        <p className={MOBILE_HERO_STYLES.subhead}>
          {isArabic
            ? 'رتّب مهامك ومشاريعك بسلاسة وسرعة فائقة.'
            : 'A thoughtful workspace for modern product teams.'}
        </p>
      </div>
    </section>
  );
}
