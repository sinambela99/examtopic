'use client';

/**
 * Sanitizes HTML content, allowing only a safe subset of tags,
 * and auto-links plain-text URLs.
 */

const ALLOW_TAGS = new Set([
  'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'CODE', 'PRE',
  'P', 'UL', 'OL', 'LI', 'A', 'SPAN', 'DIV',
]);

const URL_RE = /(?:https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export function sanitizeHTML(html) {
  if (typeof window === 'undefined') return html || ''; // SSR guard

  const template = document.createElement('template');
  template.innerHTML = html || '';

  // Auto-link plain-text URLs in text nodes
  const autoLinkTextNodes = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const toReplace = [];
    let n;
    while ((n = walker.nextNode())) {
      const txt = n.nodeValue || '';
      URL_RE.lastIndex = 0;
      if (URL_RE.test(txt)) toReplace.push(n);
    }
    toReplace.forEach((textNode) => {
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      const text = textNode.nodeValue || '';
      URL_RE.lastIndex = 0;
      let m;
      while ((m = URL_RE.exec(text))) {
        if (m.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        }
        const urlText = m[0];
        const a = document.createElement('a');
        const href = /^https?:/i.test(urlText) ? urlText : `https://${urlText}`;
        a.href = href;
        a.textContent = urlText;
        a.target = '_blank';
        a.rel = 'noopener';
        frag.appendChild(a);
        lastIndex = m.index + urlText.length;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.replaceWith(frag);
    });
  };

  autoLinkTextNodes(template.content);

  // Sanitize elements/attributes against the allowlist
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName;
        if (!ALLOW_TAGS.has(tag)) {
          const fragment = document.createDocumentFragment();
          while (child.firstChild) fragment.appendChild(child.firstChild);
          child.replaceWith(fragment);
        } else {
          [...child.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            if (tag === 'A' && name === 'href') {
              const href = child.getAttribute('href') || '';
              if (!/^https?:/i.test(href) && !href.startsWith('/')) {
                child.removeAttribute('href');
              } else {
                child.setAttribute('target', '_blank');
                child.setAttribute('rel', 'noopener');
              }
            } else {
              child.removeAttribute(name);
            }
          });
          walk(child);
        }
      }
    });
  };
  walk(template.content);

  let output = template.innerHTML;
  output = output.replace(/([A-Za-z])<br\s*\/?>/g, '$1 ');
  return output;
}

/**
 * Calculate percentage (0-100, rounded).
 */
export function pct(numerator, total) {
  return total ? Math.round((numerator * 100) / total) : 0;
}

/**
 * Parse a date from an update text string.
 */
export function parseUpdateDate(rawText) {
  if (!rawText) return '';
  const dateMatch = rawText.match(
    /(\d{4}[-\/. ]\d{1,2}[-\/. ]\d{1,2})|(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/
  );
  if (!dateMatch) return rawText;
  const date = new Date(dateMatch[0]);
  if (isNaN(date)) return rawText;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
