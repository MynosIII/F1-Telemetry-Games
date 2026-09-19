/* Shared bilingual UI. Translating text nodes preserves game state and event handlers. */
(() => {
  'use strict';
  const pairs = window.GAME_TRANSLATIONS || [];
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  let language = 'es';
  try { language = new URLSearchParams(location.search).get('lang') || localStorage.getItem('telemetry-language') || 'es'; } catch {}
  if (!['en', 'es'].includes(language)) language = 'es';
  const exact = new Map();
  const patterns = [];
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  pairs.forEach(([en, es]) => {
    if (en.includes('{0}')) {
      [en, es].forEach(source => {
        const keys = [];
        const expression = normalize(source).split(/(\{\d+\})/).map(part => /^\{\d+\}$/.test(part) ? (keys.push(part), '(.+?)') : escape(part)).join('');
        patterns.push({ regex:new RegExp(`^${expression}$`), keys, en, es });
      });
    } else {
      exact.set(normalize(en), {en,es}); exact.set(normalize(es), {en,es});
      exact.set(normalize(en.toUpperCase()), {en:en.toUpperCase(),es:es.toUpperCase()});
      exact.set(normalize(es.toUpperCase()), {en:en.toUpperCase(),es:es.toUpperCase()});
    }
  });
  const fragments = window.GAME_TRANSLATION_FRAGMENTS || {};
  Object.entries(fragments).forEach(([es,en]) => {
    if (!Object.hasOwn(fragments,es.toUpperCase())) fragments[es.toUpperCase()] = en.toUpperCase();
  });
  const fragmentKeys = Object.keys(fragments).sort((a,b)=>b.length-a.length);
  const fragmentPattern = fragmentKeys.length ? new RegExp('(?<![\\p{L}\\p{N}])(?:'+fragmentKeys.map(escape).join('|')+')(?![\\p{L}\\p{N}])','gu') : null;
  function translate(value) {
    const key = normalize(value);
    const match = exact.get(key);
    let result = match?.[language];
    if (result === undefined) {
      for (const pattern of patterns) {
        const found = key.match(pattern.regex);
        if (found) {
          result = pattern[language];
          pattern.keys.forEach((token,index) => { result = result.replaceAll(token, exact.get(found[index+1])?.[language] || found[index+1]); });
          break;
        }
      }
    }
    if (result === undefined && language === 'en' && fragmentPattern) result = key.replace(fragmentPattern,part=>fragments[part]);
    if (result === undefined) return value;
    return value.match(/^\s*/)[0] + result + value.match(/\s*$/)[0];
  }
  const originals = new WeakMap();
  const attributeOriginals = new WeakMap();
  let titleSource = document.title;
  let titleRendered = document.title;
  let observer;
  function text(node) {
    if (!node.parentElement || node.parentElement.closest('script,style,code,pre,[data-no-translate],.telemetry-language')) return;
    const old = originals.get(node);
    const source = old && node.nodeValue === old.rendered ? old.source : node.nodeValue;
    const rendered = translate(source);
    originals.set(node,{source,rendered});
    if (node.nodeValue !== rendered) node.nodeValue = rendered;
  }
  function element(node) {
    if (node.closest('script,style,[data-no-translate],.telemetry-language')) return;
    let saved = attributeOriginals.get(node) || {};
    for (const attr of ['placeholder','title','aria-label','alt']) {
      if (!node.hasAttribute(attr)) continue;
      const current = node.getAttribute(attr), old = saved[attr];
      const source = old && old.rendered === current ? old.source : current;
      const rendered = translate(source);
      saved[attr] = {source,rendered};
      if (current !== rendered) node.setAttribute(attr,rendered);
    }
    attributeOriginals.set(node,saved);
  }
  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) return text(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    element(root);
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) walker.currentNode.nodeType === Node.TEXT_NODE ? text(walker.currentNode) : element(walker.currentNode);
  }
  const observe = () => observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']});
  function refresh() {
    observer?.disconnect();
    walk(document.body);
    document.documentElement.lang = language;
    if (document.title !== titleRendered) titleSource = document.title;
    titleRendered = translate(titleSource);
    document.title = titleRendered;
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.language === language)));
    if (observer) observe();
  }
  function setLanguage(value) {
    if (!['en','es'].includes(value)) return;
    language = value;
    try { localStorage.setItem('telemetry-language',language); } catch {}
    refresh();
    document.dispatchEvent(new CustomEvent('telemetry-language-change',{detail:language}));
  }
  window.GameI18n = {t:translate,setLanguage,get language(){return language;},refresh};
  function init() {
    const bar = document.createElement('nav');
    bar.className = 'telemetry-language';
    bar.setAttribute('aria-label','Language / Idioma');
    bar.innerHTML = '<span>TELEMETRY <b>1</b></span><div><button type="button" data-language="es" lang="es">Español</button><button type="button" data-language="en" lang="en">English</button></div>';
    document.body.prepend(bar);
    bar.querySelectorAll('button').forEach(button => button.addEventListener('click',()=>setLanguage(button.dataset.language)));
    observer = new MutationObserver(records => {
      observer.disconnect();
      const roots = new Set();
      records.forEach(record=>record.type === 'childList' ? record.addedNodes.forEach(n=>roots.add(n)) : roots.add(record.target));
      roots.forEach(walk);
      observe();
    });
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
