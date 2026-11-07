/* Shared "share your result" buttons: post on X, native share sheet (phones), copy link. */
(() => {
  'use strict';
  const SITE = 'https://telemetry-one.com';
  const KNOWN_HOSTS = /^(telemetry-one\.com|www\.telemetry-one\.com|telemetry-1\.vercel\.app|localhost|127\.0\.0\.1)$/;
  const SLUGS = {
    'f1-circuit-guesser': 'circuito',
    'f1-driver-guess': 'piloto',
    'f1_higher_lower': 'higher-lower',
    'f1-bingo': 'bingo'
  };

  const lang = () => (window.GameI18n && GameI18n.language === 'en' ? 'en' : 'es');

  /** The site that embeds the game (from the referrer), or telemetry-one.com when opened directly. */
  function siteOrigin() {
    const candidates = [];
    try { if (location.ancestorOrigins && location.ancestorOrigins.length) candidates.push(location.ancestorOrigins[location.ancestorOrigins.length - 1]); } catch {}
    if (document.referrer) candidates.push(document.referrer);
    for (const value of candidates) {
      try {
        const url = new URL(value);
        if (KNOWN_HOSTS.test(url.hostname)) return url.origin;
      } catch {}
    }
    return SITE;
  }

  function shareUrl() {
    const slug = SLUGS[document.body.dataset.game];
    if (!slug) return location.href;
    return `${siteOrigin()}${lang() === 'en' ? '/en' : ''}/juegos/${slug}`;
  }

  function flash(button, message) {
    const label = button.dataset.label || button.textContent;
    button.dataset.label = label;
    button.textContent = window.GameI18n ? GameI18n.t(message) : message;
    clearTimeout(button._shareTimer);
    button._shareTimer = setTimeout(() => { button.textContent = window.GameI18n ? GameI18n.t(label) : label; }, 1800);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  /**
   * Render the share row into `container`.
   * `message` is { es, en } or a function returning it; it is read at click time so it follows the language toggle.
   */
  function render(container, message) {
    if (!container) return;
    const getText = () => {
      const value = typeof message === 'function' ? message() : message;
      return value[lang()] || value.es;
    };
    container.innerHTML = '';
    container.classList.add('game-share');

    const x = document.createElement('a');
    x.className = 'game-share-x';
    x.target = '_blank';
    x.rel = 'noopener noreferrer';
    x.textContent = 'Share on X';
    const updateHref = () => {
      const params = new URLSearchParams({ text: getText(), url: shareUrl() });
      x.href = `https://x.com/intent/post?${params}`;
    };
    updateHref();
    x.addEventListener('pointerdown', updateHref);
    x.addEventListener('focus', updateHref);
    container.appendChild(x);

    if (navigator.share) {
      const native = document.createElement('button');
      native.type = 'button';
      native.textContent = 'Share…';
      native.addEventListener('click', () => {
        navigator.share({ text: getText(), url: shareUrl() }).catch(() => {});
      });
      container.appendChild(native);
    }

    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = 'Copy link';
    link.addEventListener('click', async () => {
      const ok = await copy(`${getText()} ${shareUrl()}`);
      flash(link, ok ? 'Copied!' : 'Could not copy');
    });
    container.appendChild(link);
  }

  window.GameShare = { render, url: shareUrl };
})();
