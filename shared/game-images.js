window.GameImages = {
  resolve(source) {
    if (!source) return '';
    if (source.startsWith('shared/')) return '/' + source;
    return source;
  },
  portrait(container,source,name) {
    container.replaceChildren();
    const image = document.createElement('img');
    image.alt = name;
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    const fallback = () => {
      const label = document.createElement('span');
      label.className = 'image-fallback';
      label.textContent = window.GameI18n?.t('Photo unavailable') || 'Photo unavailable';
      label.setAttribute('role','img');
      label.setAttribute('aria-label',name + ' — ' + label.textContent);
      container.replaceChildren(label);
    };
    image.onerror = () => { if (image.parentNode === container) fallback(); };
    if (source) { image.src = this.resolve(source); container.append(image); } else fallback();
  }
};
