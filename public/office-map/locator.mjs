export async function initOfficeMap(host) {
  const fallback = host.nextElementSibling;
  const url = new URL("./locator.html", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw Error("Office map unavailable");
  const content = await response.text();
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = content;
  const base = new URL(".", import.meta.url);
  root
    .querySelector("image")
    .setAttribute("href", new URL("asia-pacific.svg", base).href);
  root.querySelector("#photo").src = new URL(
    "../scenes/melbourne-life-640.webp",
    base,
  ).href;
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL("locator.css", base).href;
  await new Promise((resolve, reject) => {
    style.onload = resolve;
    style.onerror = reject;
    root.prepend(style);
  });

  const data = [
    {
      en: "Melbourne",
      zh: "墨尔本",
      region: ["Victoria, Australia", "澳大利亚 · 维多利亚州"],
      addr: [
        "Office 121, Level 1 / 847 Whitehorse Road, Box Hill VIC 3128, Australia",
        "Office 121, Level 1 / 847 Whitehorse Road, Box Hill VIC 3128, Australia",
      ],
      phone: "+61 430 907 019",
      email: "info@hiremiiglobal.com",
    },
    {
      en: "Perth",
      zh: "珀斯",
      region: ["Western Australia, Australia", "澳大利亚 · 西澳州"],
      addr: [
        "Level 1 / 251 St Georges Terrace, Perth WA 6000, Australia",
        "Level 1 / 251 St Georges Terrace, Perth WA 6000, Australia",
      ],
      phone: "+61 8 6263 7731",
    },
    {
      en: "Shanghai",
      zh: "上海",
      region: ["Shanghai, China", "中国 · 上海"],
      addr: [
        "Room 807A, Building B, Zhongshan SOHO, No. 1065 Zhongshan West Road, Changning District, Shanghai, China",
        "上海市长宁区中山西路 1065 号中山 SOHO B 座 807A 室",
      ],
    },
  ];
  const el = (id) => root.getElementById(id);
  let zh = document.documentElement.lang.startsWith("zh"),
    selected = 0;
  function name(i) {
    return data[i][zh ? "zh" : "en"];
  }
  function row(k, v, uri) {
    if (!v) return "";
    return (
      '<div class="row"><dt>' +
      k +
      "</dt><dd>" +
      (uri ? '<a href="' + uri + '">' + v + "</a>" : v) +
      "</dd></div>"
    );
  }
  function show(i) {
    selected = i;
    const d = data[i],
      l = +zh;
    el("tip").hidden = true;
    el("kind").textContent =
      i === 0 ? (zh ? "总部" : "Headquarters") : zh ? "办公室" : "Office";
    el("city").textContent = name(i);
    el("region").textContent = d.region[l];
    el("photo").hidden = i !== 0;
    el("rows").innerHTML =
      row(zh ? "地址" : "Address", d.addr[l]) +
      row(
        zh ? "电话" : "Phone",
        d.phone,
        d.phone ? "tel:" + d.phone.replace(/ /g, "") : "",
      ) +
      row(zh ? "邮箱" : "Email", d.email, "mailto:" + d.email);
    root.querySelectorAll("[data-id]").forEach((n) => {
      const on = +n.dataset.id === i;
      n.classList.toggle("selected", on);
      n.setAttribute("aria-pressed", on);
    });
  }
  function hover(i) {
    const d = data[i],
      p = root
        .querySelector('.pin[data-id="' + i + '"] .ring')
        .getBoundingClientRect(),
      s = el("stage").getBoundingClientRect(),
      t = el("tip");
    t.children[0].textContent =
      name(i) + (i === 0 ? (zh ? " · 总部" : " · HQ") : "");
    t.children[1].textContent =
      d.phone ||
      (zh
        ? "长宁区 · 中山西路 1065 号"
        : "1065 Zhongshan West Road, Changning");
    t.hidden = false;
    t.style.left =
      Math.max(
        6,
        Math.min(s.width - t.offsetWidth - 6, p.x - s.x - t.offsetWidth - 12),
      ) + "px";
    t.style.top =
      Math.max(
        4,
        Math.min(s.height - t.offsetHeight - 5, p.y - s.y - t.offsetHeight - 9),
      ) + "px";
  }
  function render() {
    el("mapTitle").textContent = zh ? "办公室分布" : "Office locations";
    el("legend").textContent = zh ? "总部" : "Headquarters";
    el("choices").innerHTML = "";
    data.forEach((d, i) => {
      const b = document.createElement("button");
      b.className = "city";
      b.dataset.id = i;
      b.textContent = name(i) + (i === 0 ? (zh ? " · 总部" : " · HQ") : "");
      b.onclick = () => visit(i);
      el("choices").append(b);
      const p = root.querySelector('.pin[data-id="' + i + '"]');
      p.querySelector(".label").textContent = name(i);
      p.setAttribute("aria-label", b.textContent);
      if (i === 0)
        p.querySelector(".tag").textContent = zh ? "总部" : "HEADQUARTERS";
    });
    show(selected);
  }
  root.querySelectorAll(".pin").forEach((p) => {
    const i = +p.dataset.id;
    p.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") hover(i);
    });
    p.addEventListener("pointerleave", () => (el("tip").hidden = true));
    p.addEventListener("focus", () => hover(i));
    p.addEventListener("blur", () => (el("tip").hidden = true));
    p.addEventListener("click", () => visit(i));
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        visit(i);
      }
      if (e.key === "Escape") el("tip").hidden = true;
    });
  });
  // Half-width in Web Mercator metres for each map frame.
  const widths = [2200000, 420000, 75000, 14500, 2800, 560];
  const images = widths.map((_, i) => {
    const img = new Image();
    return img;
  });
  const svg = root.querySelector(".pacific"),
    panel = el("stage"),
    canvas = el("flight"),
    ctx = canvas.getContext("2d");
  let flightState = "overview",
    epoch = 0,
    progress = 0;
  const nav = el("directions");
  const smooth = (t) => t * t * (3 - 2 * t),
    clamp = (t) => Math.min(1, Math.max(0, t));
  function captions() {
    el("back").textContent = zh ? "← 返回网点总览" : "← All offices";
    nav.textContent = zh ? "获取路线 ↗" : "Get directions ↗";
    el("officeLabel").textContent = zh
      ? "AQYR 墨尔本总部"
      : "AQYR Melbourne HQ";
    if (flightState === "local")
      el("mapTitle").textContent = zh
        ? "墨尔本 · Box Hill"
        : "Melbourne · Box Hill";
  }
  function resetMap() {
    ++epoch;
    flightState = "overview";
    progress = 0;
    panel.classList.remove("flying", "local");
    svg.style.transform = "";
    svg.style.opacity = "";
    svg.removeAttribute("inert");
    svg.removeAttribute("aria-hidden");
    canvas.style.opacity = 0;
    for (const id of ["back", "loc", "mapCredit", "directions"])
      el(id).hidden = true;
    el("mapTitle").textContent = zh ? "办公室分布" : "Office locations";
  }
  function paint(t) {
    const w = panel.clientWidth,
      h = panel.clientHeight,
      dpr = Math.min(2, devicePixelRatio || 1);
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const intro = clamp(t / 0.26),
      a = smooth(intro),
      zoom = Math.exp(a * Math.log(3.0));
    const ox = (w * (145.11746 - 83) * 5.1) / 500,
      oy = (h * (55 + 37.81669) * 5.25) / 565;
    svg.style.transform =
      "translate(" +
      ((1 - a) * ox + a * w * 0.5 - zoom * ox) +
      "px," +
      ((1 - a) * oy + a * h * 0.5 - zoom * oy) +
      "px) scale(" +
      zoom +
      ")";
    const blend = smooth(clamp((t - 0.14) / 0.12));
    canvas.style.opacity = blend;
    if (!blend) return;
    const travel = smooth(clamp((t - 0.14) / 0.86)),
      extent =
        widths[0] * Math.exp(Math.log(widths.at(-1) / widths[0]) * travel);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e4e9dc";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < images.length; i++) {
      const scale = widths[i] / extent;
      if (i && scale < 0.67) break;
      ctx.globalAlpha = i ? smooth(clamp((scale - 0.67) / 0.33)) : 1;
      if (images[i].complete && images[i].naturalWidth)
        ctx.drawImage(
          images[i],
          ((1 - scale) * w) / 2,
          ((1 - scale) * h) / 2,
          w * scale,
          h * scale,
        );
    }
    ctx.globalAlpha = 1;
    el("mapCredit").hidden = false;
  }
  async function visit(i) {
    if (i !== 0) {
      resetMap();
      show(i);
      return;
    }
    show(0);
    if (flightState !== "overview") return;
    const seq = ++epoch;
    flightState = "flying";
    panel.classList.add("flying");
    el("back").hidden = false;
    nav.hidden = false;
    captions();
    el("tip").hidden = true;
    el("back").focus({ preventScroll: true });
    svg.setAttribute("inert", "");
    svg.setAttribute("aria-hidden", "true");
    try {
      await Promise.all(
        images.map((im, index) => {
          if (!im.getAttribute("src") || !im.naturalWidth)
            im.src = new URL(
              "melbourne-scale-" + index + ".jpg",
              import.meta.url,
            ).href;
          return im.decode();
        }),
      );
    } catch {
      if (seq === epoch) {
        resetMap();
        nav.hidden = false;
      }
      return;
    }
    if (seq !== epoch) return;
    const start = performance.now(),
      duration = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 3450;
    function frame(now) {
      if (seq !== epoch) return;
      progress = duration ? clamp((now - start) / duration) : 1;
      paint(progress);
      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }
      flightState = "local";
      panel.classList.replace("flying", "local");
      el("loc").hidden = false;
      captions();
    }
    requestAnimationFrame(frame);
  }
  el("back").onclick = () => {
    resetMap();
    root.querySelector('.city[data-id="0"]').focus({ preventScroll: true });
  };
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && flightState !== "overview") el("back").click();
  });
  new ResizeObserver(() => {
    if (flightState === "local") paint(1);
  }).observe(panel);

  function selectAnchor() {
    const index = [
      "#melbourne-office",
      "#perth-office",
      "#shanghai-office",
    ].indexOf(location.hash);
    if (index < 0) return;
    resetMap();
    show(index);
    host.scrollIntoView({ block: "start" });
  }
  render();
  captions();
  new MutationObserver(() => {
    zh = document.documentElement.lang.startsWith("zh");
    render();
    captions();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  window.addEventListener("hashchange", selectAnchor);
  fallback.hidden = true;
  fallback.style.display = 'none';
  host.hidden = false;
  selectAnchor();
}
