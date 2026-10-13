(() => {
  const root = document.documentElement;
  const languageButton = document.querySelector('[data-language-toggle]');
  const menuButton = document.querySelector('.menu');
  const navigation = document.querySelector('.nav');
  const form = document.querySelector('#enquiry-form');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const siteHeader = document.querySelector('.top');
  const caseMap = document.querySelector('.case-map');
  const caseMapDetail = caseMap?.querySelector('#case-map-detail');
  const caseMapStages = [...(caseMap?.querySelectorAll('.case-map-stage') || [])];
  const caseMapToggle = caseMap?.querySelector('.case-map-toggle');
  const caseMapInterval = 3000;
  let caseMapIndex = Math.max(0, caseMapStages.findIndex(stage => stage.getAttribute('aria-pressed') === 'true'));
  let caseMapTimer = 0;
  let caseMapPaused = motionPreference.matches;
  let caseMapHovered = false;
  let caseMapVisible = !('IntersectionObserver' in window);

  function selectCaseMapStage(index, manual = false) {
    const stage = caseMapStages[index];
    if (!stage) return;
    caseMapIndex = index;
    caseMapStages.forEach(node => node.setAttribute('aria-pressed', String(node === stage)));
    if (caseMapDetail) {
      // Automatic changes are visual; announce only a visitor's explicit selection.
      caseMapDetail.setAttribute('aria-live', manual ? 'polite' : 'off');
      caseMapDetail.dataset.en = stage.dataset.caseEn;
      caseMapDetail.dataset.zh = stage.dataset.caseZh;
      caseMapDetail.textContent = root.dataset.lang === 'zh' ? stage.dataset.caseZh : stage.dataset.caseEn;
    }
  }

  function updateCaseMapControl() {
    if (!caseMapToggle) return;
    const label = root.dataset.lang === 'zh'
      ? (caseMapPaused ? '播放五步流程' : '暂停五步流程')
      : (caseMapPaused ? 'Play the five-step process' : 'Pause the five-step process');
    caseMapToggle.dataset.paused = String(caseMapPaused);
    caseMapToggle.setAttribute('aria-label', label);
    caseMapToggle.title = label;
  }

  function scheduleCaseMap() {
    clearTimeout(caseMapTimer);
    caseMapTimer = 0;
    if (!caseMap || caseMapStages.length < 2 || caseMapPaused || caseMapHovered ||
        !caseMapVisible || document.hidden ||
        (caseMap.contains(document.activeElement) && document.activeElement !== caseMapToggle &&
          document.activeElement.matches(':focus-visible'))) return;
    caseMapTimer = setTimeout(() => {
      selectCaseMapStage((caseMapIndex + 1) % caseMapStages.length);
      scheduleCaseMap();
    }, caseMapInterval);
  }

  if (caseMap && caseMapStages.length) {
    if (caseMapToggle) {
      caseMapToggle.hidden = false;
      caseMapToggle.addEventListener('click', () => {
        caseMapPaused = !caseMapPaused;
        updateCaseMapControl();
        scheduleCaseMap();
      });
    }
    caseMapStages.forEach((stage, index) => {
      stage.addEventListener('click', () => {
        selectCaseMapStage(index, true);
        scheduleCaseMap();
      });
    });
    caseMap.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      caseMapHovered = true;
      scheduleCaseMap();
    });
    caseMap.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      caseMapHovered = false;
      scheduleCaseMap();
    });
    caseMap.addEventListener('focusin', scheduleCaseMap);
    caseMap.addEventListener('focusout', () => queueMicrotask(scheduleCaseMap));
    document.addEventListener('visibilitychange', scheduleCaseMap);
    motionPreference.addEventListener('change', event => {
      if (event.matches) caseMapPaused = true;
      updateCaseMapControl();
      scheduleCaseMap();
    });
    if ('IntersectionObserver' in window) {
      const playbackObserver = new IntersectionObserver(entries => {
        caseMapVisible = entries.some(entry => entry.isIntersecting);
        scheduleCaseMap();
      }, { threshold: 0.35 });
      playbackObserver.observe(caseMap);
    }
    updateCaseMapControl();
    scheduleCaseMap();
  }
  if (caseMap && 'IntersectionObserver' in window && !motionPreference.matches) {
    caseMap.classList.add('map-ready');
    const mapObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        caseMap.classList.add('map-on');
        mapObserver.disconnect();
      }
    }, { threshold: 0.2 });
    mapObserver.observe(caseMap);
    motionPreference.addEventListener('change', event => {
      if (event.matches) {
        caseMap.classList.remove('map-ready');
        mapObserver.disconnect();
      }
    });
  }

  // Decorative layers never intercept input; pause them offscreen and in hidden tabs.
  const ambientSurfaces = [...document.querySelectorAll('main > .hero, main .section.dark, main > .cta')];
  const visibleSurfaces = new Set();
  ambientSurfaces.forEach(surface => {
    const backdrop = document.createElement('div');
    backdrop.className = 'ambient-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    surface.classList.add('ambient-surface');
    surface.prepend(backdrop);
  });
  const updateAmbientMotion = () => {
    const enabled = !motionPreference.matches && !document.hidden;
    ambientSurfaces.forEach(surface => {
      surface.classList.toggle('ambient-running', enabled && visibleSurfaces.has(surface));
    });
  };
  if ('IntersectionObserver' in window && ambientSurfaces.length) {
    const ambientObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleSurfaces.add(entry.target);
        else visibleSurfaces.delete(entry.target);
      });
      updateAmbientMotion();
    });
    ambientSurfaces.forEach(surface => ambientObserver.observe(surface));
    document.addEventListener('visibilitychange', updateAmbientMotion);
    motionPreference.addEventListener('change', updateAmbientMotion);
  }

  const readingProgress = document.createElement('div');
  readingProgress.className = 'reading-progress';
  readingProgress.setAttribute('aria-hidden', 'true');
  const progressLine = document.createElement('span');
  readingProgress.append(progressLine);
  document.body.append(readingProgress);

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.hidden = true;
  backToTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12l6-6 6 6M12 6v13"/></svg>';
  document.body.append(backToTop);

  function setLanguage(language) {
    language = language === 'zh' ? 'zh' : 'en';
    root.dataset.lang = language;
    root.lang = language === 'zh' ? 'zh-Hans' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(node => {
      node.innerHTML = language === 'zh' ? node.dataset.zh : node.dataset.en;
    });
    document.querySelectorAll('[data-aria-label-en][data-aria-label-zh]').forEach(node => {
      node.setAttribute('aria-label', language === 'zh' ? node.dataset.ariaLabelZh : node.dataset.ariaLabelEn);
    });
    document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach(node => {
      node.setAttribute('alt', language === 'zh' ? node.dataset.altZh : node.dataset.altEn);
    });
    document.querySelectorAll('[data-placeholder-en][data-placeholder-zh]').forEach(node => {
      node.placeholder = language === 'zh' ? node.dataset.placeholderZh : node.dataset.placeholderEn;
    });
    if (languageButton) {
      languageButton.textContent = language === 'en' ? '中文' : 'English';
      languageButton.setAttribute('aria-label', language === 'en' ? 'Switch to Chinese' : '切换为英文');
    }
    updateMenuLabel();
    updateCaseMapControl();
    backToTop.setAttribute('aria-label', language === 'en' ? 'Back to top' : '返回顶部');
    backToTop.title = language === 'en' ? 'Back to top' : '返回顶部';
    scheduleScrollUpdate();
    try { localStorage.setItem('aqyr-demo-language', language); } catch {}
  }

  function updateMenuLabel() {
    const open = menuButton?.getAttribute('aria-expanded') === 'true';
    menuButton?.setAttribute('aria-label', root.dataset.lang === 'zh'
      ? (open ? '关闭导航菜单' : '打开导航菜单')
      : (open ? 'Close navigation menu' : 'Open navigation menu'));
  }

  function closeMenu(returnFocus = false) {
    navigation?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    updateMenuLabel();
    if (returnFocus) menuButton?.focus();
  }

  const pageLinks = [...document.querySelectorAll('.page-jump a[href^="#"], .case-directory li a[href^="#"]')]
    .map(link => ({ link, target: document.getElementById(link.hash.slice(1)) }))
    .filter(item => item.target);
  let scrollFrame = 0;
  let activePageLink = null;
  let preferredPageLink = pageLinks.find(item => item.link.hash === window.location.hash) || null;
  pageLinks.forEach(item => {
    item.link.addEventListener('click', () => {
      preferredPageLink = item;
      scheduleScrollUpdate();
    });
  });
  function updateScrollState() {
    scrollFrame = 0;
    siteHeader?.classList.toggle('is-compact', window.scrollY > 64);
    const distance = Math.max(0, root.scrollHeight - window.innerHeight);
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    progressLine.style.transform = 'scaleX(' + progress + ')';
    backToTop.hidden = window.scrollY < Math.max(600, window.innerHeight * 0.8);
    let current = null;
    let currentTop = -Infinity;
    pageLinks.forEach(item => {
      const top = item.target.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.35) return;
      // Side-by-side visa cards share a reading position; retain the chosen card.
      if (!current || top > currentTop + 2 || (Math.abs(top - currentTop) <= 2 && item === preferredPageLink)) {
        current = item;
        currentTop = top;
      }
    });
    pageLinks.forEach(item => {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
    if (current && current !== activePageLink) {
      const track = current.link.closest('.case-directory-track, .wrap');
      if (track && track.scrollWidth > track.clientWidth) {
        const linkBounds = current.link.getBoundingClientRect();
        const trackBounds = track.getBoundingClientRect();
        if (linkBounds.left < trackBounds.left || linkBounds.right > trackBounds.right) {
          track.scrollBy({ left: linkBounds.left - trackBounds.left - 8,
            behavior: motionPreference.matches ? 'instant' : 'smooth' });
        }
      }
    }
    activePageLink = current;
  }
  function scheduleScrollUpdate() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollState);
  }
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate);
  window.addEventListener('load', scheduleScrollUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleScrollUpdate).observe(document.body);
  backToTop.addEventListener('click', () => {
    document.querySelector('.brand')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  });

  let language = 'en';
  try { language = localStorage.getItem('aqyr-demo-language') || 'en'; } catch {}
  setLanguage(language);
  // Stored language and font loading can change the height above a shared case.
  const initialCaseHash = location.hash;
  const initialCaseTarget = document.getElementById(initialCaseHash.slice(1));
  if (initialCaseTarget?.matches('.case-detailed, .case-legacy-anchor')) {
    let userInteracted = false;
    const markInteraction = () => { userInteracted = true; };
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown'];
    events.forEach(type => window.addEventListener(type, markInteraction, { once: true, passive: true }));
    (document.fonts?.ready || Promise.resolve()).then(() => requestAnimationFrame(() => {
      events.forEach(type => window.removeEventListener(type, markInteraction));
      if (!userInteracted && location.hash === initialCaseHash) {
        initialCaseTarget.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }));
  }
  languageButton?.addEventListener('click', () => setLanguage(root.dataset.lang === 'en' ? 'zh' : 'en'));
  menuButton?.addEventListener('click', () => {
    const open = navigation?.classList.toggle('open') || false;
    menuButton.setAttribute('aria-expanded', String(open));
    updateMenuLabel();
  });
  navigation?.querySelectorAll('a').forEach(link => {
    if (new URL(link.getAttribute('href'), location.href).pathname === location.pathname) {
      link.setAttribute('aria-current', 'page');
    }
    link.addEventListener('click', () => closeMenu());
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation?.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (navigation?.classList.contains('open') && !event.target.closest('.top')) closeMenu();
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  if (form) {
    const requestedService = new URLSearchParams(location.search).get('service');
    const requestSelect = form.querySelector('[name="requestType"]');
    if (requestedService && [...requestSelect.options].some(option => option.value === requestedService)) {
      requestSelect.value = requestedService;
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const zh = root.dataset.lang === 'zh';
      const data = new FormData(form);
      const labels = zh ? ['咨询身份', '咨询需求', '姓名', '公司 / 职业', '邮箱', '电话', '需求说明']
        : ['Enquiry type', 'What you need', 'Name', 'Company / occupation', 'Email', 'Phone', 'Enquiry details'];
      const optionText = name => {
        const selected = form.querySelector('[name="' + name + '"]').selectedOptions[0];
        return zh ? selected.dataset.zh : selected.dataset.en;
      };
      const values = [optionText('enquiryType'), optionText('requestType'), data.get('name'),
        data.get('companyOccupation') || '—', data.get('email'), data.get('phone') || '—', data.get('message')];
      const subject = zh ? 'AQYR 网站咨询' : 'AQYR website enquiry';
      const body = labels.map((label, index) => label + ': ' + values[index]).join('\n\n');
      const status = form.querySelector('#enquiry-status');
      if (status) {
        status.dataset.en = 'Please send the draft from your email app. If it does not open, email info@hiremiiglobal.com directly.';
        status.dataset.zh = '请在邮件应用中自行发送草稿。如未打开，请直接发送邮件至 info@hiremiiglobal.com。';
        status.textContent = zh ? status.dataset.zh : status.dataset.en;
      }
      window.location.href = 'mailto:info@hiremiiglobal.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  // Content stays visible when JavaScript is unavailable; motion is progressive enhancement.
  const caseCounter = document.querySelector('[data-count-to]');
  if (caseCounter && 'IntersectionObserver' in window && !motionPreference.matches) {
    const target = Number(caseCounter.dataset.countTo);
    const numberNode = caseCounter.firstChild;
    if (Number.isFinite(target) && target > 1 && numberNode?.nodeType === Node.TEXT_NODE) {
      let countFrame = 0;
      let completed = false;
      const finishCount = () => {
        cancelAnimationFrame(countFrame);
        numberNode.nodeValue = String(target);
        caseCounter.classList.remove('counting');
        completed = true;
      };
      const counterObserver = new IntersectionObserver(entries => {
        if (completed || !entries.some(entry => entry.isIntersecting)) return;
        counterObserver.disconnect();
        if (motionPreference.matches) return finishCount();
        const started = performance.now();
        caseCounter.classList.add('counting');
        numberNode.nodeValue = '1';
        const tick = now => {
          if (motionPreference.matches) return finishCount();
          const progress = Math.min(1, Math.max(0, (now - started) / 1100));
          const eased = 1 - Math.pow(1 - progress, 3);
          numberNode.nodeValue = String(Math.round(1 + (target - 1) * eased));
          if (progress < 1) countFrame = requestAnimationFrame(tick);
          else finishCount();
        };
        countFrame = requestAnimationFrame(tick);
      }, { threshold: 0.5 });
      counterObserver.observe(caseCounter);
      motionPreference.addEventListener('change', event => {
        if (event.matches) {
          counterObserver.disconnect();
          finishCount();
        }
      });
    }
  }

  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    root.classList.add('motion-ready');
    document.querySelectorAll('.grid2, .grid3, .specialism-grid, .team-support, .partner-grid').forEach(group => {
      [...group.children].forEach((node, index) => {
        if (node.matches('.reveal')) node.style.setProperty('--reveal-delay', Math.min(index % 3, 2) * 65 + 'ms');
      });
    });
    document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
    motionPreference.addEventListener('change', event => {
      if (event.matches) {
        root.classList.remove('motion-ready');
        observer.disconnect();
      }
    });
  }
})();
