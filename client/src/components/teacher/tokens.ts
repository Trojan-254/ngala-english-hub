export const T = {
  primary: "#0B4F6C",
  primaryLight: "#E8F4FA",
  gold: "#F4A932",
  goldLight: "#FEF6E4",
  green: "#1A9E5C",
  greenLight: "#E8F7EF",
  red: "#D94035",
  redLight: "#FDECEA",
  purple: "#5C3D8F",
  purpleLight: "#F0EBF9",
  bg: "#F4F6F9",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  shadow: "0 1px 3px rgba(0,0,0,0.08)",
} as const;
export const cardStyle: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  boxShadow: T.shadow,
};
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
export function moduleLabel(slug: string): string {
  const map: Record<string, string> = {
    grammar: "Grammar Drills",
    comprehension: "Reading Comprehension",
    pastpapers: "Past Papers",
    vocabulary: "Vocabulary",
  };
  return map[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}
export function accuracyColor(pct: number): string {
  if (pct >= 70) return T.green;
  if (pct >= 50) return T.gold;
  return T.red;
}
export function levelName(level: number): string {
  const names = ["Apprentice", "Scribe", "Wordsmith", "Scholar", "Griot"];
  return names[Math.min(Math.max(level - 1, 0), names.length - 1)];
}
