// Keep Enhanced Measurement OFF in this GA4 stream: no automatic form,
// outbound-link or history tracking. Only consented, sanitised page views.
export const measurementId = 'G-DNQXKBP0ZC';
export const containerId = 'GTM-WZ9XZFHL';
const preferenceKey = 'aqyr-analytics-consent-v1';
const lifetime = 180 * 24 * 60 * 60 * 1000;
const routes = new Set(['/', '/about', '/employers', '/visa-services', '/employer-sponsorship',
  '/sponsored-visas', '/labour-agreements', '/approach', '/case-studies', '/team',
  '/contact', '/privacy', '/terms', '/points-calculator']);

export function safePageLocation(location) {
  const path = location.pathname.replace(/\/$/, '') || '/';
  return location.origin + (routes.has(path) ? path : '/');
}
export function safeReferrer(referrer) {
  try { const url = new URL(referrer); return /^https?:$/.test(url.protocol) ? url.origin + '/' : ''; }
  catch { return ''; }
}
export function readPreference(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(preferenceKey));
    if (['accepted', 'rejected'].includes(value?.choice) && Number.isFinite(value.at) &&
        value.at <= now && now - value.at < lifetime) return value.choice;
  } catch { /* Blocked storage must not break the site. */ }
  return null;
}

export function initAnalytics(win = window, doc = document) {
  if (doc.getElementById('analytics-choice')) return;
  const production = ['www.hiremiiglobal.com', 'hiremiiglobal.com'].includes(win.location.hostname)
    && win.location.protocol === 'https:';
  let choice;
  try { choice = readPreference(win.localStorage); } catch { choice = null; }
  let started = false;
  win['ga-disable-' + measurementId] = choice !== 'accepted';

  function start() {
    if (!production || started || choice !== 'accepted') return;
    started = true;
    win['ga-disable-' + measurementId] = false;
    win.dataLayer = win.dataLayer || [];
    win.gtag = function () { win.dataLayer.push(arguments); };
    win.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    });
    win.gtag('consent', 'update', { analytics_storage: 'granted' });
    // Set privacy-safe defaults before GTM starts any native Google tag.
    // The GA4 Google tag itself is configured once in the GTM container,
    // on Initialization - All Pages. Do not add another config/event here.
    win.gtag('set', {
      send_page_view: true, allow_google_signals: false,
      allow_ad_personalization_signals: false, cookie_expires: lifetime / 1000,
      page_location: safePageLocation(win.location), page_referrer: safeReferrer(doc.referrer),
      page_title: doc.title,
    });
    win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = doc.createElement('script');
    script.id = 'aqyr-tag-manager';
    script.async = true;
    script.referrerPolicy = 'strict-origin';
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + containerId;
    doc.head.append(script);
  }

  const panel = doc.createElement('section');
  panel.id = 'analytics-choice';
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-labelledby', 'analytics-choice-title');
  panel.innerHTML = '<div><h2 id="analytics-choice-title"></h2><p></p>' +
    '<a class="analytics-policy"></a></div><div class="analytics-actions">' +
    '<button type="button" data-analytics="rejected"></button>' +
    '<button type="button" data-analytics="accepted"></button></div>';
  doc.body.append(panel);
  const settings = doc.createElement('button');
  let returnFocus = null;
  settings.type = 'button';
  settings.className = 'analytics-settings';
  settings.setAttribute('aria-controls', panel.id);
  (doc.querySelector('.legal-links') || doc.querySelector('.footer') || doc.body).append(settings);

  function render() {
    const zh = doc.documentElement.dataset.lang === 'zh';
    panel.querySelector('h2').textContent = zh ? '访问统计，由您选择。' : 'Your choice on analytics.';
    panel.querySelector('p').textContent = zh
      ? '经您同意，我们使用 Google Analytics 了解网站访问情况，帮助改进网站。不向统计系统发送咨询内容或打分答案。拒绝不影响使用网站。'
      : 'With your permission, we use Google Analytics to understand visits and improve this website. We do not send enquiry details or calculator answers to analytics. You can decline and use the site as usual.';
    const policy = panel.querySelector('a');
    policy.textContent = zh ? '隐私政策' : 'Privacy policy';
    policy.href = win.location.pathname.endsWith('.html') ? 'privacy.html' : '/privacy';
    panel.querySelector('[data-analytics="rejected"]').textContent = zh ? '拒绝统计' : 'Decline analytics';
    panel.querySelector('[data-analytics="accepted"]').textContent = zh ? '接受统计' : 'Accept analytics';
    settings.textContent = zh ? '统计偏好' : 'Analytics preferences';
    settings.setAttribute('aria-expanded', String(!panel.hidden));
  }
  function removeCookies() {
    for (const entry of doc.cookie.split(';')) {
      const name = entry.split('=')[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
      for (const domain of ['', '; Domain=' + win.location.hostname, '; Domain=.hiremiiglobal.com']) {
        doc.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax';
      }
    }
  }
  panel.hidden = Boolean(choice);
  render();
  settings.addEventListener('click', () => {
    returnFocus = settings;
    panel.hidden = false;
    render();
    panel.querySelector('button').focus({ preventScroll: true });
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-analytics]');
    if (!button) return;
    choice = button.dataset.analytics;
    try { win.localStorage.setItem(preferenceKey, JSON.stringify({ choice, at: Date.now() })); } catch {}
    win['ga-disable-' + measurementId] = choice !== 'accepted';
    panel.hidden = true;
    render();
    if (choice === 'accepted') start();
    else {
      removeCookies();
      if (started) win.location.reload();
    }
    // A first-visit choice must not focus the off-screen footer and scroll there.
    // Restore focus only when the visitor explicitly opened preferences there.
    returnFocus?.focus({ preventScroll: true });
    returnFocus = null;
  });
  new win.MutationObserver(render).observe(doc.documentElement, {
    attributes: true, attributeFilter: ['data-lang'],
  });
  win.addEventListener('storage', event => {
    if (event.key === preferenceKey || event.key === null) {
      win['ga-disable-' + measurementId] = true;
      win.location.reload();
    }
  });
  if (choice === 'rejected') removeCookies();
  start();
}
