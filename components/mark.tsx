/** The flared bottom-left corner is what reads as a book. */
export function Mark({size = 64, label}: {size?: number; label: string}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
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
      <path d="M25 25Q28 12 38 6Q39 16 40 25Z" fill="#db3642" />
      <ellipse cx={32} cy={26} rx={16} ry={4} fill="#db3642" />
    </svg>
  )
}
