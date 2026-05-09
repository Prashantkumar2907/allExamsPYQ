const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'lorelei',
  'micah',
  'notionists',
  'personas',
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

const PALETTES = [
  ['#2563eb', '#bfdbfe'],
  ['#059669', '#bbf7d0'],
  ['#c2410c', '#fed7aa'],
  ['#7c3aed', '#ddd6fe'],
  ['#be123c', '#fecdd3'],
  ['#0f766e', '#ccfbf1'],
] as const;

function hashText(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getInitials(seed: string) {
  const parts = seed.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getAvatarUrl(style: AvatarStyle = 'adventurer', seed: string = 'default') {
  const key = `${style}:${seed || 'default'}`;
  const palette = PALETTES[hashText(key) % PALETTES.length];
  const initials = escapeSvgText(getInitials(seed || 'User'));
  const accentShift = hashText(`${key}:accent`) % 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="User avatar"><rect width="96" height="96" rx="24" fill="${palette[0]}"/><circle cx="${24 + accentShift}" cy="20" r="28" fill="${palette[1]}" opacity=".32"/><circle cx="${72 - accentShift / 2}" cy="78" r="34" fill="${palette[1]}" opacity=".2"/><text x="48" y="55" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export { AVATAR_STYLES };
