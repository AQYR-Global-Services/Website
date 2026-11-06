import { parseFragment, serialize } from 'parse5';
import { localizedHref, localizedPath } from '../public/site-language.mjs';

/** Translate trusted source HTML before sending it to crawlers or browsers. */
export function localizeMarkup(markup, language, pathname) {
  const fragment = parseFragment(markup);
  const read = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
  const set = (node, name, value) => {
    const attr = node.attrs.find(attr => attr.name === name);
    if (attr) attr.value = value;
    else node.attrs.push({ name, value });
  };
  function visit(node) {
    if (node.attrs) {
      const translated = read(node, 'data-' + language);
      if (translated !== undefined) {
        const children = parseFragment(node, translated).childNodes;
        node.childNodes = children;
        children.forEach(child => { child.parentNode = node; });
      }
      for (const name of ['aria-label', 'alt', 'placeholder']) {
        const value = read(node, 'data-' + name + '-' + language);
        if (value !== undefined) set(node, name, value);
      }
      const href = read(node, 'href');
      if (href) set(node, 'href', localizedHref(href, language));
      if (read(node, 'data-language-toggle') !== undefined) {
        node.nodeName = node.tagName = 'a';
        node.attrs = node.attrs.filter(attr => attr.name !== 'type');
        set(node, 'href', localizedPath(pathname, language === 'zh' ? 'en' : 'zh'));
        set(node, 'hreflang', language === 'zh' ? 'en' : 'zh-Hans');
        set(node, 'aria-label', language === 'zh' ? '切换为英文' : 'Switch to Chinese');
        node.childNodes = parseFragment(language === 'zh' ? 'English' : '中文').childNodes;
        node.childNodes.forEach(child => { child.parentNode = node; });
      }
    }
    node.childNodes?.forEach(visit);
    if (node.content) visit(node.content);
  }
  visit(fragment);
  return serialize(fragment);
}
