import type { CSSProperties } from "react";

// A circular score. The ring draws in with CSS (skipped under reduced motion);
// the number is plain text from the first paint.
export function MatchRing({
  score,
  size = 64,
  stroke = 6,
  delay,
  tone = "light",
  label,
}: {
  score: number;
  size?: number;
  stroke?: number;
  delay?: string;
  tone?: "light" | "ink";
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length * (1 - Math.min(100, Math.max(0, score)) / 100);
  const track = tone === "ink" ? "rgb(227 246 247 / 0.15)" : "var(--color-surface-container-high)";
  const fill = tone === "ink" ? "var(--color-primary-fixed-dim)" : "var(--color-primary)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${score}% match`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={offset}
          style={{ "--ring-length": `${length}px`, "--ring-delay": delay ?? "0s" } as CSSProperties}
        />
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-display font-extrabold ${tone === "ink" ? "text-on-ink" : "text-on-surface"}`}
        style={{ fontSize: size * (score >= 100 ? 0.21 : 0.26) }}
        aria-hidden
      >
        {score}%
      </span>
    </div>
  );
}
