import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AntdProvider from '@/components/providers/AntdProvider';
import AppShell from '@/components/layout/AppShell';
import TopProgressBar from '@/components/ui/TopProgressBar';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taskflow.apps.taqat.academy';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TaskFlow | Precision Project & Task Management',
    template: '%s | TaskFlow',
  },
  description:
    'Modern enterprise project and task management platform. Precision Kanban workflows, real-time collaboration, and sprint velocity analytics.',
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
    url: 'https://taskflow.apps.taqat.academy/',
    siteName: 'TaskFlow',
    title: 'TaskFlow | منصة إدارة المشاريع والمهام الذكية',
    description:
      'منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق.',
    images: [
      {
        url: 'https://taskflow.apps.taqat.academy/og-image.png',
        secureUrl: 'https://taskflow.apps.taqat.academy/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaskFlow - Precision Project & Task Management',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow | Precision Project & Task Management',
    description:
      'Modern enterprise project and task management platform with Kanban workflows and sprint velocity analytics.',
    images: ['https://taskflow.apps.taqat.academy/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        {/* Favicons & Direct Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* WhatsApp & Social Media OpenGraph Meta Tags (Direct & Absolute URLs) */}
        <meta property="og:title" content="TaskFlow | منصة إدارة المشاريع والمهام الذكية" />
        <meta
          property="og:description"
          content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق."
        />
        <meta property="og:url" content="https://taskflow.apps.taqat.academy/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TaskFlow" />
        <meta property="og:image" content="https://taskflow.apps.taqat.academy/og-image.png" />
        <meta property="og:image:secure_url" content="https://taskflow.apps.taqat.academy/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="TaskFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://taskflow.apps.taqat.academy/og-image.png" />
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
