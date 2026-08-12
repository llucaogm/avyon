/** Preto ou branco por luminância — cores de banco/personalizadas são quase
 * sempre escuras/saturadas o bastante pra branco, mas isso cobre o caso raro
 * de uma cor clara (ex: amarelo) escolhida manualmente. */
export function pickCardTextColor(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#131519' : '#ffffff'
}
