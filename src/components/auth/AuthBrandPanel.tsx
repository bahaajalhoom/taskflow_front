'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { LogoConvergenceHero } from './LogoConvergenceHero';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/ui/Logo';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
export const BRAND_PANEL_STYLES = {
  panel:
    'relative hidden overflow-hidden bg-[#11100E] dark:bg-[#0A0908] text-[#F2EDE4] border-e border-[#2A2621] lg:flex lg:flex-col lg:justify-between lg:p-12 select-none min-h-dvh transition-colors',
  glowBackdrop:
    'absolute top-0 start-0 w-[640px] h-[640px] bg-[#D4B26E]/7 rounded-full blur-3xl pointer-events-none',
  heroHeading:
    'font-display text-2xl xl:text-3xl font-bold tracking-tight text-[#F2EDE4] leading-snug',
  heroSubhead:
    'mt-3 text-sm xl:text-base text-[#B8AFA0] leading-relaxed max-w-md',
  footerBadge:
    'inline-flex items-center gap-2 text-xs font-mono text-[#8F8575] uppercase tracking-wider',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface AuthBrandPanelProps {
  mode?: 'login' | 'register';
  instant?: boolean;
}

// ============================================================================
// 5. المكون الرئيسي (AuthBrandPanel)
// لوحة الهوية البصرية الفاخرة لتاسك فلو بتجربة التحام الشعار الحركية الفريدة
// ============================================================================
export function AuthBrandPanel({ mode = 'login', instant = false }: AuthBrandPanelProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [isAssembled, setIsAssembled] = useState(false);

  return (
    <aside className={BRAND_PANEL_STYLES.panel} aria-hidden="true">
      {/* Subtle Warm Amber Glow Ambient Atmosphere */}
      <div className={BRAND_PANEL_STYLES.glowBackdrop} />

      {/* Top Header inside Brand Panel: Logo + Brandmark */}
      <div className="relative z-10 flex items-center justify-between">
        <Logo size="large" />
        <span className="font-mono text-[11px] font-semibold text-[#8F8575] bg-[#1C1A17] border border-[#2A2621] px-2.5 py-1 rounded-md">
          {mode === 'login'
            ? isArabic
              ? 'بوابة الفرق الهندسية'
              : 'Engineering Portal'
            : isArabic
            ? 'انضم إلى جيل جديد'
            : 'Join Next-Gen Flow'}
        </span>
      </div>

      {/* Center Zone: Kinetic Logo Convergence Hero */}
      <div className="relative z-10 my-auto flex flex-col justify-center items-center">
        <LogoConvergenceHero
          instant={instant}
          onConvergenceComplete={() => setIsAssembled(true)}
        />

        {/* Dynamic Contextual Headline & Subhead */}
        <div className="mt-6 text-center max-w-md mx-auto transition-opacity duration-700">
          <h2 className={BRAND_PANEL_STYLES.heroHeading}>
            {mode === 'login'
              ? isArabic
                ? 'المساحة التي تتحول فيها الفوضى إلى تدفق منظم.'
                : 'Where operational chaos converges into seamless flow.'
              : isArabic
              ? 'ابدأ بناء مساحة عمل فريقك في ثوانٍ.'
              : 'Spin up your team workspace in seconds.'}
          </h2>
          <p className={BRAND_PANEL_STYLES.heroSubhead}>
            {mode === 'login'
              ? isArabic
                ? 'صُممت TaskFlow لتمنح فرق العمل وضوحاً هندسياً فائقاً، وتحكماً مطلقاً في كل نبضة عمل، من أول فكرة وحتى آخر تسليم.'
                : 'Architected for high-output engineering and product teams who demand absolute clarity, strict role boundaries, and zero latency.'
              : isArabic
              ? 'تمتع بحرية التخطيط، والتحكم بالصلاحيات الدقيقة، وتجربة كانبان بفيزياء حية لا مثيل لها بدون أي تعقيد.'
              : 'Unlock fluid tactile Kanban physics, granular permission matrices, and complete team sovereignty.'}
          </p>
        </div>
      </div>

      {/* Footer System Specs */}
      <div className="relative z-10 pt-6 border-t border-[#2A2621]/80 flex items-center justify-between text-xs text-[#8F8575]">
        <span className={BRAND_PANEL_STYLES.footerBadge}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4B26E] animate-pulse" />
          {isArabic ? 'تاسك فلو • الإصدار الإنتاجي 1.0' : 'TaskFlow • v1.0 Production'}
        </span>
        <span className="font-mono text-[11px] text-[#736B5E]">
          {mode === 'login'
            ? isArabic
              ? 'محرك فوري • SQLite WAL'
              : 'Deterministic • SQLite WAL'
            : isArabic
            ? 'إعداد فوري • بدون بطاقة ائتمان'
            : 'Instant Setup • No Card Required'}
        </span>
      </div>
    </aside>
  );
}
