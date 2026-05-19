export function slugify(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'entrada';
}

export function makePostId(title = '') {
  const base = slugify(title);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 7);
  return `${base}-${stamp}-${random}`;
}

export function estimateReadingTime(markdown = '') {
  const plain = stripMarkdown(markdown);
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min`;
}

export function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function sortByDateDesc(posts = []) {
  return [...posts].sort((a, b) => {
    const dateA = getSortableDate(a.publishedAt || a.updatedAt || a.createdAt);
    const dateB = getSortableDate(b.publishedAt || b.updatedAt || b.createdAt);
    return dateB - dateA;
  });
}

export function getSortableDate(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  return new Date(value).getTime() || 0;
}

export function stripMarkdown(markdown = '') {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function makeExcerpt(markdown = '', fallback = '') {
  const text = fallback.trim() || stripMarkdown(markdown);
  if (text.length <= 170) return text;
  return `${text.slice(0, 167).trim()}…`;
}

export function parseTags(value = '') {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToString(tags = []) {
  return Array.isArray(tags) ? tags.join(', ') : '';
}

export function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inlineMarkdown(value = '') {
  let output = escapeHtml(value);

  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return output;
}

export function markdownToHtml(markdown = '') {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '<p></p>';

  const blocks = normalized.split(/\n{2,}/);

  return blocks.map((block) => {
    const trimmed = block.trim();

    if (/^###\s+/.test(trimmed)) {
      return `<h3>${inlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h3>`;
    }

    if (/^##\s+/.test(trimmed)) {
      return `<h2>${inlineMarkdown(trimmed.replace(/^##\s+/, ''))}</h2>`;
    }

    if (/^#\s+/.test(trimmed)) {
      return `<h1>${inlineMarkdown(trimmed.replace(/^#\s+/, ''))}</h1>`;
    }

    if (/^>\s?/m.test(trimmed)) {
      const quote = trimmed
        .split('\n')
        .map((line) => line.replace(/^>\s?/, ''))
        .join('<br>');
      return `<blockquote>${inlineMarkdown(quote)}</blockquote>`;
    }

    if (/^[-*]\s+/m.test(trimmed)) {
      const items = trimmed
        .split('\n')
        .filter((line) => /^[-*]\s+/.test(line.trim()))
        .map((line) => `<li>${inlineMarkdown(line.trim().replace(/^[-*]\s+/, ''))}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    }

    const paragraph = trimmed.split('\n').map(inlineMarkdown).join('<br>');
    return `<p>${paragraph}</p>`;
  }).join('\n');
}

export function setYear(selector = '#year') {
  const target = document.querySelector(selector);
  if (target) target.textContent = new Date().getFullYear();
}
