import React from 'react';

// ============================================================================
// 1. CONFIGURATION & SCHEMA CONSTANTS
// ============================================================================
const SITE_URL = 'https://taskflow.apps.taqat.academy';

export const TASKFLOW_ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TaskFlow',
  alternateName: 'تاسك فلو',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon.svg`,
  description:
    'منصة هندسية متطورة لإدارة المشاريع والمهام الذكية بنظام لوحات كانبان وقاعدة بيانات علائقية فائقة الأداء.',
  sameAs: [
    'https://github.com/bahaajalhoom/taskflow_task',
    'https://github.com/bahaajalhoom/taskflow_api',
  ],
};

export const TASKFLOW_WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TaskFlow',
  url: `${SITE_URL}/`,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export const TASKFLOW_SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TaskFlow Enterprise',
  operatingSystem: 'Web, iOS, Android, macOS, Windows, Linux',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Relational SQL Durability (SQLite WAL Mode)',
    'Physics-Driven Kanban Board',
    'Granular Role-Based Access Control (RBAC)',
    'Real-time Team Communication and WebRTC Video Meetings',
    'Bilingual Arabic (RTL) and English (LTR) Interface',
  ],
};

// ============================================================================
// 2. MAIN COMPONENT (JsonLd)
// ============================================================================
export default function JsonLd() {
  const structuredData = [
    TASKFLOW_ORGANIZATION_SCHEMA,
    TASKFLOW_WEBSITE_SCHEMA,
    TASKFLOW_SOFTWARE_SCHEMA,
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
