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

export function getAvatarUrl(style: AvatarStyle = 'adventurer', seed: string = 'default') {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export { AVATAR_STYLES };
