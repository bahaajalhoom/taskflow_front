'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TOTAL_TILES,
  BOARD_SORT_SEQUENCE,
  BAND_SORT_SEQUENCE,
  TILE_ANIMATION_CONFIG,
  generateScatterVector,
  generateShuffledOrder,
  calculateTileDropDelay,
  getTileState,
  type ScatterVector,
  type TileState,
} from '@/lib/tile-sort';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
export const TILE_STYLES = {
  boardGrid: 'grid grid-cols-4 gap-3 w-max select-none',
  bandGrid: 'grid grid-cols-6 gap-2 sm:gap-2.5 w-max select-none',
  tileBase:
    'tile-leaf block transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] select-none',
  boardSize: 'w-12 h-12 sm:w-14 sm:h-14',
  bandSize: 'w-8 h-8 sm:w-10 sm:h-10',

  // Tile appearance states
  idle: 'bg-white/10 dark:bg-white/8 border border-white/10 dark:border-white/5 hover:bg-white/15',
  sorted: 'bg-white/20 dark:bg-white/15 border border-white/25 dark:border-white/10 shadow-xs',
  focus:
    'bg-[#D4B26E] dark:bg-[#D4B26E] text-[#1A1408] scale-110 shadow-lg shadow-[#D4B26E]/40 border border-[#E8CFA0] z-10',
  rest: 'bg-[#D4B26E] dark:bg-[#D4B26E] text-[#1A1408] shadow-md shadow-[#D4B26E]/25 border border-[#E8CFA0]',
} as const;

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface TileSortHeroProps {
  layout?: 'board' | 'band';
  instant?: boolean;
  className?: string;
  onSorted?: () => void;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================================================
// 5. المكون الرئيسي (TileSortHero)
// شبكة البلاطات الهندسية العضوية (Organic Squircle Tiles):
// 1. تسقط البلاطات مبعثرة بزوايا وإزاحات عشوائية ومحايدة تحاكي فوضى المهام المبعثرة
// 2. تدور آلة الترتيب الحلزونية (Snake Sorter) خطوة بخطوة لتنظيم وضبط كل بلاطة بدقة متناهية
// 3. تتحول الشبكة بنعومة فيزيائية كاملة إلى موضعها المستقر
// ============================================================================
export function TileSortHero({
  layout = 'board',
  instant = false,
  className = '',
  onSorted,
}: TileSortHeroProps) {
  const sequence = layout === 'board' ? BOARD_SORT_SEQUENCE : BAND_SORT_SEQUENCE;
  const tileSizePx =
    layout === 'board'
      ? TILE_ANIMATION_CONFIG.boardTileSizePx
      : TILE_ANIMATION_CONFIG.bandTileSizePx;

  // التحقق من وضع تقليل الحركة
  const isInstant = instant || prefersReducedMotion();

  // مصفوفات التبعثر العشوائي المحكوم وترتيب السقوط
  const scatterVectors = useMemo<ScatterVector[]>(() => {
    return Array.from({ length: TOTAL_TILES }, () => generateScatterVector(tileSizePx));
  }, [tileSizePx]);

  const shuffledOrder = useMemo<number[]>(() => {
    return generateShuffledOrder(TOTAL_TILES);
  }, []);

  // خطوة الترتيب الحالية (-1 تعني لم يبدأ بعد، 12 تعني اكتمل الترتيب)
  const [currentStep, setCurrentStep] = useState<number>(isInstant ? sequence.length : -1);

  // مؤقتات خطوات الترتيب المتتالية
  useEffect(() => {
    if (isInstant) return;

    const timers: NodeJS.Timeout[] = [];
    const { initialSortDelayMs, stepDurationMs } = TILE_ANIMATION_CONFIG;

    for (let step = 0; step <= sequence.length; step++) {
      const delay = initialSortDelayMs + step * stepDurationMs;
      timers.push(
        setTimeout(() => {
          setCurrentStep(step);
        }, delay)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isInstant, sequence.length]);

  // إشعار انتهاء الترتيب
  const onSortedRef = useRef(onSorted);
  useEffect(() => {
    onSortedRef.current = onSorted;
  });

  const isComplete = currentStep >= sequence.length;
  useEffect(() => {
    if (isComplete) {
      onSortedRef.current?.();
    }
  }, [isComplete]);

  const gridClass = layout === 'board' ? TILE_STYLES.boardGrid : TILE_STYLES.bandGrid;
  const sizeClass = layout === 'board' ? TILE_STYLES.boardSize : TILE_STYLES.bandSize;

  return (
    <div className={`${gridClass} ${className}`} aria-hidden="true">
      {Array.from({ length: TOTAL_TILES }, (_, index) => {
        const state: TileState = getTileState(index, currentStep, sequence);
        const isSortedOrFocus = state === 'sorted' || state === 'focus' || state === 'rest';
        const vector = scatterVectors[index];

        // في حال كانت البلاطة لم ترتب بعد، نطبق عليها متجه التبعثر (إزاحة + دوران)
        const transformStyle = isSortedOrFocus
          ? 'translate3d(0px, 0px, 0px) rotate(0deg)'
          : `translate3d(${vector.translateX}px, ${vector.translateY}px, 0px) rotate(${vector.rotationDeg}deg)`;

        const dropDelay = isInstant ? 0 : calculateTileDropDelay(index, shuffledOrder);
        const stateStyleClass = TILE_STYLES[state];

        return (
          <span
            key={index}
            className={isInstant ? 'block' : 'block animate-tile-drop'}
            style={{ animationDelay: `${dropDelay}ms` }}
          >
            <span
              className={`${TILE_STYLES.tileBase} ${sizeClass} ${stateStyleClass}`}
              style={{
                transform: transformStyle,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
