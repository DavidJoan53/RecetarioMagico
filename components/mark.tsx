/**
 * A book wearing a wizard hat. One inline SVG rather than an icon font: it is
 * the only icon the app needs at this size, and inlining it costs no request.
 *
 * The flared bottom-left corner is what makes it read as a book rather than a
 * rectangle — an earlier version added a horizontal rule for "pages" and
 * became a spreadsheet.
 */
export function Mark({size = 64}: {size?: number}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Recetario Mágico"
    >
      <title>Recetario Mágico</title>
      <path
        d="M14 54V30a4 4 0 0 1 4-4h28v32H18a4 4 0 0 0-4 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M41 26v32"
        stroke="currentColor"
        strokeWidth={2}
        opacity={0.45}
      />
      {/* primary-strong, not the brand red: this sits on a light ground. */}
      <path d="M25 25Q28 12 38 6Q39 16 40 25Z" fill="#db3642" />
      <ellipse cx={32} cy={26} rx={16} ry={4} fill="#db3642" />
    </svg>
  )
}
