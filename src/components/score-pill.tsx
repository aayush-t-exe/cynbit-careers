export function ScorePill({ score }: { score?: number }) {
  if (score === undefined) return <span className="chip shrink-0 bg-surface-container px-2 py-0.5 text-[11px] text-outline">scoring…</span>;
  const tone = score >= 70 ? "bg-primary text-white" : score >= 45 ? "bg-primary-fixed/60 text-primary" : "bg-surface-container text-on-surface-variant";
  return <span className={`chip shrink-0 px-2 py-0.5 text-xs ${tone}`}>{score}%</span>;
}
