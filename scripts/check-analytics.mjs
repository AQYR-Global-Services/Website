import assert from 'node:assert/strict';
import { initAnalytics, measurementId, containerId, readPreference, safePageLocation, safeReferrer } from '../public/analytics.mjs';

const key = 'aqyr-analytics-consent-v1';
const now = Date.now();
const saved = (choice, at = now) => JSON.stringify({ choice, at });
const storage = value => ({ getItem: () => value });
assert.equal(readPreference(storage(saved('accepted')), now), 'accepted');
assert.equal(readPreference(storage(saved('rejected')), now), 'rejected');
for (const value of [null, 'bad json', saved('other'), saved('accepted', now + 1), saved('accepted', now - 181 * 864e5)]) {
  assert.equal(readPreference(storage(value), now), null);
}
assert.equal(readPreference({getItem() { throw Error('blocked'); }}), null);
assert.equal(safePageLocation(new URL('https://www.hiremiiglobal.com/contact?email=private#enquiry?details=secret')), 'https://www.hiremiiglobal.com/contact');
assert.equal(safePageLocation(new URL('https://www.hiremiiglobal.com/unknown-private-name')), 'https://www.hiremiiglobal.com/');
assert.equal(safeReferrer('https://example.com/private?email=private#secret'), 'https://example.com/');
assert.equal(safeReferrer('file:///private'), '');

function harness(url = 'https://www.hiremiiglobal.com/contact?email=private#details=secret', preference = null, blocked = false) {
  const nodes = [];
  class Node {
    events = {}; children = []; dataset = {}; hidden = false; textContent = '';
    constructor(tag) { this.tag = tag; nodes.push(this); }
    setAttribute(key, value) { this[key] = value; }
    append(node) { this.children.push(node); }
    addEventListener(name, fn) { this.events[name] = fn; }
    focus(options) { this.focused = true; this.focusOptions = options; }
    closest() { return this; }
    set innerHTML(value) {
      this.html = value;
      this.selectors = Object.fromEntries(['h2','p','a','[data-analytics="rejected"]','[data-analytics="accepted"]'].map(selector => [selector, new Node(selector)]));
      this.selectors['[data-analytics="rejected"]'].dataset.analytics = 'rejected';
      this.selectors['[data-analytics="accepted"]'].dataset.analytics = 'accepted';
      this.selectors.button = this.selectors['[data-analytics="rejected"]'];
    }
    querySelector(selector) { return this.selectors[selector]; }
  }
  const entries = new Map(preference ? [[key, preference]] : []);
  const doc = { head: new Node('head'), body: new Node('body'), documentElement: {dataset:{lang:'en'}},
    referrer:'https://example.com/secret?name=private', title:'AQYR Global Services — Contact', cookie:'_ga=old; essential=keep',
    createElement: tag => new Node(tag), getElementById: id => nodes.find(node => node.id === id), querySelector: () => null };
  const location = new URL(url);
  let reloads = 0;
  location.reload = () => reloads++;
  const win = { location, localStorage: { getItem(k) { if (blocked) throw Error('blocked'); return entries.get(k) ?? null; }, setItem(k,v) { if (blocked) throw Error('blocked'); entries.set(k,v); } },
    MutationObserver: class { constructor(fn) { win.languageChanged = fn; } observe() {} },
    addEventListener(name, fn) { win[name] = fn; } };
  initAnalytics(win, doc);
  const panel = doc.getElementById('analytics-choice');
  const settings = nodes.find(node => node.className === 'analytics-settings');
  return { win, doc, entries, panel, settings, nodes, reloads: () => reloads,
    choose(choice) { panel.events.click({ target: panel.querySelector('[data-analytics="' + choice + '"]') }); } };
}

const initial = harness();
assert.equal(initial.doc.head.children.length, 0, 'No Google request before consent');
assert.equal(initial.win.dataLayer, undefined);
assert.equal(initial.panel.hidden, false);
initial.choose('rejected');
assert.equal(initial.settings.focused, undefined, 'First-visit decline must not focus the footer');
assert.equal(initial.doc.head.children.length, 0, 'Rejecting never loads the tag');
initial.choose('accepted');
assert.equal(initial.settings.focused, undefined, 'First-visit accept must not focus the footer');
assert.equal(initial.doc.head.children.length, 1);
const commands = initial.win.dataLayer.map(args => args[Symbol.iterator] ? [...args] : args);
assert.deepEqual(commands[0].slice(0,2), ['consent','default']);
assert.equal(commands[0][2].ad_user_data, 'denied');
assert.equal(commands[1][2].analytics_storage, 'granted');
assert.equal(commands[2][0], 'set');
assert.equal(commands[2][1].send_page_view, true, 'GTM native Google tag owns page views');
assert.equal(commands[2][1].allow_google_signals, false);
assert.equal(commands[2][1].page_location, 'https://www.hiremiiglobal.com/contact');
assert.equal(commands[3].event, 'gtm.js');
assert.equal(typeof commands[3]['gtm.start'], 'number');
assert.equal(initial.doc.head.children[0].src, 'https://www.googletagmanager.com/gtm.js?id=' + containerId);
assert.equal(initial.doc.head.children[0].referrerPolicy, 'strict-origin');
assert(!commands.some(command => ['config', 'event'].includes(command[0])), 'No direct GA4 config or event duplicates GTM');
assert.doesNotMatch(JSON.stringify(commands), /private|secret|details=|email=/);
initial.choose('accepted');
initAnalytics(initial.win, initial.doc);
assert.equal(initial.doc.head.children.length, 1, 'Repeated clicks/init do not double-load');
assert.equal(initial.win.dataLayer.length, 4, 'Exactly one GTM bootstrap with no duplicate tracking');
initial.doc.documentElement.dataset.lang = 'zh';
initial.win.languageChanged();
assert.equal(initial.panel.querySelector('h2').textContent, '访问统计，由您选择。');
initial.choose('rejected');
assert.equal(initial.win['ga-disable-' + measurementId], true);
assert.equal(initial.reloads(), 1, 'Withdrawal unloads an already loaded tag');
assert.match(initial.doc.cookie, /Max-Age=0/);
for (const url of ['http://127.0.0.1:3000/', 'http://localhost:3000/', 'https://preview.vercel.app/team', 'file:///team.html', 'https://hiremiiglobal.com.evil.test/']) {
  const preview = harness(url, saved('accepted'));
  assert.equal(preview.doc.head.children.length, 0, 'Non-production never sends data: ' + url);
}
assert.equal(harness(undefined, saved('accepted')).doc.head.children.length, 1);
assert.equal(harness(undefined, saved('rejected')).doc.head.children.length, 0);
const blocked = harness(undefined, null, true);
blocked.choose('accepted');
assert.equal(blocked.doc.head.children.length, 1, 'Blocked storage still allows an explicit in-memory choice');
const reopened = harness('http://localhost:3001/', saved('rejected'));
reopened.settings.events.click();
assert.deepEqual(reopened.panel.querySelector('button').focusOptions, { preventScroll: true }, 'Opening preferences preserves the current reading position');
reopened.choose('accepted');
assert.deepEqual(reopened.settings.focusOptions, { preventScroll: true }, 'Explicit preferences restore focus without scrolling');
console.log('GTM checks passed: consent, withdrawal, expiry, bilingual UI, production-only, sanitised defaults, one container and no direct GA4 duplication.');
