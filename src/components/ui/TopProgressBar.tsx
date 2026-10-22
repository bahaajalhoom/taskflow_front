'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Route change indicator — fast visual feedback on transitions
  useEffect(() => {
    setLoading(true);
    setProgress(45);
    const timer1 = setTimeout(() => setProgress(85), 60);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 140);
    }, 160);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  // Global API request indicator
  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;

    const handleStart = () => {
      setLoading(true);
      setProgress((prev) => (prev > 0 ? prev : 30));
      if (!progressTimer) {
        progressTimer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 12;
          });
        }, 180);
      }
    };

    const handleEnd = (e: Event) => {
      const active = (e as CustomEvent<{ active: number }>).detail?.active ?? 0;
      if (active === 0) {
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 220);
      }
    };

    window.addEventListener('taskflow-request-start', handleStart);
    window.addEventListener('taskflow-request-end', handleEnd);

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      window.removeEventListener('taskflow-request-start', handleStart);
      window.removeEventListener('taskflow-request-end', handleEnd);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-label="Application loading"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-[#7A5818] dark:bg-[#D4B26E] shadow-[0_0_8px_rgba(212,178,110,0.4)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
