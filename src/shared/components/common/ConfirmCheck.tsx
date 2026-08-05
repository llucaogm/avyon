/** The signature moment: a small hand-drawn-feeling checkmark that seals a
 * confirmed payment/receipt, in the row's own group color. Mounted only for
 * the ~600ms it plays, then the caller swaps back to the normal row. */
export function ConfirmCheck({ color }: { color: string }) {
  return (
    <span
      className="animate-pop-in inline-flex size-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)` }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12.5L9.5 18L20 6"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="32"
          strokeDashoffset="32"
          style={{ animation: 'check-draw 0.4s 0.1s cubic-bezier(0.65, 0, 0.35, 1) forwards' }}
        />
      </svg>
    </span>
  )
}
