// Public document routes only. Never prefix assets, APIs, external sites or CRM.
export const publicPagePaths = [
  '/', '/about', '/employers', '/visa-services', '/employer-sponsorship',
  '/sponsored-visas', '/labour-agreements', '/approach', '/case-studies',
  '/team', '/contact', '/privacy', '/terms', '/points-calculator',
];
const knownPaths = new Set(publicPagePaths);

export function localizedPath(pathname, language = 'en') {
  const path = pathname.replace(/\/$/, '') || '/';
  const base = path === '/zh' ? '/' : path.startsWith('/zh/') ? path.slice(3) : path;
  if (!knownPaths.has(base)) return pathname;
  return language === 'zh' ? '/zh' + (base === '/' ? '' : base) : base;
}

export function localizedHref(href, language = 'en') {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const url = new URL(href, 'https://public-route.invalid');
  return localizedPath(url.pathname, language) + url.search + url.hash;
}

export function publicRouteLanguage(pathname) {
  return pathname === '/zh' || pathname.startsWith('/zh/') ? 'zh' : 'en';
}

export function isPublicPagePath(pathname) {
  return knownPaths.has(localizedPath(pathname, 'en'));
}
