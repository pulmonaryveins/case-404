import styles from "./Site.module.css";

export type NigelExpression = "idle" | "blink" | "talk" | "think";

/**
 * N.I.G.E.L.'s face, the same mascot as on the 3D office's terminal: a
 * monitor-shaped head, one eye behind a monocle (with its chain), the right
 * eyebrow permanently raised, and a neat moustache. Drawn in the current
 * text colour.
 */
export function NigelFace({
  expression = "idle",
  className,
}: {
  expression?: NigelExpression;
  className?: string;
}) {
  const shut = expression === "blink";
  return (
    <svg
      viewBox="0 0 48 40"
      className={`${styles.nigelFace} ${className ?? ""}`}
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden
    >
      {/* The head: a little monitor. */}
      <rect x="4" y="3" width="40" height="34" rx="6" fill="none" strokeWidth="2" />
      {/* Left eye. */}
      {shut ? (
        <rect x="13" y="17" width="6" height="1.5" stroke="none" />
      ) : (
        <rect x="14" y="15" width="4" height="4" stroke="none" />
      )}
      {/* Right eye behind the monocle, and the monocle's chain. */}
      <circle cx="32" cy="17" r="6" fill="none" strokeWidth="1.5" />
      {shut ? (
        <rect x="29" y="17" width="6" height="1.5" stroke="none" />
      ) : (
        <rect x="30" y="15" width="4" height="4" stroke="none" />
      )}
      <path d="M37 21Q41 27 40 34" fill="none" strokeWidth="1.5" />
      {/* Brows: the right one always up; thinking lifts the left too. */}
      <path
        d={`${expression === "think" ? "M11 9L20 7" : "M11 10L20 10"}M26 8Q32 3 38 6`}
        fill="none"
        strokeWidth="2"
      />
      {/* The moustache: two curled wings. */}
      <path
        stroke="none"
        d="M24 25Q19 23 15 27Q14 24 17 23.5Q21 22.5 24 24Q27 22.5 31 23.5Q34 24 33 27Q29 23 24 25Z"
      />
      {/* Mouth: a smirk, an open one while it talks, pursed while it thinks. */}
      {expression === "talk" ? (
        <rect x="21" y="29" width="7" height="3" stroke="none" />
      ) : expression === "think" ? (
        <rect x="23" y="30" width="3" height="2" stroke="none" />
      ) : (
        <path d="M20 31L27 31L30 29.5" fill="none" strokeWidth="1.5" />
      )}
    </svg>
  );
}
