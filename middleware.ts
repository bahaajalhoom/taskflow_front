import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CRAWLER_PATTERNS = [
  'whatsapp',
  'facebook',
  'facebookexternalhit',
  'facebot',
  'meta-externalagent',
  'meta',
  'twitterbot',
  'telegrambot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'applebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'googlebot',
  'crawler',
  'spider',
  'bot',
];

export function middleware(request: NextRequest) {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = CRAWLER_PATTERNS.some((pattern) => userAgent.includes(pattern));

  if (!isCrawler) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  // Never intercept static assets, images, API routes, or Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(jpg|jpeg|png|svg|ico|webp|gif|css|js|txt|xml|json|woff|woff2)$/i)
  ) {
    return NextResponse.next();
  }

  // Determine dynamic canonical URL for the crawler
  const host = request.headers.get('host') || 'taskflow.apps.taqat.academy';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const currentUrl = `${proto}://${host}${pathname}${search}`;
  const siteUrl = 'https://taskflow.apps.taqat.academy';

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TaskFlow | منصة إدارة المشاريع والمهام الذكية</title>
  <meta name="description" content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق." />
  <meta property="og:title" content="TaskFlow | منصة إدارة المشاريع والمهام الذكية" />
  <meta property="og:description" content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${currentUrl}" />
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
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="TaskFlow | منصة إدارة المشاريع والمهام الذكية" />
  <meta name="twitter:description" content="منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق." />
  <meta name="twitter:image" content="${siteUrl}/og-image.jpg" />
</head>
<body>
  <h1>TaskFlow | منصة إدارة المشاريع والمهام الذكية</h1>
  <p>منصة هندسية حديثة لإدارة المشاريع ولوحات كانبان وتتبع سرعة الإنجاز بدون أي تعقيد وبأداء فائق.</p>
</body>
</html>`;

  const bodyBuffer = Buffer.from(html, 'utf8');

  return new NextResponse(bodyBuffer, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-length': String(bodyBuffer.length),
      'cache-control': 'public, max-age=0, must-revalidate',
      'x-crawler-served': 'true',
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
