'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function AuditFooter() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <footer className="w-full border-t border-[#DDDAD3] dark:border-[#2C2824] bg-[#EDECE8]/40 dark:bg-[#141211]/60 py-10 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand Info */}
          <div className="flex flex-col items-center sm:items-start gap-1 text-center sm:text-start">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1B1915] dark:text-[#EFE9DD] font-display">
                TaskFlow Enterprise
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#7A5818]/10 text-[#7A5818] dark:text-[#D4B26E]">
                v3.2.0
              </span>
            </div>
            <p className="text-xs text-[#5A5348] dark:text-[#9A9183]">
              {isArabic
                ? 'منصة هندسية حديثة لإدارة المشاريع وسرعة الإنجاز بأعلى المعايير.'
                : 'Mission-critical engineering platform for sprint and task execution.'}
            </p>
          </div>

          {/* Canonical Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#5A5348] dark:text-[#B5AC9C]">
            <Link
              href="/about"
              className="hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors"
            >
              {isArabic ? 'من نحن' : 'About Us'}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors"
            >
              {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link
              href="/login"
              className="hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors"
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <Link
              href="/register"
              className="hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors"
            >
              {isArabic ? 'حساب جديد' : 'Register'}
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[#DDDAD3]/50 dark:border-[#2C2824]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7A7265] dark:text-[#7A7265]">
          <span>
            © {new Date().getFullYear()} TaskFlow Enterprise. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </span>
          <span className="font-mono">
            Powered by Pure SQL WAL Engine &amp; WebRTC
          </span>
        </div>
      </div>
    </footer>
  );
}
