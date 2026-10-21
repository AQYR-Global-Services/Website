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
  const safeSource = value => /^\/case-previews\/[a-z0-9-]+\.webp$/.test(value || '') ? value : null;

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

  document.querySelectorAll('[data-case-preview]').forEach(link => link.addEventListener('click', event => {
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
