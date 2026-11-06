// One hierarchy feeds the visible navigation and the page's BreadcrumbList.
const labels = {
  index: ['Home', '首页'],
  about: ['About us', '公司介绍'],
  employers: ['Employer solutions', '企业服务'],
  'visa-services': ['Individual visa services', '个人签证服务'],
  'employer-sponsorship': ['482 & 186 sponsorship', '482／186 企业雇主担保'],
  'labour-agreements': ['Labour agreements & DAMA', '劳工协议与 DAMA'],
  'sponsored-visas': ['482 & 186 visas', '482／186 个人雇主担保'],
  'points-calculator': ['Points calculator', '技术移民打分计算器'],
  approach: ['Our approach', '服务流程'],
  'case-studies': ['Case experience', '案例经验'],
  team: ['Our team', '服务团队'],
  contact: ['Contact us', '联系我们'],
  privacy: ['Privacy policy', '隐私政策'],
  terms: ['Terms of use', '使用条款'],
};
const parents = {
  'employer-sponsorship': 'employers',
  'labour-agreements': 'employers',
  'sponsored-visas': 'visa-services',
  'points-calculator': 'visa-services',
};

export function pageBreadcrumbs(slug) {
  if (!Object.hasOwn(labels, slug)) throw new Error('Unknown page hierarchy: ' + slug);
  if (slug === 'index') return [];
  return ['index', ...(parents[slug] ? [parents[slug]] : []), slug].map(key => ({
    path: key === 'index' ? '/' : '/' + key,
    en: labels[key][0], zh: labels[key][1],
  }));
}

const escapeHtml = text => text.replace(/[&<>"']/g, value => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[value]);

export function breadcrumbMarkup(slug) {
  const trail = pageBreadcrumbs(slug);
  if (!trail.length) return '';
  const items = trail.map((item, index) => {
    const text = `data-en="${escapeHtml(item.en)}" data-zh="${escapeHtml(item.zh)}">${escapeHtml(item.en)}`;
    return index === trail.length - 1
      ? `<li><span aria-current="page" ${text}</span></li>`
      : `<li><a href="${item.path}" ${text}</a></li>`;
  });
  return `<nav class="page-breadcrumbs" aria-label="Breadcrumb" data-aria-label-en="Breadcrumb" data-aria-label-zh="当前位置"><ol>${items.join('')}</ol></nav>`;
}
