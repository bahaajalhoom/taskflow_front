'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function AuditHeader() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <header className="w-full border-b border-[#DDDAD3] dark:border-[#2C2824] bg-white/80 dark:bg-[#141211]/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#7A5818] dark:bg-[#D4B26E] text-white dark:text-[#1A1408] flex items-center justify-center font-black text-sm shadow-xs font-mono">
            TF
          </div>
          <span className="font-bold text-base text-[#1B1915] dark:text-[#EFE9DD] font-display tracking-tight group-hover:text-[#7A5818] dark:group-hover:text-[#D4B26E] transition-colors">
            TaskFlow
          </span>
        </Link>

        {/* Semantic Nav Links */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
          <Link
            href="/about"
            className="text-[#5A5348] dark:text-[#B5AC9C] hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors"
          >
            {isArabic ? 'من نحن' : 'About Us'}
          </Link>
          <Link
            href="/privacy"
            className="text-[#5A5348] dark:text-[#B5AC9C] hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors hidden sm:inline-block"
          >
            {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </Link>
          <Link
            href="/login"
            className="text-[#5A5348] dark:text-[#B5AC9C] hover:text-[#1B1915] dark:hover:text-[#EFE9DD] transition-colors"
          >
            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
          <Link
            href="/register"
            className="px-3 py-1.5 rounded-md bg-[#7A5818] dark:bg-[#D4B26E] text-white dark:text-[#1A1408] font-semibold text-xs hover:bg-[#5e4310] dark:hover:bg-[#e5c583] transition-colors"
          >
            {isArabic ? 'ابدأ الآن' : 'Get Started'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
