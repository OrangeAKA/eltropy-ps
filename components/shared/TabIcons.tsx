/**
 * Custom tab glyphs. Replaces Lucide Boxes / Workflow / Terminal with marks
 * that read as catalog / composer / runtime at a glance and carry a hint of
 * the underlying product vocabulary instead of stock icon shapes.
 */

type IconProps = { className?: string };

export function CatalogGlyph({ className }: IconProps) {
  // A 2x2 mini grid of cards, suggesting a catalog of selectable items.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function ComposerGlyph({ className }: IconProps) {
  // Three connected nodes representing a vertical workflow graph. Hints at
  // the same "spine + branching arms" idea as the EltropyMark.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="6" cy="19" r="2" />
      <path d="M6 7 L6 10" />
      <path d="M6 14 L6 17" />
      <path d="M8 5 L18 5" />
      <path d="M8 12 L14 12" />
      <path d="M8 19 L16 19" />
    </svg>
  );
}

export function RuntimeGlyph({ className }: IconProps) {
  // A chevron + underscore evokes a terminal prompt without being literal
  // about it. Pairs with the audit-log-stream content of the tab.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5 8 L10 12 L5 16" />
      <path d="M13 16 L19 16" />
    </svg>
  );
}
