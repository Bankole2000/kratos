export function flagEmoji(alpha2: string): string {
  return alpha2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}
