import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Known social media, search engine bots, and automated AI/GEO crawler user agents
const CRAWLER_PATTERNS = [
  'whatsapp',
  'facebookexternalhit',
  'twitterbot',
  'telegrambot',
  'slackbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'applebot',
  'googlebot',
  'bingbot',
  'duckduckbot',
  'yandexbot',
  'baiduspider',
  'ahrefsbot',
  'semrushbot',
  'dotbot',
  'rogerbot',
  'crawler',
  'spider',
  'bot',
  'lighthouse',
  'headlesschrome',
];

export function middleware(request: NextRequest) {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = CRAWLER_PATTERNS.some((pattern) => userAgent.includes(pattern));

  // Common security and performance headers
  const securityHeaders = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(self), microphone=(self), geolocation=()',
    'content-security-policy':
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss: ws:; media-src 'self' blob: data:; frame-src 'self';",
    'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
  };

  if (!isCrawler) {
    const response = NextResponse.next();
    for (const [key, val] of Object.entries(securityHeaders)) {
      response.headers.set(key, val);
    }
    return response;
  }

  const { pathname, search } = request.nextUrl;

  // Never intercept static assets, images, API routes, or Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(jpg|jpeg|png|svg|ico|webp|gif|css|js|txt|xml|json|woff|woff2)$/i)
  ) {
    const response = NextResponse.next();
    for (const [key, val] of Object.entries(securityHeaders)) {
      response.headers.set(key, val);
    }
    return response;
  }

  // Canonical base URLs
  const siteUrl = 'https://taskflow.apps.taqat.academy';
  const canonicalUrl = `${siteUrl}${pathname === '/' ? '' : pathname}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TaskFlow',
      alternateName: 'تاسك فلو',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/icon.svg`,
      description:
        'منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق.',
      sameAs: [
        'https://github.com/bahaajalhoom/taskflow_task',
        'https://github.com/bahaajalhoom/taskflow_api',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'TaskFlow',
      url: `${siteUrl}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'TaskFlow Enterprise',
      operatingSystem: 'All modern browsers, Web, macOS, Windows, Linux, iOS, Android',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ];

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TaskFlow | منصة إدارة المشاريع والمهام الذكية</title>
  <meta name="description" content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق مع متانة SQL العلائقية وحوكمة RBAC صارمة." />
  <link rel="canonical" href="${canonicalUrl}/" />
  
  <!-- Open Graph / Social Sharing -->
  <meta property="og:title" content="TaskFlow | منصة إدارة المشاريع والمهام الذكية" />
  <meta property="og:description" content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}/" />
  <meta property="og:site_name" content="TaskFlow" />
  <meta property="og:locale" content="ar_SA" />
  <meta property="og:image" content="${siteUrl}/og-image.jpg" />
  <meta property="og:image:secure_url" content="${siteUrl}/og-image.jpg" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="TaskFlow | منصة إدارة المشاريع والمهام الذكية" />
  <meta property="og:image" content="${siteUrl}/og-image.png" />
  <meta property="og:image:secure_url" content="${siteUrl}/og-image.png" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image" content="${siteUrl}/og-thumb.jpg" />
  <meta property="og:image:secure_url" content="${siteUrl}/og-thumb.jpg" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="400" />
  <meta property="og:image:height" content="400" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="TaskFlow | منصة إدارة المشاريع والمهام الذكية" />
  <meta name="twitter:description" content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق." />
  <meta name="twitter:image" content="${siteUrl}/og-image.jpg" />

  <!-- Schema.org JSON-LD Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; background: #0C0B0A; color: #EFE9DD; padding: 20px; line-height: 1.6;">
  <header style="border-bottom: 1px solid #2C2824; padding-bottom: 15px; margin-bottom: 25px;">
    <nav style="display: flex; gap: 20px; align-items: center; justify-content: space-between;">
      <a href="${siteUrl}/" style="color: #D4B26E; text-decoration: none; font-weight: bold; font-size: 20px;">TaskFlow Enterprise</a>
      <div>
        <a href="${siteUrl}/about" style="color: #B5AC9C; text-decoration: none; margin-inline-end: 15px;">About Us</a>
        <a href="${siteUrl}/privacy" style="color: #B5AC9C; text-decoration: none; margin-inline-end: 15px;">Privacy Policy</a>
        <a href="${siteUrl}/login" style="color: #B5AC9C; text-decoration: none; margin-inline-end: 15px;">Sign In</a>
        <a href="${siteUrl}/register" style="color: #D4B26E; text-decoration: none; font-weight: bold;">Get Started</a>
      </div>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h1 style="color: #EFE9DD; font-size: 32px; margin-bottom: 10px;">TaskFlow | منصة هندسة وإدارة المشاريع والمهام الذكية</h1>
        <p style="color: #B5AC9C; font-size: 16px; max-width: 800px;">
          منصة هندسية متطورة مصممة لفرق البرمجيات والمشاريع المعقدة. تجمع بين الأداء الفائق لقواعد البيانات العلائقية ومحرك كانبان التفاعلي بفيزياء حركية واقعية، مع حوكمة صارمة للصلاحيات واتصال صوتي ومرئي فوري بتقنية WebRTC.
        </p>
      </header>

      <section style="margin-top: 30px;">
        <h2 style="color: #D4B26E; font-size: 22px;">القدرات الأساسية والمميزات المعمارية (Platform Capabilities & Core Features)</h2>
        <ul style="color: #B5AC9C; padding-inline-start: 20px;">
          <li><strong>متانة SQL المطلقة (Pure Relational SQL Durability):</strong> نظام تخزين محلي قائم على SQLite في وضع Write-Ahead Logging (WAL mode) مع ضمان سلامة المعاملات ACID ومنع فقدان البيانات.</li>
          <li><strong>فيزياء كانبان التفاعلية (Kinetic Physics Kanban):</strong> سحب وإفلات تفاعلي بتردد 60 إطاراً في الثانية مع حسابات الميلان والكتلة وقوة التخمين للبطاقات.</li>
          <li><strong>حوكمة الصلاحيات (Granular RBAC Governance):</strong> تحكم دقيق بالأدوار يشمل المالك والمشرف والعضو وأدواراً مخصصة مع ضوابط حصرية لعمليات الحذف والتعديل.</li>
          <li><strong>غرف اجتماعات WebRTC مدمجة (Native Live Collaboration):</strong> غرف اتصال مباشر مشفرة بتقنية P2P مع إمكانية مشاركة وتسجيل الشاشة ومحادثة الفريق الحية.</li>
          <li><strong>استعادة كلمات المرور المشفرة (Cryptographic Password Reset):</strong> رموز أمان عشوائية بطول 32 بايت مشفرة بـ SHA-256 مع مدة صلاحية ساعة واحدة وإشعارات بريد رسمية.</li>
          <li><strong>دعم كامل ثنائي اللغة (Bilingual English/Arabic):</strong> تباين بصري دقيق مع دعم كامل للاتجاهين LTR و RTL وخطوط طباعية محسوبة بدقة.</li>
        </ul>
      </section>

      <section style="margin-top: 30px; border-top: 1px solid #2C2824; pt-20;">
        <h2 style="color: #D4B26E; font-size: 20px;">الأسئلة الشائعة والمعلومات الموثقة (Frequently Asked Questions)</h2>
        <div style="margin-bottom: 15px;">
          <h3 style="color: #EFE9DD; font-size: 16px;">ما الذي يميز TaskFlow عن أنظمة إدارة المشاريع السحابية التقليدية؟</h3>
          <p style="color: #B5AC9C;">تتميز تاسك فلو بالسرعة الفائقة وانعدام وقت الانتظار واستقلالية الباك إند التامة بدون الاعتماد على خدمات خارجية طرف ثالث، مع تشغيل قاعدة بيانات SQL علائقية مستقلة توفر أعلى درجات الخصوصية والأمان.</p>
        </div>
        <div>
          <h3 style="color: #EFE9DD; font-size: 16px;">هل تدعم المنصة المعايير الأمنية المؤسسية؟</h3>
          <p style="color: #B5AC9C;">نعم، المنصة محصنة بترويسات أمان صارمة (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Rate Limiting)، مع تشفير كلمات المرور بـ bcrypt 12 salt rounds وإخفاء هوية الرموز وتجزئتها.</p>
        </div>
      </section>
    </article>
  </main>

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2C2824; font-size: 12px; color: #7A7265;">
    <div style="display: flex; gap: 20px; margin-bottom: 10px;">
      <a href="${siteUrl}/about" style="color: #B5AC9C; text-decoration: none;">About Us</a>
      <a href="${siteUrl}/privacy" style="color: #B5AC9C; text-decoration: none;">Privacy Policy</a>
      <a href="${siteUrl}/login" style="color: #B5AC9C; text-decoration: none;">Sign In</a>
      <a href="${siteUrl}/register" style="color: #B5AC9C; text-decoration: none;">Register</a>
    </div>
    <p>© ${new Date().getFullYear()} TaskFlow Enterprise. All rights reserved. Canonical domain: https://taskflow.apps.taqat.academy/</p>
  </footer>
</body>
</html>`;

  const bodyBuffer = Buffer.from(html, 'utf8');

  return new NextResponse(bodyBuffer, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-length': String(bodyBuffer.length),
      'x-crawler-served': 'true',
      ...securityHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
