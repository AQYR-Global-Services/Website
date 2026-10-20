/** Wrap to the identical point in the first copy, including a fractional-pixel remainder. */
export function wrapPartnerOffset(offset, cycleWidth) {
  return cycleWidth > 0 ? ((offset % cycleWidth) + cycleWidth) % cycleWidth : 0;
}

export function initPartnerMarquee() {
  const section = document.querySelector('.partner-network');
  const viewport = section?.querySelector('.partner-marquee');
  const rail = section?.querySelector('.partner-rail');
  const group = section?.querySelector('.partner-group');
  if (!viewport || !rail || !group || viewport.dataset.ready) return;
  viewport.dataset.ready = 'true';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let hovered = false;
  let touching = false;
  let visible = !('IntersectionObserver' in window);
  let frame = 0;
  let lastTime = 0;
  let position = viewport.scrollLeft;
  let cycleWidth = group.getBoundingClientRect().width;
  let settleTimer = 0;

  // Only the original 18 links participate in keyboard/screen-reader navigation.
  // Pointer users can still open any visible copy with a native, safe external link.
  const copy = group.cloneNode(true);
  copy.classList.add('partner-loop-copy');
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a').forEach(link => link.setAttribute('tabindex', '-1'));
  rail.append(copy);

  function canRun() {
    return !paused && !hovered && !touching && visible && !document.hidden &&
      !viewport.contains(document.activeElement) && cycleWidth > 0;
  }

  function tick(time) {
    frame = 0;
    if (!canRun()) { lastTime = 0; return; }
    if (lastTime) {
      position = wrapPartnerOffset(position + Math.min(time - lastTime, 64) * 0.032, cycleWidth);
      viewport.scrollLeft = position;
    }
    lastTime = time;
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    position = viewport.scrollLeft;
    if (canRun()) frame = requestAnimationFrame(tick);
  }

  viewport.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { hovered = true; schedule(); }
  });
  viewport.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  viewport.addEventListener('focusin', schedule);
  viewport.addEventListener('focusout', () => queueMicrotask(schedule));
  viewport.addEventListener('pointerdown', () => { touching = true; clearTimeout(settleTimer); schedule(); });
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { touching = false; schedule(); }, 1400);
  }
  window.addEventListener('pointerup', () => { if (touching) settle(); });
  window.addEventListener('pointercancel', () => { if (touching) settle(); });
  viewport.addEventListener('wheel', () => { touching = true; schedule(); settle(); }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    paused = motion.matches;
    section.dataset.reducedMotion = String(motion.matches);
    schedule();
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    cycleWidth = group.getBoundingClientRect().width;
    schedule();
  }).observe(group);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }).observe(viewport);
  section.dataset.reducedMotion = String(motion.matches);
  schedule();
}
