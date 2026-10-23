'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Task } from '@/types';
import {
  calculateVelocity,
  calculateTiltAngle,
  dampValue,
  DEFAULT_PHYSICS_CONFIG,
  type Point2D,
} from '@/lib/physics';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
const EMPTY_PIXEL_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface DragOffset {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardPhysicsDragHook {
  draggedTask: Task | null;
  isPhysicsDragging: boolean;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  cardDimensions: { width: number; height: number };
  startPhysicsDrag: (e: React.DragEvent, task: Task, cardElement: HTMLElement) => void;
  endPhysicsDrag: () => void;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================
let cachedEmptyImage: HTMLImageElement | null = null;

function getEmptyDragImage(): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;
  if (!cachedEmptyImage) {
    cachedEmptyImage = new Image();
    cachedEmptyImage.src = EMPTY_PIXEL_DATA_URI;
  }
  return cachedEmptyImage;
}

// ============================================================================
// 5. HOOK IMPLEMENTATION (useCardPhysicsDrag)
// يوفر تجربة سحب وإفلات فيزيائية فائقة النعومة بتردد 60-120 إطار بالثانية
// تتبع اتجاه السحب وحساب زاوية الميلان الديناميكية مباشرة على الـ GPU
// ============================================================================
export function useCardPhysicsDrag(): CardPhysicsDragHook {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isPhysicsDragging, setIsPhysicsDragging] = useState(false);
  const [cardDimensions, setCardDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 160,
  });

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<DragOffset>({ x: 0, y: 0, width: 320, height: 160 });
  const lastPointerRef = useRef<Point2D>({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(0);
  const currentTiltRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // تحديث تموضع وميلان الكرت مباشرة على عنصر DOM لتحقيق أعلى أداء بدون إعادة رندر لكل الفريمات
  const updateOverlayTransform = useCallback((clientX: number, clientY: number) => {
    if (!overlayRef.current) return;

    const offset = dragOffsetRef.current;
    const posX = clientX - offset.x;
    const posY = clientY - offset.y;
    const tilt = currentTiltRef.current;

    overlayRef.current.style.transform = `translate3d(${Math.round(posX)}px, ${Math.round(posY)}px, 0px) rotate(${tilt.toFixed(2)}deg) scale(${DEFAULT_PHYSICS_CONFIG.liftScale})`;
  }, []);

  // مستمع حركة السحب على مستوى النافذة لحساب السرعة والميلان الفيزيائي لحظياً
  useEffect(() => {
    if (!isPhysicsDragging) return;

    const handleWindowDragOver = (e: DragEvent) => {
      // تفادي إحداثيات الإفلات الصفرية الشائعة ببعض المتصفحات
      if (e.clientX === 0 && e.clientY === 0) return;

      const now = performance.now();
      const dt = lastTimeRef.current > 0 ? Math.max(now - lastTimeRef.current, 8) : 16;

      const currentPos = { x: e.clientX, y: e.clientY };
      const vel = calculateVelocity(currentPos, lastPointerRef.current, dt);
      const targetTilt = calculateTiltAngle(vel.vx, vel.vy).rotateDeg;

      // تخميد الزاوية بنعومة لمنع الاهتزاز المفاجئ
      currentTiltRef.current = dampValue(
        currentTiltRef.current,
        targetTilt,
        DEFAULT_PHYSICS_CONFIG.dampingLambda,
        dt
      );

      lastPointerRef.current = currentPos;
      lastTimeRef.current = now;

      // جدولة تحديث الـ Transform في إطار الرسم القادم
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      animFrameRef.current = requestAnimationFrame(() => {
        updateOverlayTransform(e.clientX, e.clientY);
      });
    };

    window.addEventListener('dragover', handleWindowDragOver, { passive: true });

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPhysicsDragging, updateOverlayTransform]);

  // بدء السحب الفيزيائي
  const startPhysicsDrag = useCallback(
    (e: React.DragEvent, task: Task, cardElement: HTMLElement) => {
      const rect = cardElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      dragOffsetRef.current = {
        x: offsetX,
        y: offsetY,
        width: rect.width,
        height: rect.height,
      };

      setCardDimensions({ width: rect.width, height: rect.height });
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      lastTimeRef.current = performance.now();
      currentTiltRef.current = 0;

      // إخفاء صورة الشبح الافتراضية للمتصفح واستبدالها بالكرت الفيزيائي العائم
      const emptyImg = getEmptyDragImage();
      if (emptyImg && e.dataTransfer) {
        try {
          e.dataTransfer.setDragImage(emptyImg, 0, 0);
        } catch {
          // المتصفحات التي لا تدعم الصورة الفارغة تستمر بدون مشاكل
        }
      }

      setDraggedTask(task);
      setIsPhysicsDragging(true);
    },
    []
  );

  // إنهاء السحب الفيزيائي وتصفير الحالات
  const endPhysicsDrag = useCallback(() => {
    setIsPhysicsDragging(false);
    setDraggedTask(null);
    currentTiltRef.current = 0;
    lastTimeRef.current = 0;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  return {
    draggedTask,
    isPhysicsDragging,
    overlayRef,
    cardDimensions,
    startPhysicsDrag,
    endPhysicsDrag,
  };
}
