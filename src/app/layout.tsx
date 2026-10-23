import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AntdProvider from '@/components/providers/AntdProvider';
import AppShell from '@/components/layout/AppShell';
import TopProgressBar from '@/components/ui/TopProgressBar';

const siteUrl = 'https://taskflow.apps.taqat.academy';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TaskFlow | منصة إدارة المشاريع والمهام الذكية',
    template: '%s | TaskFlow',
  },
  description:
    'منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق.',
  applicationName: 'TaskFlow',
  keywords: [
    'TaskFlow',
    'project management',
    'kanban board',
    'sprint management',
    'task tracker',
    'تاسك فلو',
    'إدارة المشاريع',
    'إدارة المهام',
  ],
  authors: [{ name: 'TaskFlow Team' }],
  creator: 'TaskFlow',
  publisher: 'TaskFlow',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    url: `${siteUrl}/`,
    siteName: 'TaskFlow',
    title: 'TaskFlow | منصة إدارة المشاريع والمهام الذكية',
    description:
      'منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        secureUrl: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'TaskFlow | منصة إدارة المشاريع والمهام الذكية',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/og-thumb.jpg`,
        secureUrl: `${siteUrl}/og-thumb.jpg`,
        width: 400,
        height: 400,
        alt: 'TaskFlow Thumbnail',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow | منصة إدارة المشاريع والمهام الذكية',
    description:
      'منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق.',
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link key="font-preconnect-1" rel="preconnect" href="https://fonts.googleapis.com" />
        <link key="font-preconnect-2" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          key="font-preload"
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Instrument+Sans:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
        <link
          key="font-stylesheet"
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Instrument+Sans:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-[#F4F4F2] dark:bg-[#0C0B0A] text-[#1B1915] dark:text-[#EFE9DD] transition-colors selection:bg-[#D4B26E]/30">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <LanguageProvider>
          <ThemeProvider>
            <AntdProvider>
              <AuthProvider>
                <AppShell>
                  {children}
                </AppShell>
              </AuthProvider>
            </AntdProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
