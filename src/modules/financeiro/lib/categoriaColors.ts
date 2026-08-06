/** Fixed categorical palette for user-created Categorias — 8 hues in a fixed
 * order (never cycled), validated with the dataviz skill's validator against
 * Avyon's dark card surface (#131519): lightness band, chroma floor, CVD
 * separation (adjacent, dark mode) and contrast all pass. Don't hand-pick new
 * hexes here — re-run `validate_palette.js` against any change. */
export const CATEGORIA_COLORS = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
] as const

/** Used for the "Sem categoria" bucket in breakdowns — deliberately outside the
 * categorical set so it never impersonates a real tag. */
export const CATEGORIA_SEM_COR = 'var(--muted-foreground)'

export function defaultCategoriaColor(existingCount: number): string {
  return CATEGORIA_COLORS[existingCount % CATEGORIA_COLORS.length]
}
