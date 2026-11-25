export const safeCasePreviewSource = value => /^\/case-previews\/[a-z0-9-]+\.webp(?:\?v=[a-f0-9]{12})?$/.test(value || '') ? value : null;

function initHoverPreview(links) {
  const hoverMode = matchMedia('(hover: hover) and (pointer: fine)');
  const thumbnail = new Image();
  thumbnail.className = 'case-hover-preview';
  thumbnail.hidden = true;
  thumbnail.alt = '';
  thumbnail.setAttribute('aria-hidden', 'true');
  document.body.append(thumbnail);
  let activeLink = null;
  let x = 0;
  let y = 0;
  function position() {
    const width = thumbnail.offsetWidth;
    const height = thumbnail.offsetHeight;
    const left = x + width + 20 < innerWidth ? x + 16 : x - width - 16;
    const top = Math.max(8, Math.min(y + 12, innerHeight - height - 8));
    thumbnail.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
  }
  function show() {
    if (!activeLink || !thumbnail.naturalWidth) return;
    thumbnail.hidden = false;
    position();
  }
  function hide() {
    activeLink = null;
    thumbnail.hidden = true;
  }
  thumbnail.addEventListener('load', show);
  thumbnail.addEventListener('error', hide);
  links.forEach(link => {
    link.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !hoverMode.matches) return;
      const source = safeCasePreviewSource(link.dataset.nominationSrc) || safeCasePreviewSource(link.dataset.visaSrc);
      if (!source) return;
      activeLink = link;
      x = event.clientX;
      y = event.clientY;
      thumbnail.hidden = true;
      if (thumbnail.getAttribute('src') !== source) thumbnail.src = source;
      if (thumbnail.complete) show();
    });
    link.addEventListener('pointermove', event => {
      if (activeLink !== link) return;
      x = event.clientX;
      y = event.clientY;
      if (!thumbnail.hidden) position();
    });
    link.addEventListener('pointerleave', hide);
    link.addEventListener('click', hide);
  });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  hoverMode.addEventListener('change', hide);
}

export function initCaseDocumentPreview() {
  const dialog = document.getElementById('case-document-dialog');
  if (!dialog || dialog.dataset.ready || typeof dialog.showModal !== 'function') return;
  dialog.dataset.ready = 'true';
  const title = dialog.querySelector('#case-document-title');
  const image = dialog.querySelector('[data-preview-image]');
  const detail = dialog.querySelector('[data-preview-detail]');
  const detailFigure = dialog.querySelector('[data-detail-figure]');
  const caption = dialog.querySelector('[data-primary-caption]');
  const full = dialog.querySelector('[data-document-full]');
  const region = dialog.querySelector('.case-document-body');
  const error = dialog.querySelector('.case-document-error');
  const switches = [...dialog.querySelectorAll('[data-document-kind]')];
  let opener;
  let selected = 'nomination';
  let previousOverflow;
  const isZh = () => document.documentElement.dataset.lang === 'zh';
  const safeSource = safeCasePreviewSource;

  function labels() {
    if (!opener) return;
    title.textContent = isZh() ? opener.dataset.caseZh : opener.dataset.caseEn;
    const label = selected === 'nomination' ? (isZh() ? '提名批准信' : 'Nomination approval') : (isZh() ? '签证批准信' : 'Visa grant');
    image.alt = title.textContent + ' · ' + label + (isZh() ? '，已脱敏 PDF 首页' : ', redacted PDF first page');
    detail.alt = title.textContent + (isZh() ? '，已脱敏职业详情页' : ', redacted occupation details');
    caption.textContent = label + (isZh() ? ' · PDF 首页（已脱敏）' : ' · PDF first page (redacted)');
    if (!error.hidden) error.textContent = isZh() ? '预览暂时无法载入，请使用“打开大图”重试。' : 'The preview could not load. Please try “Open large image”.';
  }

  function display(kind) {
    const src = safeSource(kind === 'visa' ? opener.dataset.visaSrc : opener.dataset.nominationSrc);
    if (!src) return false;
    selected = kind;
    error.hidden = true;
    image.src = src;
    full.href = src;
    const detailSrc = kind === 'nomination' ? safeSource(opener.dataset.detailSrc) : null;
    detailFigure.hidden = !detailSrc;
    if (detailSrc) detail.src = detailSrc;
    else detail.removeAttribute('src');
    switches.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.documentKind === kind)));
    labels();
    region.scrollTop = 0;
    return true;
  }

  const previewLinks = document.querySelectorAll('[data-case-preview]');
  initHoverPreview(previewLinks);
  previewLinks.forEach(link => link.addEventListener('click', event => {
    // Modified clicks retain the standard, no-JS link to the redacted image.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    opener = link;
    switches.forEach(button => {
      const source = button.dataset.documentKind === 'visa' ? opener.dataset.visaSrc : opener.dataset.nominationSrc;
      button.hidden = !safeSource(source);
    });
    if (!display(safeSource(opener.dataset.nominationSrc) ? 'nomination' : 'visa')) return;
    event.preventDefault();
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    dialog.querySelector('[data-close-preview]').focus({ preventScroll: true });
  }));
  switches.forEach(button => button.addEventListener('click', () => display(button.dataset.documentKind)));
  dialog.querySelector('[data-close-preview]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const targets = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0);
    const first = targets[0];
    const last = targets.at(-1);
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus({ preventScroll: true });
    }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow || '';
    opener?.focus({ preventScroll: true });
  });
  for (const item of [image, detail]) item.addEventListener('error', () => { error.hidden = false; labels(); });
  new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
}
