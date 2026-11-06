(() => {
  const root = document.documentElement;
  const languageButton = document.querySelector('[data-language-toggle]');
  const menuButton = document.querySelector('.menu');
  const navigation = document.querySelector('.nav');
  const navGroups = [...document.querySelectorAll('.nav-group')];
  const navHover = window.matchMedia('(min-width: 1101px) and (hover: hover) and (pointer: fine)');
  const navCloseTimers = new Map();
  const navHoverTimers = new Map();
  const form = document.querySelector('#enquiry-form');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const siteHeader = document.querySelector('.top');
  const englishHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const englishGuides = [...document.querySelectorAll('.visa-english-summary[id]')].map(panel => ({
    panel, question: panel.closest('.faq-item'), button: null,
    pinned: false, hovered: false, focused: false, suppressed: false, closeTimer: 0,
  }));
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
    // Routed pages are already translated on the server, including internal links.
    // Offline HTML previews retain their in-place language switch.
    if (!root.dataset.routeLanguage) document.querySelectorAll('[data-en][data-zh]').forEach(node => {
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
    initialiseEnglishGuides();
    backToTop.setAttribute('aria-label', language === 'en' ? 'Back to top' : '返回顶部');
    backToTop.title = language === 'en' ? 'Back to top' : '返回顶部';
    scheduleScrollUpdate();
    if (!root.dataset.routeLanguage) {
      try { localStorage.setItem('aqyr-demo-language', language); } catch {}
    }
  }

  function updateEnglishGuide(state) {
    const open = state.question.open && (state.pinned || (!state.suppressed && (state.hovered || state.focused)));
    const changed = state.panel.hidden === open;
    state.panel.hidden = !open;
    state.button?.setAttribute('aria-expanded', String(open));
    if (changed) scheduleScrollUpdate();
  }

  function closeEnglishGuide(state, dismissed = false) {
    clearTimeout(state.closeTimer);
    state.pinned = state.hovered = state.focused = false;
    state.suppressed = dismissed;
    updateEnglishGuide(state);
  }

  function initialiseEnglishGuides() {
    englishGuides.forEach(state => {
      clearTimeout(state.closeTimer);
      // Translation replaces the paragraph markup; rebind its new inline button.
      const button = state.question.querySelector('.visa-english-trigger');
      if (!button) return;
      state.button = button;
      state.hovered = state.focused = state.suppressed = false;
      button.disabled = false;
      const hoverIn = event => {
        if (!englishHover.matches || event.pointerType !== 'mouse') return;
        clearTimeout(state.closeTimer);
        state.hovered = true;
        state.suppressed = false;
        updateEnglishGuide(state);
      };
      const hoverOut = event => {
        if (event.pointerType !== 'mouse') return;
        state.hovered = false;
        clearTimeout(state.closeTimer);
        // A short grace period lets the pointer cross into the reading panel.
        state.closeTimer = setTimeout(() => updateEnglishGuide(state), 220);
      };
      const updateFocus = event => {
        // relatedTarget keeps the panel open during the native blur → focus hand-off.
        const next = event.type === 'blur' || event.type === 'focusout' ? event.relatedTarget : event.target;
        state.focused = state.panel.contains(next) ||
          (next === state.button && state.button.matches(':focus-visible'));
        if (next && !state.focused && !state.hovered) state.suppressed = false;
        updateEnglishGuide(state);
      };
      button.addEventListener('pointerenter', hoverIn);
      button.addEventListener('pointerleave', hoverOut);
      button.addEventListener('focus', updateFocus);
      button.addEventListener('blur', updateFocus);
      button.addEventListener('click', () => {
        state.pinned = !state.pinned;
        state.suppressed = !state.pinned;
        updateEnglishGuide(state);
      });
      if (!state.bound) {
        state.panel.addEventListener('pointerenter', hoverIn);
        state.panel.addEventListener('pointerleave', hoverOut);
        state.panel.addEventListener('focusin', updateFocus);
        state.panel.addEventListener('focusout', updateFocus);
        state.question.addEventListener('toggle', () => {
          if (!state.question.open) closeEnglishGuide(state);
        });
        state.question.addEventListener('keydown', event => {
          if (event.key !== 'Escape' || state.panel.hidden) return;
          event.preventDefault();
          state.button?.focus({ preventScroll: true });
          closeEnglishGuide(state, true);
        });
        state.bound = true;
      }
      updateEnglishGuide(state);
    });
  }

  document.addEventListener('pointerdown', event => {
    englishGuides.forEach(state => {
      if (!state.button?.contains(event.target) && !state.panel.contains(event.target)) closeEnglishGuide(state);
    });
  });

  function updateMenuLabel() {
    const open = menuButton?.getAttribute('aria-expanded') === 'true';
    menuButton?.setAttribute('aria-label', root.dataset.lang === 'zh'
      ? (open ? '关闭导航菜单' : '打开导航菜单')
      : (open ? 'Close navigation menu' : 'Open navigation menu'));
  }

  function closeMenu(returnFocus = false) {
    closeNavGroups();
    navigation?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    updateMenuLabel();
    if (returnFocus) menuButton?.focus();
  }

  function closeNavGroups(except = null, returnFocus = false) {
    navGroups.forEach(group => {
      clearTimeout(navCloseTimers.get(group));
      if (group === except) return;
      clearTimeout(navHoverTimers.get(group));
      const wasOpen = group.open;
      group.open = false;
      if (returnFocus && wasOpen) group.querySelector('summary')?.focus();
    });
  }
  navGroups.forEach(group => {
    group.querySelector('summary').addEventListener('pointerdown', () => clearTimeout(navHoverTimers.get(group)));
    group.querySelector('summary').addEventListener('click', () => clearTimeout(navHoverTimers.get(group)));
    group.addEventListener('toggle', () => {
      if (group.open) closeNavGroups(group);
    });
    group.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !navHover.matches) return;
      clearTimeout(navCloseTimers.get(group));
      closeNavGroups(group);
      clearTimeout(navHoverTimers.get(group));
      navHoverTimers.set(group, setTimeout(() => { group.open = true; }, 150));
    });
    group.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse' || !navHover.matches) return;
      clearTimeout(navHoverTimers.get(group));
      navCloseTimers.set(group, setTimeout(() => {
        if (!group.contains(document.activeElement)) group.open = false;
      }, 150));
    });
    group.addEventListener('focusout', event => {
      // Focus briefly passes through the body between summary and child links.
      // relatedTarget preserves in-group navigation before the link activates.
      if (group.contains(event.relatedTarget)) return;
      setTimeout(() => {
        if (!group.contains(document.activeElement)) group.open = false;
      }, 0);
    });
  });

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

  let language = root.dataset.routeLanguage || 'en';
  if (!root.dataset.routeLanguage) {
    try { language = localStorage.getItem('aqyr-demo-language') || 'en'; } catch {}
  }
  setLanguage(language);

  if (document.querySelector('[data-case-preview]')) {
    import(location.pathname.endsWith('.html') ? './public/case-document-preview.mjs?v=20261022-watermark' : '/case-document-preview.mjs?v=20261022-watermark')
      .then(module => module.initCaseDocumentPreview())
      .catch(() => { /* Direct links still open the redacted previews. */ });
  }

  if (document.querySelector('.partner-network')) {
    import(location.pathname.endsWith('.html') ? './public/partner-marquee.mjs?v=20261020-clean' : '/partner-marquee.mjs?v=20261020-clean')
      .then(module => module.initPartnerMarquee())
      .catch(() => { /* Native horizontal scrolling and all partner links remain usable. */ });
  }

  // Local previews show the preference UI without sending production analytics.
  import(location.pathname.endsWith('.html') ? './public/analytics.mjs?v=20261106-locales' : '/analytics.mjs?v=20261106-locales')
    .then(module => module.initAnalytics())
    .catch(() => { /* Analytics must never block navigation, enquiries or scoring. */ });
  if (document.querySelector('#points-calculator')) {
    import(location.pathname.endsWith('.html') ? './public/points-calculator.mjs?v=20261106-locales' : '/points-calculator.mjs?v=20261106-locales')
      .then(module => module.initialisePointsCalculator())
      .catch(() => {
        const status = document.querySelector('#pc-live-score');
        if (status) status.textContent = root.dataset.lang === 'zh'
          ? '打分工具暂时未能加载，请刷新页面或查阅下方官方计分表。'
          : 'The calculator could not load. Refresh this page or use the official points tables below.';
      });
  }
  // Stored language and font loading can change the height above a shared section.
  const initialCaseHash = location.hash;
  const initialCaseTarget = document.getElementById(initialCaseHash.slice(1));
  if (initialCaseTarget?.matches('.case-detailed, .page-labour-agreements section[id], #labour-agreements')) {
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
  if (languageButton?.tagName === 'A') {
    const counterpart = new URL(languageButton.href);
    const updateLanguageLink = () => {
      counterpart.search = location.search;
      counterpart.hash = location.hash;
      languageButton.href = counterpart.href;
    };
    updateLanguageLink();
    languageButton.addEventListener('click', updateLanguageLink);
    window.addEventListener('hashchange', updateLanguageLink);
  } else {
    languageButton?.addEventListener('click', () => setLanguage(root.dataset.lang === 'en' ? 'zh' : 'en'));
  }
  menuButton?.addEventListener('click', () => {
    const open = navigation?.classList.toggle('open') || false;
    menuButton.setAttribute('aria-expanded', String(open));
    updateMenuLabel();
  });
  navigation?.querySelectorAll('a').forEach(link => {
    if (new URL(link.getAttribute('href'), location.href).pathname === location.pathname) {
      link.setAttribute('aria-current', 'page');
    }
    // Native links navigate normally; the new document starts with every menu closed.
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navGroups.some(group => group.open)) {
      event.preventDefault();
      closeNavGroups(null, true);
      return;
    }
    if (event.key === 'Escape' && navigation?.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.top')) closeNavGroups();
    if (navigation?.classList.contains('open') && !event.target.closest('.top')) closeMenu();
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  if (form) {
    const sendButton = form.querySelector('#enquiry-send');
    let sending = false;
    let lastSentPayload = '';
    let verificationToken = '', verificationWidget;
    const verificationBox = form.querySelector('#enquiry-verification');
    const requestedService = new URLSearchParams(location.search).get('service');
    const requestSelect = form.querySelector('[name="requestType"]');
    if (requestedService && [...requestSelect.options].some(option => option.value === requestedService)) {
      requestSelect.value = requestedService;
    }
    if (requestedService === 'labour-agreement') form.querySelector('[name="enquiryType"]').value = 'Employer';
    const audience = new URLSearchParams(location.search).get('audience');
    const enquiryAudience = audience === 'employer' ? 'Employer' : audience === 'individual'
      ? (['skilled','sponsorship','employer-connection'].includes(requestedService) ? 'Skilled professional' : 'Individual visa enquiry') : '';
    if (enquiryAudience) form.querySelector('[name="enquiryType"]').value = enquiryAudience;
    const labourHint = form.querySelector('#labour-enquiry-hint');
    const updateLabourHint = () => {
      if (labourHint) labourHint.hidden = requestSelect.value !== 'labour-agreement';
    };
    requestSelect.addEventListener('change', updateLabourHint);
    updateLabourHint();
    const estimateSection = form.querySelector('#enquiry-estimate');
    const includeEstimate = form.querySelector('[name="includeEstimate"]');
    const estimateFields = form.querySelector('#enquiry-estimate-fields');
    const estimatePathway = form.querySelector('[name="estimatePathway"]');
    const estimatedScore = form.querySelector('[name="estimatedScore"]');
    const detailPreview = form.querySelector('#enquiry-points-detail');
    const detailText = form.querySelector('#enquiry-points-detail-text');
    const detailStatus = form.querySelector('#enquiry-points-status');
    let pointsSnapshot = null;
    const nominationSection=form.querySelector('#enquiry-nomination');
    const includeNomination=form.querySelector('[name="includeNomination"]');
    const nominationDetail=form.querySelector('#enquiry-nomination-detail');
    const nominationText=form.querySelector('#enquiry-nomination-text');
    const nominationStatus=form.querySelector('#enquiry-nomination-status');
    let nominationSnapshot=null,nominationRequested=false,nominationLoaded=false;
    let pointsEnquiryModule = null;
    let detailsRequested = false;
    let detailsReady = Promise.resolve();
    const estimateLimits = Object.fromEntries(['vic','nsw','qld','wa','sa','tas','act','nt'].flatMap(state=>[[state+'-189',130],[state+'-190',state==='vic'?950:135],[state+'-491',state==='vic'?950:145]]));
    const federalNomination = pathway => Object.hasOwn(estimateLimits,pathway) && /-(190|491)$/.test(pathway) && !['vic-190','vic-491'].includes(pathway);
    const updateEstimate = () => {
      const estimateLabel=form.querySelector('#enquiry-estimate-label');
      const vptPath=['vic-190','vic-491'].includes(estimatePathway.value);
      estimateLabel.textContent=root.dataset.lang==='zh'?(vptPath?'附上 VPT 自评与明细（可选）':'附上 EOI／VPT 预估分数（可选）'):(vptPath?'Attach VPT self-assessment and breakdown (optional)':'Attach EOI / VPT estimate (optional)');
      const skilled = requestSelect.value === 'skilled';
      estimateSection.hidden = !skilled;
      if (!skilled) includeEstimate.checked = false;
      includeEstimate.disabled = !skilled;
      const include = skilled && includeEstimate.checked;
      estimateFields.hidden = !include;
      for (const field of [estimatePathway,estimatedScore]) {
        field.disabled = !include;
        field.required = include;
      }
      estimatedScore.readOnly = include && detailsRequested;
      estimatePathway.disabled = !include || detailsRequested;
      detailPreview.hidden = !include || !pointsSnapshot;
      detailText.textContent = pointsSnapshot ? pointsEnquiryModule.formatPointsEnquiry(pointsSnapshot,root.dataset.lang) : '';
      nominationSection.hidden=!nominationRequested;
      includeNomination.disabled=!nominationRequested;
      nominationDetail.hidden=!includeNomination.checked||!nominationSnapshot;
      nominationText.textContent=nominationSnapshot?pointsEnquiryModule.formatNominationEnquiry(nominationSnapshot,root.dataset.lang):'';
      nominationStatus.hidden=!nominationRequested||!includeNomination.checked||!!nominationSnapshot;
      nominationStatus.textContent=root.dataset.lang==='zh'?(nominationLoaded?'未能读取州提名自评。请返回计算器重新附上，或取消此项后咨询。':'正在读取州提名自评……'):(nominationLoaded?'State assessment could not be read. Return to the calculator, or uncheck this attachment to continue.':'Loading state nomination assessment…');
      if (detailsRequested && !pointsSnapshot) {
        detailStatus.textContent = root.dataset.lang === 'zh' ? '正在读取计分明细。如无法读取，请返回打分工具重新计算。' : 'Loading your points breakdown. If it cannot be loaded, return to the calculator and recalculate.';
      } else detailStatus.textContent = '';
      detailStatus.hidden = !include || !detailStatus.textContent;
      estimatedScore.max = String(estimateLimits[estimatePathway.value] || 950);
      form.querySelector('#enquiry-nomination-hint').hidden = !federalNomination(estimatePathway.value);
    };
    requestSelect.addEventListener('change', updateEstimate);
    includeEstimate.addEventListener('change', updateEstimate);
    includeNomination.addEventListener('change',updateEstimate);
    estimatePathway.addEventListener('change', updateEstimate);
    // Scoring answers are carried only after opt-in, in a fragment rather than an HTTP request.
    if (location.hash.startsWith('#enquiry?')) {
      const estimate = new URLSearchParams(location.hash.slice('#enquiry?'.length));
      const pathway = estimate.get('pathway');
      const score = estimate.get('score');
      const rawNomination=estimate.get('nomination');
      let rawDetails=null;
      if (requestedService === 'skilled' && Object.hasOwn(estimateLimits,pathway) &&
          /^\d{1,3}$/.test(score || '') && Number(score) <= estimateLimits[pathway]) {
        includeEstimate.checked = true;
        estimatePathway.value = pathway;
        estimatedScore.value = score;
        // Legacy VIC491 EOI links must never be re-labelled as new VPT estimates.
        rawDetails = estimate.get('details') ?? (pathway==='vic-491'?'{}':null);
        detailsRequested=rawDetails!=null;
      }
      if(rawNomination!=null){nominationRequested=true;includeNomination.checked=true;}
      if(detailsRequested||nominationRequested){
        detailsReady = import(location.pathname.endsWith('.html') ? './public/points-enquiry.mjs?v=20261104-policy-guidance' : '/points-enquiry.mjs?v=20261104-policy-guidance')
          .then(module=>{
            pointsEnquiryModule=module;
            if(detailsRequested)pointsSnapshot=module.parsePointsSnapshot(rawDetails,pathway,score);
            if(nominationRequested)nominationSnapshot=module.parseNominationSnapshot(rawNomination);
            nominationLoaded=true;updateEstimate();
          }).catch(()=>{nominationLoaded=true;updateEstimate();});
      }
      history.replaceState(history.state,'',location.pathname+location.search+'#enquiry');
      requestAnimationFrame(() => document.querySelector('#enquiry').scrollIntoView({block:'start'}));
    }
    updateEstimate();
    new MutationObserver(updateEstimate).observe(root,{attributes:true,attributeFilter:['data-lang']});
    const draftPanel = form.querySelector('#enquiry-draft');
    const draftText = form.querySelector('#enquiry-draft-text');
    const copyDraft = form.querySelector('#enquiry-copy');
    let draftRevision = 0;
    const setEnquiryStatus = (en,zh) => {
      const status = form.querySelector('#enquiry-status');
      status.dataset.en = en;
      status.dataset.zh = zh;
      status.textContent = root.dataset.lang === 'zh' ? zh : en;
    };
    const clearDraft = () => {
      draftRevision += 1;
      draftPanel.hidden = true;
      draftText.value = '';
      copyDraft.disabled = true;
      setEnquiryStatus('Submit your enquiry directly, or preview a draft and use your email app.',
        '可直接提交咨询，也可先预览草稿并通过邮件应用自行发送。');
    };
    form.addEventListener('input',clearDraft);
    form.addEventListener('change',clearDraft);
    copyDraft.addEventListener('click', async () => {
      if (copyDraft.disabled || !draftText.value) return;
      const text = draftText.value;
      try {
        await navigator.clipboard.writeText(text);
        if (draftText.value !== text || draftPanel.hidden) return;
        setEnquiryStatus('Draft copied. Paste it into your email service and send it to info@hiremiiglobal.com. No email has been sent by this website.',
          '草稿已复制。请粘贴到您的邮箱，发送至 info@hiremiiglobal.com；网站尚未发送任何邮件。');
      } catch {
        if (draftText.value !== text || draftPanel.hidden) return;
        draftText.focus();
        draftText.select();
        setEnquiryStatus('Automatic copying is unavailable. Copy the selected draft manually, then send it from your own email service.',
          '暂时无法自动复制。请手动复制已选中的草稿，再通过自己的邮箱发送。');
      }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending) return;
      clearDraft();
      const revision = draftRevision;
      if (!form.reportValidity()) return;
      if (includeEstimate.checked && detailsRequested) {
        await detailsReady;
        if (revision !== draftRevision) return;
        if (!pointsSnapshot) {
          detailStatus.hidden = false;
          detailStatus.textContent = root.dataset.lang === 'zh' ? '未能读取完整明细。请返回打分工具重新计算，再附上分数。' : 'The complete breakdown could not be loaded. Please recalculate and include your estimate again.';
          return;
        }
      }
      if(includeNomination.checked&&nominationRequested){
        await detailsReady;
        if (revision !== draftRevision) return;
        if(!nominationSnapshot){nominationStatus.hidden=false;return;}
      }
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
      if (data.get('includeEstimate')) {
        labels.push(zh ? '预估分数（客户自评，待团队核对）' : 'Estimated points (self-assessed, subject to review)');
        const nominationNote = federalNomination(estimatePathway.value)
          ? (zh ? '（含有条件州提名 +'+(estimatePathway.value.endsWith('-491')?15:5)+' 分）' : ' (includes conditional +'+(estimatePathway.value.endsWith('-491')?15:5)+' nomination points)') : '';
        values.push(optionText('estimatePathway') + nominationNote + ': ' + data.get('estimatedScore') + (zh ? ' 分' : ' points')
          + (pointsSnapshot ? '\n\n'+pointsEnquiryModule.formatPointsEnquiry(pointsSnapshot,root.dataset.lang) : ''));
      }
      if(includeNomination.checked&&nominationSnapshot){
        labels.push(zh?'州提名／ROI 自评附件':'State nomination / ROI assessment');
        values.push(pointsEnquiryModule.formatNominationEnquiry(nominationSnapshot,root.dataset.lang));
      }
      const subject = zh ? 'AQYR 网站咨询' : 'AQYR website enquiry';
      const body = labels.map((label, index) => label + ': ' + values[index]).join('\n\n');
      if (event.submitter?.value === 'send') {
        if (sending) return;
        const payload = {
          language: zh ? 'zh' : 'en',
          ...Object.fromEntries(['enquiryType','requestType','name','companyOccupation','email','phone','message','website'].map(name => [name, data.get(name) || ''])),
          ...(includeEstimate.checked ? {
            estimatePathway: estimatePathway.value, estimatedScore: Number(estimatedScore.value),
            ...(pointsSnapshot ? { pointsSnapshot } : {}),
          } : {}),
          ...(includeNomination.checked && nominationSnapshot ? { nominationSnapshot } : {}),
        };
        const encoded = JSON.stringify(payload);
        if (encoded === lastSentPayload) {
          setEnquiryStatus('This enquiry has already been submitted. Edit the form to send a different enquiry.',
            '这份咨询已经提交。若有新内容，请修改后再提交。');
          return;
        }
        if (!verificationToken) {
          setEnquiryStatus('Please complete the security check before submitting.', '请先完成安全验证，再提交咨询。');
          return;
        }
        sending = true;
        const controls = [...form.querySelectorAll('input,select,textarea,button')].map(node => ({ node, disabled: node.disabled }));
        controls.forEach(({ node }) => { node.disabled = true; });
        form.setAttribute('aria-busy', 'true');
        setEnquiryStatus('Submitting your enquiry…', '正在提交咨询……');
        try {
          const response = await fetch('/api/enquiries', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, verificationToken }), signal: AbortSignal.timeout(20000),
          });
          const result = await response.json().catch(() => null);
          if (!response.ok || result?.ok !== true) {
            if (response.status === 429) setEnquiryStatus('Too many submissions or the sending service is busy. Please wait a minute and try again, or use your email app.',
              '提交过于频繁或发信服务繁忙。请稍等一分钟重试，或通过邮件应用联系团队。');
            else if (result?.code === 'verification' || response.status === 403) setEnquiryStatus('We could not verify this submission. Try again or use your email app. Your entries are still here.',
              '暂时未能验证本次提交。请重试，或通过邮件应用联系团队；本次填写内容仍保留在页面中。');
            else if (response.status === 400 || response.status === 413) setEnquiryStatus('Please check your entries and any attached estimate, then try again.',
              '请检查填写内容及附上的自评信息，然后重试。');
            else throw Error('unavailable');
            return;
          }
          lastSentPayload = encoded;
          setEnquiryStatus('Your enquiry has been submitted. Our team will reply using the contact details you provided.',
            '咨询已提交。团队将通过您填写的联系方式回复。');
        } catch {
          setEnquiryStatus('We could not confirm submission. Your entries are still here. Retry, or use the email option below; identical retries will not send duplicate emails within 24 hours.',
            '暂时无法确认提交结果，填写内容仍保留在页面中。可重试或通过邮件方式发送；24 小时内相同内容重试不会重复发信。');
        } finally {
          controls.forEach(({ node, disabled }) => { node.disabled = disabled; });
          form.removeAttribute('aria-busy');
          sending = false;
          verificationToken = '';
          sendButton.disabled = true;
          if (verificationWidget !== undefined) window.turnstile?.reset(verificationWidget);
        }
        return;
      }
      draftText.value = (zh ? '收件人' : 'To') + ': info@hiremiiglobal.com\n' + (zh ? '主题' : 'Subject') + ': ' + subject + '\n\n' + body;
      draftPanel.hidden = false;
      copyDraft.disabled = false;
      if (event.submitter?.value === 'preview') {
        setEnquiryStatus('Your draft is ready below. Review and copy it into your email service. This website has not sent an email.',
          '草稿已在下方生成。请检查后复制到自己的邮箱发送；网站尚未发送邮件。');
        draftText.focus();
        return;
      }
      setEnquiryStatus('Please send the draft from your email app. If it does not open, use the draft below. This website has not sent an email.',
        '请在邮件应用中自行发送草稿。如未打开，可复制下方草稿；网站尚未发送邮件。');
      window.location.href = 'mailto:info@hiremiiglobal.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
    form.querySelector('#enquiry-preview').disabled = false;
    if (sendButton) sendButton.disabled = true;
    if (sendButton && verificationBox && root.dataset.routeLanguage && root.dataset.enquirySitekey) {
      verificationBox.hidden = false;
      window.aqyrEnquiryVerificationReady = () => {
        verificationWidget = window.turnstile.render(verificationBox, {
          sitekey: root.dataset.enquirySitekey, action: 'website_enquiry', size: 'flexible',
          language: root.dataset.lang === 'zh' ? 'zh-CN' : 'en',
          callback: token => { verificationToken = token; if (!sending) sendButton.disabled = false; },
          'expired-callback': () => { verificationToken = ''; sendButton.disabled = true; },
          'error-callback': () => {
            verificationToken = ''; sendButton.disabled = true;
            setEnquiryStatus('The security check could not load. Please try again or use the email option.', '安全验证暂时无法加载，请重试或通过邮件应用联系团队。');
            return true;
          },
        });
      };
      if (window.turnstile) window.aqyrEnquiryVerificationReady();
      else {
        const securityScript = document.createElement('script');
        securityScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=aqyrEnquiryVerificationReady&render=explicit';
        securityScript.async = true; securityScript.defer = true;
        securityScript.onerror = () => setEnquiryStatus('The security check could not load. Please use the email option or try again later.', '安全验证暂时无法加载，请通过邮件应用联系团队或稍后重试。');
        document.head.appendChild(securityScript);
      }
    }
  }

  // Do not re-hide a page someone has already read while slow scripts were loading.
  // The entrance changes only opacity/transform; links and anchor navigation stay available.
  const pageInteractiveAt = performance.getEntriesByType('navigation')[0]?.domInteractive || 0;
  if (!motionPreference.matches && performance.now() - pageInteractiveAt < 1800 && window.scrollY < 40) {
    root.classList.add('entrance-ready');
    window.setTimeout(() => root.classList.remove('entrance-ready'), 1500);
    motionPreference.addEventListener('change', event => {
      if (event.matches) root.classList.remove('entrance-ready');
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
    // Animate reading-sized blocks, never a whole long section or a sticky navigation.
    const moduleMotion = new Map();
    const registerMotion = (selector, effect) => {
      document.querySelectorAll(selector).forEach(node => moduleMotion.set(node, effect));
    };
    registerMotion('main .reveal', 'rise');
    registerMotion('.la-home-entry, .la-explainer', 'fade');
    document.querySelectorAll('.intro, .scene-intro, .experience-track, .case-detailed').forEach(group => {
      moduleMotion.delete(group);
      group.classList.remove('reveal', 'on');
    });
    registerMotion('.intro>div, .intro>p, .planning-heading, .case-group-intro, .case-heading', 'fade');
    registerMotion('.scene-copy', 'side');
    // Marquee logos must stay visible when cloned beyond the reveal observer's initial nodes.
    registerMotion('.scene-photo, .audience, .specialism-card, .office, .comparison-card, .experience-volume, .case-outcome, .la-industry', 'settle');
    registerMotion('.person, .judgement-notes>article, .planning-columns>article, .company-service-columns>article, .experience-insights>article, .case-context, .case-work', 'rise');
    registerMotion('.step', 'side');
    registerMotion('.faq-item, .comparison-wrap, .form-demo, .processing-times-entry, .service-links, .planning-note, .planning-review>p', 'fade');
    registerMotion('.legal-copy>*, .section>.wrap>.label, .section>.wrap>h2, .section>.wrap>.note, .trust-row>*, .cta-inner>*, .footer-main, .footer-compliance, .footer-bottom', 'fade');

    // Neighbouring cards have a small stagger; text never waits in a long queue.
    document.querySelectorAll('.grid2, .grid3, .specialism-grid, .team-support, .partner-grid, .planning-columns, .company-service-columns, .cta-inner, .trust-row, .la-industries').forEach(group => {
      [...group.children].forEach((node, index) => {
        if (moduleMotion.has(node)) node.style.setProperty('--reveal-delay', Math.min(index % 3, 2) * 85 + 'ms');
      });
    });

    const revealNodes = [...moduleMotion.keys()].filter(node => {
      if (node.closest('.hero, .page-jump, .case-directory')) return false;
      // Avoid double movement when a module already includes its own children.
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (moduleMotion.has(parent)) return false;
      }
      return true;
    });
    const showModule = (node, immediate = false) => {
      node.classList.add('on');
      observer.unobserve(node);
      if (immediate) node.classList.remove('reveal');
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) showModule(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    revealNodes.forEach(node => {
      node.classList.add('reveal');
      node.dataset.reveal = moduleMotion.get(node);
      // Return completed cards to their original hover/focus transition rules.
      node.addEventListener('transitionend', event => {
        if (event.target === node && event.propertyName === 'opacity' && node.classList.contains('on')) {
          node.classList.remove('reveal');
        }
      });
      // Already-read content and an initial deep link should never disappear.
      if (node.getBoundingClientRect().top < window.innerHeight) {
        node.classList.add('on');
        node.classList.remove('reveal');
      }
      else observer.observe(node);
    });
    root.classList.add('motion-ready');
    document.addEventListener('focusin', event => {
      revealNodes.forEach(node => {
        if (node.contains(event.target)) showModule(node, true);
      });
    });
    window.addEventListener('hashchange', () => {
      let target;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch { return; }
      if (!target) return;
      revealNodes.forEach(node => {
        if (target.contains(node) || node.contains(target)) showModule(node, true);
      });
    });
    motionPreference.addEventListener('change', event => {
      if (event.matches) {
        root.classList.remove('motion-ready');
        observer.disconnect();
        revealNodes.forEach(node => {
          node.classList.add('on');
          node.classList.remove('reveal');
        });
      }
    });
  }
})();
