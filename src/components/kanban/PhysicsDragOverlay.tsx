'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Task, TaskPriority } from '@/types';
import { PrioritySignalBadge } from '@/components/ui/PrioritySignalBadge';
import { getDragElevationShadow } from '@/lib/physics';
import { parseTaskTag } from '@/lib/utils';
import {
  CalendarOutlined,
  BugOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';
import { useLanguage } from '@/context/LanguageContext';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
export const OVERLAY_STYLES = {
  container:
    'fixed top-0 left-0 pointer-events-none select-none z-[99999] overflow-hidden rounded-xl border border-[#7A5818]/70 dark:border-[#D4B26E]/70 bg-white dark:bg-[#141210] p-4 space-y-3',
  shortIdBadge:
    'font-mono text-xs font-semibold text-[#4F493F] dark:text-[#B8AFA0] bg-[#EBEAE5] dark:bg-[#1C1A17] px-2.5 py-1 rounded-md border border-[#DAD7CF] dark:border-[#2A2621]',
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface PhysicsDragOverlayProps {
  task: Task | null;
  isVisible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dimensions: { width: number; height: number };
}

// ============================================================================
// 4. HELPER FUNCTIONS & SUB-COMPONENTS
// ============================================================================
function getShortTaskId(id: string): string {
  return `TF-${id.slice(0, 4).toUpperCase()}`;
}

// ============================================================================
// 5. المكون الرئيسي (PhysicsDragOverlay)
// مجسم الكرت الفيزيائي العائم الذي يتحرك مع المؤشر ويميل ديناميكياً حسب الاتجاه والسرعة
// ============================================================================
export function PhysicsDragOverlay({
  task,
  isVisible,
  containerRef,
  dimensions,
}: PhysicsDragOverlayProps) {
  const { t, formatTaskPriority, formatDateLocalized } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isVisible || !task) {
    return null;
  }

  const { tag, cleanTitle } = parseTaskTag(task.title);
  const shortId = getShortTaskId(task.id);

  const overlayElement = (
    <div
      ref={containerRef}
      style={{
        width: `${Math.round(dimensions.width)}px`,
        boxShadow: getDragElevationShadow(),
        transform: 'translate3d(-9999px, -9999px, 0px)',
        transformOrigin: 'center center',
      }}
      className={OVERLAY_STYLES.container}
      aria-hidden="true"
    >
      {/* Golden physics active indicator ring */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#D4B26E] to-transparent opacity-90" />

      {/* Top Metadata Bar: Priority + Task Key */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={OVERLAY_STYLES.shortIdBadge}>{shortId}</span>

          <span className="inline-flex">
            <PrioritySignalBadge
              priority={task.priority}
              label={formatTaskPriority(task.priority)}
              size="md"
            />
          </span>

          {tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#EDECE8] dark:bg-[#1C1A17] text-[#5A5348] dark:text-[#B5AC9C] border border-[#DDDAD3] dark:border-[#2C2824]">
              {tag.type === 'bug' && <BugOutlined className="text-xs text-[#9C2E1F]" />}
              {tag.type === 'feature' && <RocketOutlined className="text-xs text-[#1E4D8A]" />}
              {tag.type === 'improvement' && <ThunderboltOutlined className="text-xs text-[#235832]" />}
              <span>{tag.label}</span>
            </span>
          )}
        </div>

        {/* Dynamic Momentum Indicator Badge */}
        <span className="text-[11px] font-mono tracking-wider font-bold text-[#7A5818] dark:text-[#D4B26E] uppercase bg-[#D4B26E]/15 px-2 py-0.5 rounded">
          {t('statusInProgress')}
        </span>
      </div>

      {/* Task Title */}
      <div
        dir="auto"
        className="font-bold text-base sm:text-lg leading-snug text-[#1B1915] dark:text-[#EFE9DD] line-clamp-2"
      >
        {cleanTitle}
      </div>

      {/* Footer Info: Assignee & Due Date */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#DDDAD3] dark:border-[#2C2824] text-xs">
        <div className="flex items-center gap-2 text-[#5A5348] dark:text-[#B5AC9C]">
          {task.assigneeName ? (
            <div className="flex items-center gap-2">
              <Avatar
                size={24}
                style={{ backgroundColor: '#D4B26E', color: '#1A1408' }}
                className="font-bold text-xs"
              >
                {task.assigneeName.charAt(0).toUpperCase()}
              </Avatar>
              <span className="text-xs font-semibold text-[#1B1915] dark:text-[#EFE9DD] truncate max-w-[130px]">
                {task.assigneeName}
              </span>
            </div>
          ) : (
            <span className="text-[#736B5E] dark:text-[#9A9183] italic text-xs">
              {t('unassigned')}
            </span>
          )}
        </div>

        {task.dueDate && (
          <span className="text-xs font-mono tnum flex items-center gap-1.5 text-[#736B5E] dark:text-[#9A9183]">
            <CalendarOutlined />
            {formatDateLocalized(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );

  return createPortal(overlayElement, document.body);
}
