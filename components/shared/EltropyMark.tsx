/**
 * Custom Eltropy mark. Stylized E whose middle arm terminates in a node,
 * evoking workflow composition: vertical spine = orchestrator, horizontal
 * arms = skill steps, node = the live one. Used in the header and any other
 * surface that wants to carry Eltropy product identity.
 */
export function EltropyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5.5 4.5 L5.5 19.5" />
      <path d="M5.5 5 L17 5" />
      <path d="M5.5 12 L13 12" />
      <path d="M5.5 19 L15 19" />
      <circle cx="14.2" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
