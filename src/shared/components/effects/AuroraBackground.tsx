/** Ambient teal/blue wash behind the whole app — pure radial-gradient layers
 * (no filter:blur, no images) so it costs almost nothing to paint, plus a
 * static noise layer for a bit of print-like texture. Mount once per shell;
 * fixed + negative z-index means every page just renders on top of it. */
export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="aurora-layer" />
      <div className="aurora-grain" />
    </div>
  )
}
