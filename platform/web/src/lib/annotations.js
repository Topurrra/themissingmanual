// Private highlights + notes on guide text. Client-only, localStorage, no account -
// same "no backend needed" shape as bookmarks/SRS/quiz state elsewhere in this app.
// One array per guide phase, keyed by the highlighted text itself (not a DOM range,
// which wouldn't survive a reload) so re-applying on mount is a plain text search.
const PREFIX = 'tmm-annotations:';

export const HL_COLORS = [
  { id: 'amber', hex: '#f5c451' },
  { id: 'mint', hex: '#7cd9b0' },
  { id: 'rose', hex: '#f2a3b3' },
  { id: 'teal', hex: '#5fb8c2' }
];

function key(slug, phase) {
  return `${PREFIX}${slug}/${phase}`;
}

export function loadAnnotations(slug, phase) {
  try {
    const raw = localStorage.getItem(key(slug, phase));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function save(slug, phase, arr) {
  try {
    localStorage.setItem(key(slug, phase), JSON.stringify(arr));
  } catch (e) {}
}

function newId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function addAnnotation(slug, phase, { text, color, note }) {
  const arr = loadAnnotations(slug, phase);
  const entry = { id: newId(), text, color: color || HL_COLORS[0].id, note: note || '', createdAt: Date.now() };
  arr.push(entry);
  save(slug, phase, arr);
  return entry;
}

export function updateAnnotation(slug, phase, id, patch) {
  const arr = loadAnnotations(slug, phase);
  const i = arr.findIndex((a) => a.id === id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  save(slug, phase, arr);
  return arr[i];
}

export function removeAnnotation(slug, phase, id) {
  const arr = loadAnnotations(slug, phase).filter((a) => a.id !== id);
  save(slug, phase, arr);
}
