'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useRef, useLayoutEffect } from 'react';
import { LogoConvergenceHero } from './LogoConvergenceHero';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/ui/Logo';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const SCALE_CENTER = 1.25;
const GAP_BELOW_LOGO = 28;
const PROMPT_HEIGHT = 36;
const MORPH_DURATION_MS = 700;

export const BRAND_PANEL_STYLES = {
  panel:
    'relative hidden overflow-hidden bg-[#11100E] dark:bg-[#0A0908] text-[#F2EDE4] border-e border-[#2A2621] lg:flex lg:flex-col lg:justify-between lg:p-12 select-none min-h-dvh transition-colors',
  glowBackdrop:
    'absolute top-0 start-0 w-[600px] h-[600px] bg-[#D4B26E]/6 rounded-full blur-3xl pointer-events-none',
  promptText:
    'absolute inset-x-8 text-center font-display text-xl lg:text-2xl font-bold tracking-tight text-[#E8CFA0] transition-opacity duration-500',
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

interface CenterCoordinates {
  x: number;
  y: number;
  promptTop: number;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================================================
// 5. المكون الرئيسي (AuthBrandPanel)
// لوحة العلامة التجارية الرسمية مع رسم شعار تاسك فلو خطاً بخط
// والانتقال الحركي السلس للنظام الأول
// ============================================================================
export function AuthBrandPanel({ mode = 'login', instant = false }: AuthBrandPanelProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const isReduced = instant || prefersReducedMotion();
  const [isAssembled, setIsAssembled] = useState<boolean>(isReduced);
  const [coords, setCoords] = useState<CenterCoordinates | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const logoContainerRef = useRef<HTMLDivElement | null>(null);

  // حساب إحداثيات مركز اللوحة بدقة هندسية لانتقال سلس
  useLayoutEffect(() => {
    if (isReduced || !panelRef.current || !logoContainerRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    const logoRect = logoContainerRef.current.getBoundingClientRect();

    const scaledHeight = logoRect.height * SCALE_CENTER;
    const totalBlockHeight = scaledHeight + GAP_BELOW_LOGO + PROMPT_HEIGHT;

    const centerYOffset = panelRect.height / 2 - totalBlockHeight / 2;
    const logoCenterY = centerYOffset + scaledHeight / 2;

    const deltaX =
      panelRect.left +
      panelRect.width / 2 -
      (logoRect.left + logoRect.width / 2);
    const deltaY =
      panelRect.top + logoCenterY - (logoRect.top + logoRect.height / 2);

    setCoords({
      x: deltaX,
      y: deltaY,
      promptTop: centerYOffset + scaledHeight + GAP_BELOW_LOGO,
    });
  }, [isReduced]);

  const isCentered = !isAssembled && coords !== null;

  return (
    <aside ref={panelRef} className={BRAND_PANEL_STYLES.panel} aria-hidden="true">
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

      {/* Center Zone: Kinetic Logo Drawing & Transforming Momentum */}
      <div className="relative z-10 my-auto flex flex-col justify-center">
        {/* Animated Logo Container */}
        <div
          ref={logoContainerRef}
          className="w-max"
          style={{
            transform: isCentered
              ? `translate3d(${coords.x}px, ${coords.y}px, 0px) scale(${SCALE_CENTER})`
              : 'translate3d(0px, 0px, 0px) scale(1)',
            transition:
              isAssembled && !isReduced
                ? `transform ${MORPH_DURATION_MS}ms cubic-bezier(0.23, 1, 0.32, 1)`
                : undefined,
            visibility: !isReduced && !coords ? 'hidden' : 'visible',
          }}
        >
          <LogoConvergenceHero
            instant={isReduced}
            onComplete={() => setIsAssembled(true)}
          />
        </div>

        {/* Phase 1 Floating Prompt Text (Shown while drawing) */}
        {!isReduced && (
          <p
            className={BRAND_PANEL_STYLES.promptText}
            style={{
              top: coords?.promptTop ?? 0,
              opacity: isAssembled ? 0 : 1,
              pointerEvents: 'none',
            }}
          >
            <span
              className="block animate-intro-text"
              style={{ animationDelay: '250ms' }}
            >
              {mode === 'login'
                ? isArabic
                  ? 'هندسة مسار العمل المنظم.'
                  : 'Architecting streamlined workflow.'
                : isArabic
                ? 'تجهيز مساحة العمل الهندسية.'
                : 'Initializing your workspace.'}
            </span>
          </p>
        )}

        {/* Phase 2 Official Headline & Subheading (Animate in when assembled) */}
        <div
          className={`mt-8 transition-opacity duration-700 ${
            isAssembled ? 'opacity-100 animate-intro-text' : 'opacity-0 pointer-events-none'
          }`}
          style={{ animationDelay: `${MORPH_DURATION_MS / 2}ms` }}
        >
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
