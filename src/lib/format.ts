const formatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatWhen(date: Date | string) {
  return formatter.format(new Date(date));
}

export function hoursSince(date: Date | string) {
  return (Date.now() - new Date(date).getTime()) / 3_600_000;
}

export function ago(date: Date | string) {
  const hours = hoursSince(date);
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min ago`;
  if (hours < 48) return `${Math.round(hours)} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}
