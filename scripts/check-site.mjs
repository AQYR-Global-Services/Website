import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { loadPageSource } from "../lib/content-source.mjs";

const root = resolve(import.meta.dirname, "..");
const base = process.argv[2] || "http://127.0.0.1:3000";
const routes = ["", "about", "employers", "visa-services", "employer-sponsorship", "sponsored-visas", "labour-agreements", "approach",
  "case-studies", "team", "contact", "privacy", "terms", "points-calculator"];
const assets = new Set();
const titles = new Set();
const descriptions = new Set();
const footerTemplates = new Set();
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
  assert.match(title, /^AQYR Global Services — .+/, "Browser title leads with the company name: " + route);
  assert.match(html, /<link[^>]+rel="icon"[^>]+href="\/aqyr-favicon.webp"/);
  assert.doesNotMatch(html, /rel="icon"[^>]*aqyr-github-avatar/);
  const description = html.match(/name="description" content="([^"]+)"/)?.[1];
  assert(title && description, "Nonempty search metadata: " + route);
  titles.add(title);
  descriptions.add(description);
  assert.match(html, /rel="canonical"/);
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
  assert(canonical, "Canonical URL is present: " + route);
  assert.equal(new URL(canonical).pathname, "/" + route, "Canonical follows the public route: " + route);
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
  assert.equal(organization.address.streetAddress, "Office 121, Level 1 / 847 Whitehorse Road");
  assert.equal(offices[1].address.streetAddress, "Level 1 / 251 St Georges Terrace");
  assert.equal(offices[1].address.postalCode, "6000");
  assert.equal(offices[1].telephone, "+61 8 6263 7731");
  assert.equal(offices.find((office) => office.name.endsWith("Shanghai office"))?.telephone, undefined);
  assert.doesNotMatch(html, /137\s*6139\s*5387/);
  assert.deepEqual(offices[0].address, organization.address);
  assert.match(html, /property="og:title" content="AQYR Global Services"/);
  assert.match(html, /property="og:image" content="https?:[^\"]*\/share-cover\.png"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /id="main-content"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "One main heading: " + route);
  const source = loadPageSource((route || "index") + ".html", root);
  assert.match(source, /<title>AQYR Global Services — [^<]+<\/title>/);
  assert.match(source, /rel="icon"[^>]+href="\/aqyr-favicon.webp"/);
  if (route === "") {
    const notice = source.match(/<p class="brand-transition"[^>]*>[\s\S]*?<\/p>/)?.[0];
    assert(notice, "Homepage has a quiet brand-transition notice");
    assert.match(notice, /data-en="Hiremii Global Services is now AQYR Global Services\."/);
    assert.match(notice, /data-zh="Hiremii Global Services 现已更名为 AQYR Global Services。"/);
    assert.doesNotMatch(notice, /邮箱|@|email/i);
    assert(source.indexOf(notice) > source.indexOf('<div class="actions">'));
    assert(source.indexOf(notice) < source.indexOf('<figure class="hero-photo'));
    assert.match(html, /class="brand-transition"/);
    const partnerLinks = [...source.matchAll(/<a class="partner-logo[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map(([link]) => link);
    assert.equal(partnerLinks.length, 6, "All six partner logos link to official sites");
    for (const link of partnerLinks) {
      assert.match(link, /href="https:\/\//);
      assert.match(link, /target="_blank" rel="noopener noreferrer"/);
      assert.match(link, /data-aria-label-zh="[^"]*新标签页/);
    }
  } else {
    assert(!source.includes('class="brand-transition"'), "Rename notice is homepage-only");
  }
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
  assert.match(source, /data-en="Individual Services" data-zh="个人服务"/);
  assert.match(source, /A subsidiary of AQYR\./);
  assert.match(source, /AQYR 旗下子公司。/);
  assert(!source.includes("Part of the AQYR group."), "Explicit subsidiary relationship: " + route);
  assert.match(source, /href="\/about"/, "Company introduction link: " + route);
  const primaryNavigation = source.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0];
  assert(primaryNavigation && primaryNavigation.includes('href="/about"'), "Company introduction is available in About Us: " + route);
  assert.deepEqual([...primaryNavigation.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    ["/employers", "/employer-sponsorship", "/labour-agreements", "/sponsored-visas", "/visa-services", "/points-calculator", "/about", "/approach", "/case-studies", "/team", "/contact"],
    "Navigation groups business, individual and company routes: " + route);
  assert.equal((primaryNavigation.match(/<details class="nav-group">/g) || []).length, 3, "Three native dropdown groups plus Contact");
  assert.match(primaryNavigation, /data-en="Employer Services" data-zh="企业服务"/);
  assert.match(primaryNavigation, /data-en="About Us" data-zh="关于我们"/);
  assert.match(primaryNavigation, /data-en="Labour agreements" data-zh="企业劳工协议"/);
  const processingTimesUrl = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times/global-visa-processing-times";
  const footer = source.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  footerTemplates.add(footer);
  const nzAdviserLink = footer.match(/<a class="footer-licence" href="https:\/\/immigrationadviser\.co\.nz\/adviser\/yuan-gao"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert(nzAdviserLink, "New Zealand adviser details appear in every footer: " + route);
  assert.match(nzAdviserLink, /target="_blank" rel="noopener noreferrer"/);
  assert.match(nzAdviserLink, /data-aria-label-zh="[^"]*新标签页/);
  assert.match(nzAdviserLink, /新西兰持牌移民顾问：Yuan（Leon）Gao · /);
  assert.match(nzAdviserLink, /NZ licensed immigration adviser: Yuan \(Leon\) Gao · /);
  assert.match(nzAdviserLink, /<span class="visa-code">IAA 202603585<\/span>/);
  assert(footer.indexOf(nzAdviserLink) > footer.indexOf("MARN 1793302"), "NZ details follow MARN registration");
  const footerServices = footer.match(/<div class="footer-services"[\s\S]*?<\/div>/)?.[0];
  assert(footerServices, "Grouped footer services: " + route);
  assert.deepEqual([...footerServices.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
    ["/employers", "/employer-sponsorship", "/labour-agreements", "/sponsored-visas", "/visa-services", "/points-calculator"], "Footer follows service architecture: " + route);
  assert.match(footer, /class="footer-company" role="navigation"/);
  assert.match(footer, /class="footer-contact"[\s\S]*?href="\/contact"/);
  assert.doesNotMatch(footerServices, /Skills in Demand|Direct Entry|TRT/);
  assert(footer && !footer.includes(processingTimesUrl), "Processing-time entry stays out of the footer: " + route);
  assert(!primaryNavigation.includes(processingTimesUrl), "No processing-time item in primary navigation");
  const servedFooter = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  assert(servedFooter && !servedFooter.includes(processingTimesUrl), "Served footer stays uncluttered: " + route);
  const linkedInUrl = "https://au.linkedin.com/company/aqyr-global-services";
  const linkedInLink = footer.match(/<a class="footer-social-link"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert(linkedInLink, "LinkedIn icon in every footer: " + route);
  assert.match(footer, /<strong data-en="Get in touch"[^>]*>[\s\S]*?href="tel:\+61430907019"[^>]*>[\s\S]*?<\/a><div class="footer-socials"><a class="footer-social-link"/);
  assert.doesNotMatch(footer.match(/<div class="footer-brand">[\s\S]*?<\/div>/)?.[0] || "", /footer-social-link/);
  assert(linkedInLink.includes('href="' + linkedInUrl + '"'));
  assert.match(linkedInLink, /target="_blank" rel="noopener noreferrer"/);
  assert.match(linkedInLink, /data-aria-label-en="[^"]*LinkedIn[^"]*new tab/);
  assert.match(linkedInLink, /data-aria-label-zh="[^"]*LinkedIn[^"]*新标签页/);
  assert.match(linkedInLink, /<svg[^>]*aria-hidden="true"/);
  const facebookUrl = "https://www.facebook.com/profile.php?id=61595664925410";
  const socialLinks = [...footer.matchAll(/<a class="footer-social-link"[^>]*>[\s\S]*?<\/a>/g)].map(([link]) => link);
  assert.equal(socialLinks.length, 2, "LinkedIn and Facebook appear once in each footer");
  const facebookLink = socialLinks[1];
  assert(facebookLink.includes('href="' + facebookUrl + '"'));
  assert.match(facebookLink, /target="_blank" rel="noopener noreferrer"/);
  assert.match(facebookLink, /data-aria-label-en="[^\"]*Facebook[^\"]*new tab/);
  assert.match(facebookLink, /data-aria-label-zh="[^\"]*Facebook[^\"]*新标签页/);
  assert.match(facebookLink, /<svg[^>]*aria-hidden="true"/);
  assert.equal((servedFooter.match(/class="footer-social-link"/g) || []).length, 2);
  assert(servedFooter.includes(facebookUrl));
  assert(servedFooter.includes(linkedInUrl));
  if (["visa-services", "employer-sponsorship", "sponsored-visas"].includes(route)) {
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
    if (route !== "visa-services") {
      assert(entryIndex > source.indexOf('id="pathway-comparison"') && entryIndex < source.indexOf('id="what-to-prepare"'), "Entry follows comparison, before preparation");
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
  if (route === "case-studies") {
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
    assert.doesNotMatch(source, /class="case-legacy-anchor"|id="historical-cases"/, "No pre-launch compatibility anchors");
    assert.match(source, /Nomination approved without a further information request/);
    assert.match(source, /not a visa grant/);
    const caseDirectory = source.match(/<nav class="case-directory"[\s\S]*?<\/nav>/)?.[0];
    assert(caseDirectory, "Cases have a compact reading directory");
    assert.match(source, /class="wrap case-reading-layout"/);
    assert.match(caseDirectory, /class="case-directory-track"/);
    assert.match(source, /<\/nav><div class="case-reading-content">/);
    const caseIds = [...source.matchAll(/<article class="case-study case-detailed reveal"[^>]*id="([^"]+)"/g)]
      .map(([, id]) => id);
    assert.deepEqual([...caseDirectory.matchAll(/<li><a href="#([^"]+)"/g)].map(([, id]) => id), caseIds);
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
    assert.match(source, /data-en="Accounts &amp; Admin Officer" data-zh="账务与行政专员"/);
    assert.doesNotMatch(source, /Clients &amp; Coordination Manager|Accounts &amp; Finance/);
    assert.match(source, /As a registered migration agent/);
    assert.equal((source.match(/class="bio"/g) || []).length, 14);
    const teamNames = [...source.matchAll(/<article class="person[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g)].map(([, name]) => name);
    assert.deepEqual(teamNames, ["Leon Gao", "Andrew Hornby", "Christ Flint", "Gareth Bibby", "Romeo Ye", "Ferris Jin", "Flora Zhang", "Belle Zhang", "Dave Yang", "Sam Cui", "Quinten Li", "Yuyan Zhu", "Catherian Zhang", "Barry Zhang"]);
    assert.equal((source.match(/data-en="Executive Director"/g) || []).length, 1);
    for (const name of ['Andrew Hornby','Christ Flint']) assert(source.includes('<h3>'+name+'</h3><p class="role" data-en="Director" data-zh="董事">Director</p>'));
    assert.match(source, /id="team-directors-title" data-en="Our directors" data-zh="董事团队"/);
    assert.match(source, /data-en="Principal Consultant" data-zh="首席顾问"/);
    assert.match(source, /20 years of international recruitment/);
    assert.doesNotMatch(source, /class="person-about"/);
    assert.equal((source.match(/person-spotlight"/g) || []).length, 3);
    assert.match(source, /class="portrait-mirrored" src="\/team\/ferris-jin-unified-480\.webp"/);
    assert.match(source, /data-en="APAC Office Manager" data-zh="亚太办公室经理"/);
    assert.doesNotMatch(source, /Shanghai Office Manager|上海办公室经理/);
    for (const slug of ["andrew-hornby", "christ-flint", "ferris-jin", "yuyan-zhu", "gareth-bibby"]) {
      assert(source.includes(`/team/${slug}-unified-480.webp`));
    }
    assert.match(source, /data-en="Automation &amp; Digital Specialist" data-zh="自动化与数字化专员"/);
    assert.match(source, /id="barry-zhang"/);
    assert.match(source, /automation and digital marketing/);
    assert.match(html, /\/team\/barry-zhang-unified-480\.webp/);
    assert.match(html, /class="portrait-mirrored" src="\/team\/romeo-ye-unified-480\.webp"/);
    assert.doesNotMatch(source.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "", /202603585|person-credentials/);
  }
  if (route === "") {
    const trust = source.match(/<aside class="home-trust"[\s\S]*?<\/aside>/)?.[0];
    assert(trust, "Lightweight home-page evidence strip");
    assert.match(trust, /<strong>200\+<\/strong>/);
    assert.match(trust, /datetime="2026-10-01"/);
    assert.match(trust, /href="\/case-studies#sponsorship-experience"/);
    assert(source.indexOf(trust) < source.indexOf('data-en="For businesses. For individuals."'), "Evidence is immediately below the hero");
    const employerEntry = source.match(/<article class="audience reveal">[\s\S]*?data-en="EMPLOYER SOLUTIONS"[\s\S]*?<\/article>/)?.[0];
    assert.match(employerEntry, /class="card-link audience-secondary-link" href="\/labour-agreements"/);
    assert.match(employerEntry, /data-zh="持续存在招聘缺口？了解企业劳工协议"/);
    assert(employerEntry.indexOf('href="/employers"') < employerEntry.indexOf('href="/labour-agreements"'), "Labour agreement entry follows the main employer action");
  }
  if (route === "visa-services") {
    const skilledGuide = source.match(/<details class="faq-item visa-service" id="skilled-visas">[\s\S]*?<\/details>/)?.[0];
    assert.match(skilledGuide, /href="\/points-calculator"/, "Skilled migration links to the calculator");
    assert.equal((source.match(/class="visa-service-teaser"/g) || []).length, 4);
    assert.equal((source.match(/class="visa-service-icon"/g) || []).length, 4);
    assert.match(source, /id="visitor-visas" open/);
  }
  if (route === "points-calculator") {
    assert.match(source, /id="points-calculator"/);
    assert.match(source, /id="points-form"/);
    assert.match(source, /id="pc-live-score" aria-live="polite"/);
    assert.match(source, /data-pc-vpt hidden/);
    assert.match(source, /Rule snapshot: 15 October 2026/);
    assert.match(source, /NSW considers occupation-group ranking/);
    for (const modulePath of ["/points-rules.mjs", "/points-calculator.mjs", "/occupation-search.mjs", "/occupation-picker.mjs", "/anzsco-2013.mjs"]) {
      const moduleResponse = await fetch(base + modulePath);
      assert.equal(moduleResponse.status, 200, modulePath + " must load");
      assert.match(moduleResponse.headers.get("content-type"), /javascript/);
    }
  }
  if (["", "employers", "employer-sponsorship"].includes(route)) {
    assert.match(source, /href="\/labour-agreements(?:#visa-pathways)?"/, "Labour agreement entry: " + route);
  }
  if (route === "employers") {
    assert(source.indexOf('id="labour-agreements"') < source.indexOf('id="business-support"'));
    assert(source.indexOf('id="labour-agreements"') < source.indexOf('class="faq-list"'), "Labour agreement service appears before employer FAQs");
    assert.equal((source.match(/class="section la-employer-section"/g) || []).length, 1, "Employer page reuses one labour agreement section");
  }
  if (route === "employer-sponsorship") {
    assert.match(source, /href="#labour-agreements"/);
    assert(source.indexOf('id="labour-agreements"') < source.indexOf('id="pathway-comparison"'));
  }
  if (route === "labour-agreements") {
    assert.match(source, /class="sponsorship-guide labour-guide"/);
    assert.match(source, /class="sponsorship-content labour-content"/);
    const labourDirectory = source.match(/<nav class="page-jump"[\s\S]*?<\/nav>/)?.[0];
    assert(labourDirectory, "Labour agreement reading index is present");
    assert.match(labourDirectory, /class="page-jump-label"/);
    assert.doesNotMatch(labourDirectory, /<svg/);
    for (const id of ["workforce-needs", "agreement-options", "visa-pathways", "our-support", "first-conversation", "faq"]) {
      assert(source.includes('id="' + id + '"'), "Labour agreement section: " + id);
    }
    for (const code of ["482", "186", "494"]) {
      assert(source.includes('id="visa-' + code + '"'));
      assert.match(source, new RegExp('Home Affairs: ' + code + ' Labour Agreement'));
    }
    assert.match(source, /This is separate from Direct Entry and TRT/);
    assert.match(source, /It is not permanent residence/);
    assert.match(source, /not an automatic grant/);
    assert.match(source, /Not every agreement covers all three visas\./);
    assert.match(source, /协议不一定涵盖全部三类签证。/);
    assert.match(source, /Regional endorsement is required/);
    assert.match(source, /For employers across industries/);
    assert.doesNotMatch(source.match(/<main[\s\S]*?<\/main>/)?.[0] || "", /construction|renewable energy|meat processing|建筑|新能源|肉类加工/i);
    assert.doesNotMatch(source.match(/<main[\s\S]*?<\/main>/)?.[0] || "", /200\+|success rate|market leader|successful labour agreement|老板|Leon|Romeo/);
    assert.match(source, /href="\/contact\?service=labour-agreement#enquiry"/);
    assert.match(source, /Concessions|concessions/);
  }
  if (route === "contact") {
    assert.match(html, /href="tel:\+61862637731">\+61 8 6263 7731<\/a>/);
    assert.doesNotMatch(source, /61394154000|9415 4000/);
    assert.match(source, /<option value="labour-agreement" data-en="Labour agreement" data-zh="企业劳工协议">/);
    assert.match(source, /id="labour-enquiry-hint" hidden/);
  }
  if (route === "employers") {
    assert.match(source, /id="hiring-review"/);
    assert.equal((source.match(/class="planning-columns"/g) || []).length, 1);
    for (const heading of ["Define the work.", "Consider the available talent.", "Agree the next step."]) {
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
    assert.match(html, /Office 121, Level 1 \/ 847 Whitehorse Road<br\s*\/?>(?:<!--[^>]*-->)*Box Hill VIC 3128/);
    assert.match(html, /Level 1 \/ 251 St Georges Terrace<br\s*\/?>(?:<!--[^>]*-->)*Perth WA 6000/);
    assert.doesNotMatch(source, /L1\/251 St Georges Tce|Box Hill, Victoria 3128/);
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
  if (["employer-sponsorship", "sponsored-visas"].includes(route)) {
    const rawPage = await readFile(resolve(root, "content", route + ".html"), "utf8");
    for (const shared of ["visa-pathways", "pathway-comparison", "482-requirements", "186-de-requirements", "186-trt-requirements"]) {
      assert(rawPage.includes('<!-- include:sponsorship:' + shared + ' -->'), "Visa facts come from one shared source: " + route + ":" + shared);
    }
    assert.doesNotMatch(html, /<!-- include:/, "Shared facts are rendered on the server");
    const pageMain = rawPage.match(/<main[\s\S]*?<\/main>/)?.[0];
    if (route === "employer-sponsorship") {
      assert.match(pageMain, /data-zh="企业雇主担保"/);
      assert.match(pageMain, /id="business-readiness"/);
      assert.match(pageMain, /id="nomination-preparation"/);
      assert.match(pageMain, /audience=employer/);
      assert.match(pageMain, /href="\/case-studies#business-cases"/);
    } else {
      assert.match(pageMain, /data-zh="个人雇主担保"/);
      assert.match(pageMain, /id="starting-point"/);
      assert.match(pageMain, /I have an employer/);
      assert.match(pageMain, /I am looking for an employer/);
      assert.match(pageMain, /cannot be guaranteed/);
      assert.match(pageMain, /audience=individual/);
      assert.match(pageMain, /href="\/case-studies#individual-cases"/);
    }
    assert.match(source, /class="sponsorship-guide"/);
    assert.match(source, /class="sponsorship-content"/);
    const directory = source.match(/<nav class="page-jump"[\s\S]*?<\/nav>/)?.[0];
    assert(directory, "Sponsorship reading directory remains accessible");
    for (const target of ["visa-482", "visa-186", "pathway-comparison", "what-to-prepare", "faq"]) {
      assert(directory.includes('href="#' + target + '"'), "Directory link: " + target);
      assert(source.includes('id="' + target + '"'), "Directory target remains in full content: " + target);
    }
    const requiredQuestions = ["482-requirements", "186-de-requirements", "186-trt-requirements"];
    if (route === "employer-sponsorship") requiredQuestions.push("sponsorship-stages", "employer-documents");
    for (const id of requiredQuestions) {
      assert(source.includes('class="faq-item" id="' + id + '"'), "Practical sponsorship FAQ: " + id);
    }
    assert.match(source, /core-skills-stream/);
    assert.match(source, /direct-entry-stream/);
    assert.match(source, /temporary-residence-transition-stream/);
    for (const id of ["482-requirements", "186-de-requirements", "186-trt-requirements"]) {
      assert(html.includes('class="visa-english-summary"'), "Rendered page includes current English score summary");
      const english = source.match(new RegExp('<details[^>]*id="' + id + '"[\\s\\S]*?<\\/details>'))?.[0];
      assert.match(english, /class="visa-english-summary"/);
      const panelId = id + '-english';
      assert(english.includes('aria-controls="' + panelId + '" aria-expanded="true" disabled'), "Progressively enhanced inline English control: " + id);
      assert(english.includes('id="' + panelId + '" role="region" aria-labelledby="' + panelId + '-heading"'), "English panel has an accessible heading: " + id);
      const panel = english.match(/<div class="visa-english-summary"[\s\S]*?<p class="visa-guide-source">[\s\S]*?<\/p><\/div>/)?.[0];
      assert(panel, "Official English source stays inside the on-demand panel: " + id);
      assert(!panel.includes(' hidden'), "English requirements stay readable without JavaScript");
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
    const comparison = source.match(/<section[^>]*id="pathway-comparison"[\s\S]*?<\/section>/)?.[0];
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
  if (route === "visa-services") {
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
  for (const [, href] of source.matchAll(/<a\b[^>]*href="([/#][^"]*)"/g)) {
    const target = new URL(href.replaceAll("&amp;", "&"), base + "/" + route);
    const slug = target.pathname.replace(/^\//, "");
    assert(routes.includes(slug), "Internal route exists: " + href);
    if (target.hash) {
      const targetSource = slug === route ? source : loadPageSource((slug || "index") + ".html", root);
      assert(targetSource.includes('id="' + decodeURIComponent(target.hash.slice(1)) + '"'), "Internal anchor exists: " + href);
    }
  }
  for (const [, candidates] of source.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of candidates.split(",")) assets.add(candidate.trim().split(/\s+/)[0]);
  }
  const alias = route ? "/" + route + ".html" : "/index.html";
  const aliasResponse = await fetch(base + alias, { redirect: "manual" });
  assert.equal(aliasResponse.status, 404, "Static preview aliases are not public routes: " + alias);
}
for (const oldRoute of ["talent", "stories", "sponsorship"]) {
  const oldResponse = await fetch(base + "/" + oldRoute, { redirect: "manual" });
  assert.equal(oldResponse.status, 404, "Retired pre-launch route has no redirect: " + oldRoute);
}
assert.equal(titles.size, routes.length, "Every page has a unique search title");
assert.equal(footerTemplates.size, 1, "All pages share the same footer architecture");
assert.equal(descriptions.size, routes.length, "Every page has a unique search description");
for (const src of assets) {
  await access(resolve(root, "public", src.replace(/^\//, "")));
  assert.equal((await fetch(base + src)).status, 200, "Asset: " + src);
}
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length);
assert(!sitemap.includes(".html"));
for (const route of routes) {
  assert([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].some(([, url]) => new URL(url).pathname === "/" + route), "Sitemap includes the new public route: " + route);
}
assert.match(await (await fetch(base + "/robots.txt")).text(), /Sitemap:/);
const script = await readFile(resolve(root, "public", "script.js"), "utf8");
assert.doesNotMatch(script, /你/, "Runtime Chinese copy uses polite address");
assert.equal(script, await readFile(resolve(root, "script.js"), "utf8"), "Preview script must match deployed script");
assert.match(script, /mailto:info@hiremiiglobal.com/);
assert.match(script, /requestedService === 'labour-agreement'/);
assert.match(script, /requestSelect\.addEventListener\('change', updateLabourHint\)/);
assert.match(script, /caseMapStages\.forEach/);
assert.match(script, /const caseMapInterval = 3000/);
assert.match(script, /\(caseMapIndex \+ 1\) % caseMapStages\.length/);
assert.match(script, /caseMap\.contains\(document\.activeElement\)/);
assert.match(script, /document\.addEventListener\('visibilitychange', scheduleCaseMap\)/);
assert.match(script, /caseMapDetail\.setAttribute\('aria-live', manual \? 'polite' : 'off'\)/);
assert.match(script, /siteHeader\?\.classList\.toggle\('is-compact'/);
assert.match(script, /motionPreference\.matches/);
assert.match(script, /!motionPreference\.matches && performance\.now\(\) - pageInteractiveAt < 1800 && window\.scrollY < 40/);
assert.match(script, /root\.classList\.add\('entrance-ready'\)/);
assert.match(script, /root\.classList\.remove\('entrance-ready'\), 1500/);
assert.match(script, /const moduleMotion = new Map\(\)/);
assert.match(script, /registerMotion\('\.legal-copy>\*/);
assert.match(script, /registerMotion\('\.faq-item, \.comparison-wrap, \.form-demo[^']*', 'fade'\)/);
assert.match(script, /registerMotion\('\.step', 'side'\)/);
assert.match(script, /node\.closest\('\.hero, \.page-jump, \.case-directory'\)/);
assert.match(script, /moduleMotion\.has\(parent\)/);
assert.match(script, /observer\.unobserve\(node\)/);
assert.match(script, /document\.addEventListener\('focusin'/);
assert.match(script, /window\.addEventListener\('hashchange'/);
assert.match(script, /if \(node\.contains\(event\.target\)\) showModule\(node, true\)/);
assert.match(script, /event\.propertyName === 'opacity'/);
assert.match(script, /node\.dataset\.ariaLabelZh/);
assert.match(script, /node\.dataset\.altZh/);
assert.match(script, /initialiseEnglishGuides\(\);/);
assert.match(script, /button\.disabled = false/);
assert.match(script, /state\.panel\.hidden = !open/);
assert.match(script, /state\.button\?\.setAttribute\('aria-expanded', String\(open\)\)/);
assert.match(script, /englishHover\.matches/);
assert.match(script, /state\.panel\.addEventListener\('pointerenter', hoverIn\)/);
assert.match(script, /button\.addEventListener\('click'/);
assert.match(script, /button\.addEventListener\('focus', updateFocus\)/);
assert.match(script, /event\.relatedTarget : event\.target/);
assert.match(script, /state\.button\?\.focus\(\{ preventScroll: true \}\);\s*closeEnglishGuide\(state, true\)/);
assert.match(script, /event\.key !== 'Escape' \|\| state\.panel\.hidden/);
const sharedStyles = await readFile(resolve(root, "style.css"), "utf8");
assert.match(sharedStyles, /@media\(max-width:1100px\)\{\.top/);
assert.match(sharedStyles, /\.service-entry \.audience>a\.audience-secondary-link\{/);
assert.match(script, /window\.matchMedia\('\(min-width: 1101px\)'\)/);
assert.match(script, /function closeNavGroups\(/);
assert.match(script, /group\.addEventListener\('pointerenter'/);
assert.match(script, /group\.addEventListener\('toggle'/);
assert.match(script, /group\.contains\(event\.relatedTarget\)/);
assert.match(sharedStyles, /main \.intro p[^\n]*text-wrap:balance/);
assert.match(sharedStyles, /html\[data-lang=en\] :is\([^\n]+\)\{text-wrap:balance\}/);
assert.match(sharedStyles, /html\[data-lang=zh\] :is\([^\n]+\)\{text-wrap:wrap\}/);
assert.match(sharedStyles, /\.text-tail\{white-space:nowrap\}/);
assert.match(await readFile(resolve(root, "content/case-studies.html"), "utf8"), /&lt;span class=&quot;text-tail&quot;&gt;不能省略前期工作。&lt;\/span&gt;/);
assert.match(sharedStyles, /\.case-reading-content \.case-outcome\{display:block\}/);
assert.match(script, /registerMotion\('[^']*\.la-industry', 'settle'\)/);
assert.match(script, /querySelectorAll\('[^']*\.la-industries'\)\.forEach\(group/);
assert.match(sharedStyles, /\.la-industry:hover\{translate:0 -4px/);
assert.match(sharedStyles, /@media\(prefers-reduced-motion:reduce\)\{\.la-industry\{transition:none\}\.la-industry:hover\{translate:none\}\}/);
assert.match(sharedStyles, /html:has\(\.page-labour-agreements\)\{scroll-padding-top:160px\}/);
assert.match(sharedStyles, /\.labour-guide \.page-jump a\{white-space:nowrap\}/);
assert.match(sharedStyles, /\.visa-english-summary\[hidden\][^{]*\{display:none\}/);
assert.match(sharedStyles, /\.visa-english-trigger:focus-visible\{/);
assert.doesNotMatch(sharedStyles, /--ochre|var\(--ochre\)|#8a6637|#71542d|#b7a181/i, "Editorial accents use brand colours");
assert.doesNotMatch(sharedStyles, /ui-monospace|Consolas|Courier|monospace/i, "Brand display text does not use an unrelated monospace face");
assert.match(sharedStyles, /\.person \.role\{color:var\(--brand-teal\)\}/);
assert.match(sharedStyles, /\.office \.label\{color:var\(--brand-teal\)\}/);
assert.match(sharedStyles, /\.case-heading \.label\{color:var\(--brand-teal\)\}/);
assert.match(sharedStyles, /\.case-map-point\{[^}]*'Rethink Sans'[^}]*font-variant-numeric:tabular-nums/);
assert.match(sharedStyles, /\.hero \.brand-transition\{[^}]*font-size:13px/);
assert.match(sharedStyles, /--entrance-delay:\.08s/);
assert.match(sharedStyles, /--entrance-delay:\.18s/);
assert.match(sharedStyles, /--entrance-delay:\.28s/);
for (const effect of ['fade', 'side', 'settle']) {
  assert(sharedStyles.includes('[data-reveal=' + effect + ']'), 'Module appearance variant: ' + effect);
}
assert.match(sharedStyles, /\.motion-ready \.reveal\.on\{opacity:1;transform:none\}/);
assert.match(sharedStyles, /@media\(max-width:600px\)\{\s*\.motion-ready \.reveal\[data-reveal\]\{[^}]*transition-delay:0ms/);
assert.match(sharedStyles, /@media\(prefers-reduced-motion:reduce\)\{\.motion-ready \.reveal\[data-reveal\]\{opacity:1;transform:none;transition:none\}\}/);
assert.match(sharedStyles, /@media\(prefers-reduced-motion:reduce\)\{\s*\.entrance-ready[^}]*animation:none/);
assert.match(sharedStyles, /--focus-on-dark:#b8edcf/);
assert.match(sharedStyles, /outline-color:var\(--focus-on-dark\)/);
assert.match(sharedStyles, /\.legal-copy\{max-width:68ch\}/);
assert.match(sharedStyles, /border:1px solid var\(--field-border\)/);
new Function(script);
const coverResponse = await fetch(base + "/share-cover.png");
const logo = await readFile(resolve(root, "public/aqyr-logo.svg"), "utf8");
const favicon = await readFile(resolve(root, "public/aqyr-favicon.webp"));
assert.equal(favicon.subarray(0, 4).toString(), "RIFF");
assert.equal(favicon.subarray(8, 12).toString(), "WEBP");
const faviconResponse = await fetch(base + "/aqyr-favicon.webp");
assert.equal(faviconResponse.status, 200);
assert.deepEqual(Buffer.from(await faviconResponse.arrayBuffer()), favicon);
assert.match(logo, /viewBox="0 0 277.28 109.71"/, "Official logo retains its clear space");
assert.match(logo, /#1f4434/i);
assert.match(logo, /#45c487/i);
assert.equal(coverResponse.status, 200);
assert.match(coverResponse.headers.get("content-type"), /image\/png/);
const cover = Buffer.from(await coverResponse.arrayBuffer());
assert.equal(cover.subarray(1, 4).toString(), "PNG");
assert.equal(cover.readUInt32BE(16), 1200);
assert.equal(cover.readUInt32BE(20), 630);
console.log(`PASS: ${routes.length} pages, unique search metadata, company introduction, 7 unified case studies with businesses before individuals, subsidiary relationship, branded share image, navigation, clean URLs without legacy redirects, sitemap, robots, responsive local images and shared runtime.`);
