import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const base = process.argv[2] || "http://127.0.0.1:3000";
const routes = ["", "about", "employers", "talent", "sponsorship", "approach",
  "stories", "team", "contact", "privacy", "terms"];
const assets = new Set();
const titles = new Set();
const descriptions = new Set();
const packageInfo = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
assert.equal(packageInfo.name, "aqyr-global-services", "Application package name must be plural");
const readme = await readFile(resolve(root, "README.md"), "utf8");
assert.match(readme, /^# AQYR Global Services\r?$/m, "README company name must be plural");
assert.doesNotMatch(readme, /\bAQYR Global Service\b/i);
for (const route of routes) {
  const response = await fetch(base + "/" + route);
  assert.equal(response.status, 200, route + " must load");
  const html = await response.text();
  assert.doesNotMatch(html, /你/, "Chinese copy uses polite address: " + route);
  assert.doesNotMatch(html, /Official guidance checked on|官方指引核对日期|Last updated:|最后更新：/, "No public editorial date labels: " + route);
  assert.match(html, /<title>[^<]*AQYR Global Services/);
  assert.doesNotMatch(html, /\bAQYR Global Service\b/, "Company name must be plural: " + route);
  assert.match(html, /name="description"/);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/name="description" content="([^"]+)"/)?.[1];
  assert(title && description, "Nonempty search metadata: " + route);
  titles.add(title);
  descriptions.add(description);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
  const schema = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json));
  const organization = schema.flatMap((entry) => entry["@graph"] || [entry])
    .find((entry) => entry["@type"] === "Organization" && entry.name === "AQYR Global Services");
  assert(organization, "Company schema: " + route);
  assert.equal(organization.parentOrganization?.name, "AQYR");
  assert.equal(organization.parentOrganization?.url, "https://aqyr.ai");
  assert.match(organization.description, /subsidiary of AQYR/);
  assert.equal(organization.legalName, "HIREMII GLOBAL SERVICES PTY LTD");
  assert.equal(organization.taxID, "23619566040");
  assert.deepEqual(organization.identifier.map(({ propertyID, value }) => [propertyID, value]),
    [["ABN", "23619566040"], ["ACN", "619566040"]]);
  assert(organization.sameAs.includes("https://abr.business.gov.au/ABN/View?abn=23619566040"));
  const graph = schema.flatMap((entry) => entry["@graph"] || [entry]);
  const agent = graph.find((entry) => entry["@id"] === organization.employee["@id"]);
  assert.equal(agent?.["@type"], "Person");
  assert.equal(agent.name, "Yuan Gao");
  assert.equal(agent.alternateName, "Leon Gao");
  assert.equal(agent.worksFor["@id"], organization["@id"]);
  assert.deepEqual(agent.identifier, { "@type": "PropertyValue", propertyID: "MARN", value: "1793302" });
  assert(agent.sameAs.some((url) => url.startsWith("https://portal.mara.gov.au/")));
  const offices = organization.location.map((ref) => graph.find((entry) => entry["@id"] === ref["@id"]));
  assert.equal(offices.length, 3);
  assert.deepEqual(offices.map((office) => office?.address.addressCountry), ["AU", "AU", "CN"]);
  assert.equal(organization.address.postalCode, "3128");
  assert.deepEqual(offices[0].address, organization.address);
  assert.match(html, /property="og:title" content="AQYR Global Services"/);
  assert.match(html, /property="og:image" content="https?:[^\"]*\/share-cover\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /id="main-content"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "One main heading: " + route);
  const source = await readFile(resolve(root, "content", (route || "index") + ".html"), "utf8");
  assert.match(source, /data-en="Global Services"/);
  assert.match(source, /data-aria-label-en="AQYR Global Services home" data-aria-label-zh="AQYR Global Services 首页"/);
  assert.match(source, /data-aria-label-en="Main navigation" data-aria-label-zh="主导航"/);
  assert.match(source, /data-aria-label-en="Legal" data-aria-label-zh="隐私政策与使用条款"/);
  for (const [, image] of source.matchAll(/(<img\b[^>]*src="\/scenes\/[^>]+>)/g)) {
    assert.match(image, /data-alt-en="[^"]+"/);
    assert.match(image, /data-alt-zh="[^"]+"/);
  }
  assert(!/src="https?:/i.test(source), "Images must be hosted locally: " + route);
  assert(!/[↗→↔]/u.test(source), "No emoji-prone text arrows: " + route);
  assert(!/再次确认|待审核|generated portraits|reconfirm roles/i.test(source));
  assert.match(source, /data-en="Individuals &amp; Visas" data-zh="个人与签证服务"/);
  assert.match(source, /A subsidiary of AQYR\./);
  assert.match(source, /AQYR 旗下子公司。/);
  assert(!source.includes("Part of the AQYR group."), "Explicit subsidiary relationship: " + route);
  assert.match(source, /href="\/about"/, "Company introduction link: " + route);
  const primaryNavigation = source.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0];
  assert(primaryNavigation && !primaryNavigation.includes('href="/about"'), "Company introduction remains footer-only: " + route);
  const processingTimesUrl = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times/global-visa-processing-times";
  const footer = source.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  assert(footer && !footer.includes(processingTimesUrl), "Processing-time entry stays out of the footer: " + route);
  assert(!primaryNavigation.includes(processingTimesUrl), "No processing-time item in primary navigation");
  const servedFooter = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  assert(servedFooter && !servedFooter.includes(processingTimesUrl), "Served footer stays uncluttered: " + route);
  if (["talent", "sponsorship"].includes(route)) {
    const processingEntry = source.match(/<div class="processing-times-entry" id="processing-times">[\s\S]*?<\/div>/)?.[0];
    assert(processingEntry, "Lightweight processing-time entry: " + route);
    assert(processingEntry.includes('href="' + processingTimesUrl + '"'));
    assert.match(processingEntry, /target="_blank" rel="noopener noreferrer"/);
    assert.match(processingEntry, /data-aria-label-zh="[^"]*新标签页/);
    assert.match(processingEntry, /data-zh="查询签证参考审理时间"/);
    assert.match(processingEntry, /官方统计仅供参考/);
    assert.equal((source.match(/id="processing-times"/g) || []).length, 1);
    assert(html.includes('class="processing-times-entry"'), "Page entry is served: " + route);
    const entryIndex = source.indexOf('id="processing-times"');
    if (route === "sponsorship") {
      assert(entryIndex > source.indexOf('id="comparison"') && entryIndex < source.indexOf('id="preparation"'), "Entry follows comparison, before preparation");
      assert.match(processingEntry, /雇主提名/);
    } else {
      const otherVisas = source.match(/<section[^>]*id="other-visas"[\s\S]*?<\/section>/)?.[0];
      assert(otherVisas.includes(processingEntry), "Entry stays in other visa services");
      assert(entryIndex > source.indexOf('id="partner-family-visas"'), "Entry follows the visa accordions");
    }
  }
  const compliance = source.match(/<div class="footer-compliance">([\s\S]*?)<\/div>/)?.[1];
  assert(compliance, "Low-key registration details on every page: " + route);
  assert.match(compliance, /ABN 23 619 566 040/);
  assert.match(compliance, /ACN 619 566 040/);
  assert.match(compliance, /MARN 1793302/);
  assert.match(compliance, /Yuan \(Leon\) Gao/);
  assert.match(compliance, /portal\.mara\.gov\.au/);
  assert.match(compliance, /abr\.business\.gov\.au/);
  if (route === "about") {
    assert.match(source, /Prince Migration/);
    assert.match(source, /2017/);
    assert.match(source, /Hiremii Global Services/);
    assert.match(source, /Hiremii Limited \(ASX:HMI\)/);
    assert.match(source, /not a separately listed company/);
    assert.match(source, /HIREMII GLOBAL SERVICES PTY LTD/);
    assert.match(source, /class="section legal-section company-profile"/);
    assert.match(source, /id="company-registration"/);
    assert(!/knowledge graph|AI-powered recruitment platform/i.test(source));
  }
  if (route === "stories") {
    assert.equal((source.match(/class="case-study case-detailed reveal"/g) || []).length, 7);
    assert.equal((source.match(/class="section project-cases"/g) || []).length, 1);
    assert(!/data-zh="历史案例"|SELECTED EXPERIENCE/.test(source), "Cases must share one presentation, not history/experience sections");
    assert.deepEqual([...source.matchAll(/data-case-audience="([^"]+)"/g)].map(([, audience]) => audience),
      ["business", "business", "business", "business", "individual", "individual", "individual"],
      "Business cases must precede individual cases");
    for (const [, article] of source.matchAll(/<article class="case-study case-detailed reveal"[^>]*>([\s\S]*?)<\/article>/g)) {
      assert.match(article, /class="case-context"/);
      assert.match(article, /class="case-work"/);
      assert.match(article, /class="case-outcome"/);
      assert.match(article, /class="case-challenge"/);
      assert.match(article, /data-zh="关键问题"/);
      assert.match(article, /data-zh="处理方法"/);
      assert.match(article, /data-zh="材料依据"/);
    }
    assert.match(source, /Some examples draw on the work of our predecessor, Hiremii Global Services/);
    assert.match(source, /id="historical-cases"/, "Keep earlier case links working");
    assert.match(source, /Nomination approved without a further information request/);
    assert.match(source, /not a visa grant/);
    const caseDirectory = source.match(/<nav class="case-directory"[\s\S]*?<\/nav>/)?.[0];
    assert(caseDirectory, "Cases have a compact reading directory");
    assert.match(source, /class="wrap case-reading-layout"/);
    assert.match(caseDirectory, /class="case-directory-track"/);
    assert.match(source, /<\/nav><div class="case-reading-content">/);
    const caseIds = [...source.matchAll(/<article class="case-study case-detailed reveal"[^>]*id="([^"]+)"/g)]
      .map(([, id]) => id);
    assert.deepEqual([...caseDirectory.matchAll(/href="#(case-[^"]+)"/g)].map(([, id]) => id), caseIds);
    for (const target of ["business-cases", "individual-cases"]) {
      assert(caseDirectory.includes('href="#' + target + '"'));
    }
    assert.match(source, /class="case-group-links"/);
    assert.doesNotMatch(source, /Copy case link|复制案例链接/);
    assert(!/Novatti|Sequoia|HealthLink|Crosstec|AUDD|\$82K|\$105K/i.test(source));
  }
  if (route === "team") {
    assert.match(source, /AQYR Global Services is a subsidiary of AQYR\./);
    assert.match(source, /data-en="Senior Migration Operations Manager" data-zh="高级移民运营经理"/);
    assert.match(source, /data-en="Accounts and Admin Officer" data-zh="账务与行政专员"/);
    assert.doesNotMatch(source, /Clients &amp; Coordination Manager|Accounts &amp; Finance/);
    assert.match(source, /As a registered migration agent/);
    assert.equal((source.match(/class="bio"/g) || []).length, 8);
  }
  if (route === "") {
    const trust = source.match(/<aside class="home-trust"[\s\S]*?<\/aside>/)?.[0];
    assert(trust, "Lightweight home-page evidence strip");
    assert.match(trust, /<strong>200\+<\/strong>/);
    assert.match(trust, /datetime="2026-10-01"/);
    assert.match(trust, /href="\/stories#sponsorship-experience"/);
    assert(source.indexOf(trust) < source.indexOf('data-en="For businesses. For individuals."'), "Evidence is immediately below the hero");
  }
  if (route === "talent") {
    assert.equal((source.match(/class="visa-service-teaser"/g) || []).length, 4);
    assert.equal((source.match(/class="visa-service-icon"/g) || []).length, 4);
    assert.match(source, /id="visitor-visas" open/);
  }
  if (route === "employers") {
    assert.match(source, /id="hiring-review"/);
    assert.equal((source.match(/class="planning-columns"/g) || []).length, 1);
    for (const heading of ["Define the work.", "Consider the available talent.", "Agree a workable next step."]) {
      assert(source.includes('data-en="' + heading + '"'), "Pre-recruitment planning: " + heading);
    }
    assert.match(source, /available market information/);
    for (const topic of ["01 / OVERSEAS HIRES", "02 / SPONSOR RESPONSIBILITIES", "03 / CHANGING RULES"]) {
      assert(source.includes('data-en="' + topic + '"'), "Employer advisory topic: " + topic);
    }
    assert.match(source, /data-zh="全球人才流动，/);
    assert.match(source, /Australian migration requirements/);
    assert.match(source, /employment advisers/);
    assert.match(source, /when it takes effect/);
    assert.equal((source.match(/<details class="faq-item">/g) || []).length, 5);
  }
  if (route === "approach") {
    assert.match(source, /class="judgement-notes"/);
    assert.match(source, /not just the visa category/);
    assert.match(source, /conflicting dates/);
    assert.match(source, /class="case-map" aria-label="How your case is prepared"/);
    assert.equal((source.match(/class="case-map-stage"/g) || []).length, 5, "Five case preparation stages");
    assert.equal((source.match(/aria-pressed="true"/g) || []).length, 1, "One initially selected stage");
    assert.equal((source.match(/data-case-en="/g) || []).length, 5, "Each stage has English detail");
    assert.equal((source.match(/data-case-zh="/g) || []).length, 5, "Each stage has Chinese detail");
    assert.match(source, /id="case-map-detail" class="case-map-detail" aria-live="polite"/);
    assert.deepEqual([...source.matchAll(/<span class="case-map-point[^\"]*">([^<]+)<\/span>/g)]
      .map(([, label]) => label), ["01", "02", "03", "04", "05"]);
    assert.equal((source.match(/class="case-map-line"/g) || []).length, 4, "Four connections between five stages");
    const diagramTitles = [...source.matchAll(/class="case-map-title" data-en="([^"]+)" data-zh="([^"]+)"/g)]
      .map(([, en, zh]) => [en, zh]);
    const detailTitles = [...source.matchAll(/<article class="step reveal">[\s\S]*?<h3 data-en="([^"]+)" data-zh="([^"]+)"/g)]
      .map(([, en, zh]) => [en, zh]);
    assert.deepEqual(diagramTitles, detailTitles, "Diagram and detailed workflow titles match in both languages");
    assert.doesNotMatch(source, /case-map-hint/);
    assert.match(source, /class="case-map-toggle" type="button" aria-label="Pause the five-step process"/);
    assert.equal((source.match(/class="step reveal"/g) || []).length, 5);
  }
  if (route === "contact") {
    assert.match(source, /<textarea[^>]*aria-describedby="enquiry-privacy-hint"/);
    assert.equal((source.match(/id="enquiry-privacy-hint"/g) || []).length, 1);
    assert(source.indexOf('id="enquiry-privacy-hint"') < source.indexOf('class="button enquiry-submit"'),
      "Sensitive-information advice precedes the email action");
    assert.match(source, /Please do not include passport numbers, bank details or full visa documents/);
    assert.match(source, /网站不会自动发送邮件/);
  }
  if (route === "about") {
    assert.match(source, /access to its wider resources/);
    assert.match(source, /可按需要对接集团资源/);
    assert.doesNotMatch(source, /automatically (assess|rank)|AI-driven visa|自动评分|自动处理签证/i);
  }
  if (route === "sponsorship") {
    assert.match(source, /class="sponsorship-guide"/);
    assert.match(source, /class="sponsorship-content"/);
    const directory = source.match(/<nav class="page-jump"[\s\S]*?<\/nav>/)?.[0];
    assert(directory, "Sponsorship reading directory remains accessible");
    for (const target of ["visa-482", "visa-186", "comparison", "preparation", "sponsorship-faq"]) {
      assert(directory.includes('href="#' + target + '"'), "Directory link: " + target);
      assert(source.includes('id="' + target + '"'), "Directory target remains in full content: " + target);
    }
    for (const id of ["sponsorship-stages", "482-requirements", "186-de-requirements",
      "186-trt-requirements", "employer-documents"]) {
      assert(source.includes('class="faq-item" id="' + id + '"'), "Practical sponsorship FAQ: " + id);
    }
    assert.match(source, /core-skills-stream/);
    assert.match(source, /direct-entry-stream/);
    assert.match(source, /temporary-residence-transition-stream/);
    for (const id of ["482-requirements", "186-de-requirements", "186-trt-requirements"]) {
      assert(html.includes('class="visa-english-summary"'), "Rendered page includes current English score summary");
      const english = source.match(new RegExp('<details[^>]*id="' + id + '"[\\s\\S]*?<\\/details>'))?.[0];
      assert.match(english, /class="visa-english-summary"/);
      assert.match(english, /<dt>IELTS<\/dt>/);
      assert.match(english, /<dt>PTE Academic<\/dt>/);
      if (id === "482-requirements") {
        assert.match(english, /At least 5\.0 in each/);
        assert.match(english, /listening 33, reading 36, writing 29 and speaking 24/);
        assert.match(english, /13 September 2025/);
        assert.match(english, /PTE requires overall 36 and each skill 36/);
        assert.match(english, /skills-in-demand-visa-subclass-482\/sufficient-english/);
      } else {
        assert.match(english, /At least 6\.0 in each/);
        assert.match(english, /listening 47, reading 48, writing 51 and speaking 54/);
        assert.match(english, /7 August 2025/);
        assert.match(english, /each skill must be at least 50/);
        assert.match(english, /english-language\/competent-english/);
      }
    }
    const comparison = source.match(/<section[^>]*id="comparison"[\s\S]*?<\/section>/)?.[0];
    assert(comparison, "Sponsorship pathway comparison remains available");
    assert.match(comparison, /class="visa-transition-note"/);
    assert.match(comparison, /separate 186 TRT application/);
    assert.match(comparison, /并非自动转为永居/);
    for (const className of ["comparison-desktop", "comparison-cards"]) {
      const block = comparison.slice(comparison.indexOf(className));
      assert.match(block, /no prior 482 required/);
      assert.match(block, /former 457 primary holder, or qualifying bridging visa holder/);
    }
    const trt = source.match(/<details[^>]*id="186-trt-requirements"[\s\S]*?<\/details>/)?.[0];
    assert.match(trt, /不能直接从 TRT 起步/);
    assert.match(trt, /in Australia (?:&lt;strong class=&quot;visa-timing&quot;&gt;|<strong class="visa-timing">)in the three years before applying/);
    for (const [id, english, chinese] of [
      ["482-requirements", "at least one year", "至少一年"],
      ["186-de-requirements", "at least three years", "至少三年"],
      ["186-trt-requirements", "at least two years", "申请前的三年内累计至少两年"],
      ["186-trt-requirements", "in the three years before applying", "申请前的三年内累计至少两年"],
    ]) {
      const answer = source.match(new RegExp('<details[^>]*id="' + id + '"[\\s\\S]*?<\\/details>'))?.[0];
      assert(answer, "Visa time requirement question remains available: " + id);
      for (const phrase of [english, chinese]) {
        assert(answer.includes('&lt;strong class=&quot;visa-timing&quot;&gt;' + phrase + '&lt;/strong&gt;'), "Bilingual time emphasis: " + phrase);
      }
      assert(answer.includes('<strong class="visa-timing">' + english + '</strong>'), "Initial English time emphasis: " + english);
    }
  }
  if (route === "talent") {
    for (const id of ["visitor-visas", "student-visas", "skilled-visas", "partner-family-visas"]) {
      const block = source.match(new RegExp('<details[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</details>'))?.[1];
      assert(block, "Individual visa guide: " + id);
      for (const heading of ["When to get in touch", "How we can help", "Before our first conversation"]) {
        assert(block.includes('data-en="' + heading + '"'), id + ": " + heading);
      }
      assert.match(block, /data-zh=/);
      assert.match(block, /https:\/\/immi\.homeaffairs\.gov\.au\//);
      assert.match(block, /href="\/contact\?service=/);
    }
  }
  for (const [, src] of source.matchAll(/<img[^>]*src="([^"]+)"/g)) assets.add(src);
  for (const [, candidates] of source.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of candidates.split(",")) assets.add(candidate.trim().split(/\s+/)[0]);
  }
  const alias = route ? "/" + route + ".html" : "/index.html";
  const redirect = await fetch(base + alias + "?service=sponsorship", { redirect: "manual" });
  assert.equal(redirect.status, 308, "Legacy URL redirect: " + alias);
  assert.equal(new URL(redirect.headers.get("location"), base).pathname, "/" + route);
  assert.equal(new URL(redirect.headers.get("location"), base).searchParams.get("service"), "sponsorship");
}
assert.equal(titles.size, routes.length, "Every page has a unique search title");
assert.equal(descriptions.size, routes.length, "Every page has a unique search description");
for (const src of assets) {
  await access(resolve(root, "public", src.replace(/^\//, "")));
  assert.equal((await fetch(base + src)).status, 200, "Asset: " + src);
}
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length);
assert(!sitemap.includes(".html"));
assert.match(await (await fetch(base + "/robots.txt")).text(), /Sitemap:/);
const script = await readFile(resolve(root, "public", "script.js"), "utf8");
assert.doesNotMatch(script, /你/, "Runtime Chinese copy uses polite address");
assert.equal(script, await readFile(resolve(root, "script.js"), "utf8"), "Preview script must match deployed script");
assert.match(script, /mailto:info@hiremiiglobal.com/);
assert.match(script, /caseMapStages\.forEach/);
assert.match(script, /const caseMapInterval = 5000/);
assert.match(script, /\(caseMapIndex \+ 1\) % caseMapStages\.length/);
assert.match(script, /caseMap\.contains\(document\.activeElement\)/);
assert.match(script, /document\.addEventListener\('visibilitychange', scheduleCaseMap\)/);
assert.match(script, /caseMapDetail\.setAttribute\('aria-live', manual \? 'polite' : 'off'\)/);
assert.match(script, /siteHeader\?\.classList\.toggle\('is-compact'/);
assert.match(script, /motionPreference\.matches/);
assert.match(script, /node\.dataset\.ariaLabelZh/);
assert.match(script, /node\.dataset\.altZh/);
const sharedStyles = await readFile(resolve(root, "style.css"), "utf8");
assert.match(sharedStyles, /--focus-on-dark:#b8edcf/);
assert.match(sharedStyles, /outline-color:var\(--focus-on-dark\)/);
assert.match(sharedStyles, /\.legal-copy\{max-width:68ch\}/);
assert.match(sharedStyles, /border:1px solid var\(--field-border\)/);
new Function(script);
const coverResponse = await fetch(base + "/share-cover.png");
const logo = await readFile(resolve(root, "public/aqyr-logo.svg"), "utf8");
assert.match(logo, /viewBox="0 0 277.28 109.71"/, "Official logo retains its clear space");
assert.match(logo, /#1f4434/i);
assert.match(logo, /#45c487/i);
assert.equal(coverResponse.status, 200);
assert.match(coverResponse.headers.get("content-type"), /image\/png/);
const cover = Buffer.from(await coverResponse.arrayBuffer());
assert.equal(cover.subarray(1, 4).toString(), "PNG");
assert.equal(cover.readUInt32BE(16), 1200);
assert.equal(cover.readUInt32BE(20), 630);
console.log(`PASS: ${routes.length} pages, unique search metadata, company introduction, 7 unified case studies with businesses before individuals, subsidiary relationship, branded share image, navigation, redirects, sitemap, robots, responsive local images and shared runtime.`);
