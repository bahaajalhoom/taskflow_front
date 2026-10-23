'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { TileSortHero } from './TileSortHero';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/ui/Logo';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const SCALE_CENTER = 1.15;
const GAP_BELOW_GRID = 32;
const PROMPT_HEIGHT = 40;
const MORPH_DURATION_MS = 700;

export const BRAND_PANEL_STYLES = {
  panel:
    'relative hidden overflow-hidden bg-[#11100E] dark:bg-[#0D0C0A] text-[#F2EDE4] border-e border-[#2A2621] lg:flex lg:flex-col lg:justify-between lg:p-12 select-none min-h-dvh',
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
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface AuthBrandPanelProps {
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
// اللوحة الجانبية الفاخرة للعلامة التجارية مع مشهد السقوط والترتيب الفيزيائي التفاعلي
// ============================================================================
export function AuthBrandPanel({ instant = false }: AuthBrandPanelProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  const isReduced = instant || prefersReducedMotion();
  const [isSorted, setIsSorted] = useState<boolean>(isReduced);
  const [coords, setCoords] = useState<CenterCoordinates | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // حساب إحداثيات مركز اللوحة بدقة هندسية
  useLayoutEffect(() => {
    if (isReduced || !panelRef.current || !gridContainerRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    const gridRect = gridContainerRef.current.getBoundingClientRect();

    const scaledHeight = gridRect.height * SCALE_CENTER;
    const totalBlockHeight = scaledHeight + GAP_BELOW_GRID + PROMPT_HEIGHT;

    const centerYOffset = panelRect.height / 2 - totalBlockHeight / 2;
    const gridCenterY = centerYOffset + scaledHeight / 2;

    const deltaX =
      panelRect.left +
      panelRect.width / 2 -
      (gridRect.left + gridRect.width / 2);
    const deltaY =
      panelRect.top + gridCenterY - (gridRect.top + gridRect.height / 2);

    setCoords({
      x: deltaX,
      y: deltaY,
      promptTop: centerYOffset + scaledHeight + GAP_BELOW_GRID,
    });
  }, [isReduced]);

  const isCentered = !isSorted && coords !== null;

  return (
    <aside ref={panelRef} className={BRAND_PANEL_STYLES.panel} aria-hidden="true">
      {/* Subtle Warm Amber Glow Ambient Atmosphere */}
      <div className={BRAND_PANEL_STYLES.glowBackdrop} />

      {/* Top Header inside Brand Panel: Logo + Brandmark */}
      <div className="relative z-10 flex items-center justify-between">
        <Logo size="large" />
        <span className="font-mono text-[11px] font-semibold text-[#8F8575] bg-[#1C1A17] border border-[#2A2621] px-2.5 py-1 rounded-md">
          {isArabic ? 'هندسة المنتجات' : 'Product Studio'}
        </span>
      </div>

      {/* Center Zone: Tile Sort Grid & Transforming Momentum */}
      <div className="relative z-10 my-auto flex flex-col justify-center">
        {/* Animated Grid Container */}
        <div
          ref={gridContainerRef}
          className="w-max"
          style={{
            transform: isCentered
              ? `translate3d(${coords.x}px, ${coords.y}px, 0px) scale(${SCALE_CENTER})`
              : 'translate3d(0px, 0px, 0px) scale(1)',
            transition:
              isSorted && !isReduced
                ? `transform ${MORPH_DURATION_MS}ms cubic-bezier(0.23, 1, 0.32, 1)`
                : undefined,
            visibility: !isReduced && !coords ? 'hidden' : 'visible',
          }}
        >
          <TileSortHero
            layout="board"
            instant={isReduced}
            onSorted={() => setIsSorted(true)}
          />
        </div>

        {/* Phase 1-2 Floating Prompt Text (Shown while scattered/sorting) */}
        {!isReduced && (
          <p
            className={BRAND_PANEL_STYLES.promptText}
            style={{
              top: coords?.promptTop ?? 0,
              opacity: isSorted ? 0 : 1,
              pointerEvents: 'none',
            }}
          >
            <span
              className="block animate-intro-text"
              style={{ animationDelay: '400ms' }}
            >
              {isArabic ? 'رتّب مهامك المبعثرة.' : 'Sort out your scattered tasks.'}
            </span>
          </p>
        )}

        {/* Phase 3 Final Headline & Subheading (Animate in when sorted) */}
        <div
          className={`mt-10 transition-opacity duration-700 ${
            isSorted ? 'opacity-100 animate-intro-text' : 'opacity-0 pointer-events-none'
          }`}
          style={{ animationDelay: `${MORPH_DURATION_MS / 2}ms` }}
        >
          <h2 className={BRAND_PANEL_STYLES.heroHeading}>
            {isArabic
              ? 'ركّز على ما يُحدث الفارق.'
              : 'Focus on what moves the needle.'}
          </h2>
          <p className={BRAND_PANEL_STYLES.heroSubhead}>
            {isArabic
              ? 'مساحة عمل متقنة هندسياً لفرق المنتجات المعاصرة لإدارة المشاريع وسير العمل بأعلى تركيز.'
              : 'A thoughtful, high-craft workspace for modern engineering and product teams.'}
          </p>
        </div>
      </div>

      {/* Footer System Specs */}
      <div className="relative z-10 pt-6 border-t border-[#2A2621]/80 flex items-center justify-between text-xs text-[#8F8575]">
        <span className={BRAND_PANEL_STYLES.footerBadge}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4B26E] animate-pulse" />
          {isArabic ? 'تاسك فلو • الإصدار 1.0' : 'TaskFlow • v1.0 Production'}
        </span>
        <span className="font-mono text-[11px] text-[#736B5E]">
          {isArabic ? 'نظام SQLite WAL فائق السرعة' : 'Ultra-low Latency WAL'}
        </span>
      </div>
    </aside>
  );
}
