interface Props {
  size?: number
  /** When true, renders just the glyph without the rounded tile. */
  glyphOnly?: boolean
}

/**
 * Maya brand mark — a crown-like "M" glyph.
 * Source: provided by the user as the product logo.
 */
export default function Logo({ size = 28, glyphOnly = false }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Maya logo"
      role="img"
    >
      {!glyphOnly && <rect width="24" height="24" rx="5" fill="#FFF6EC" />}
      <path
        d="M3.6 20 L3.6 6.6 L8 11.9 L12 6.6 L16 11.9 L20.4 6.6 L20.4 20"
        fill="none"
        stroke="#1A1815"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}