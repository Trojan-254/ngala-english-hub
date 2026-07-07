import { useEffect, useMemo, useState } from "react";
import { teacherApi, LeaderboardEntry, ClassGroupInfo } from "@/lib/teacherApi";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle, initialsOf, levelName } from "@/components/teacher/tokens";
import { SkeletonBlock, ErrorState, EmptyState } from "@/components/teacher/StatusViews";
type Mode = "all" | "week";
export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [groups, setGroups] = useState<ClassGroupInfo[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = (cg?: string) => {
    setLoading(true); setError(null);
    teacherApi.leaderboard(cg)
      .then((r) => setData(r.leaderboard))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { teacherApi.classGroups().then((r) => setGroups(r.class_groups)).catch(() => setGroups([])); }, []);
  useEffect(() => { load(classFilter || undefined); }, [classFilter]);
  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => mode === "all" ? b.xp_total - a.xp_total : b.weekly_xp - a.weekly_xp);
  }, [data, mode]);
  const rankAccent = (i: number): string => {
    if (i === 0) return T.gold;
    if (i === 1) return "#94A3B8";
    if (i === 2) return "rgba(244,169,50,0.4)";
    return "transparent";
  };
  return (
    <TeacherShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: T.textPrimary }}>Class Leaderboard</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
            {(["all", "week"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: "6px 14px", background: mode === m ? T.primary : "transparent", color: mode === m ? "#fff" : T.textSecondary, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {m === "all" ? "All Time" : "This Week"}
              </button>
            ))}
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
            <option value="">All Classes</option>
            {groups.map((g) => <option key={g.class_group} value={g.class_group}>{g.class_group}</option>)}
          </select>
        </div>
      </div>
      {error ? <ErrorState message={error} onRetry={() => load(classFilter || undefined)} /> :
       loading ? <SkeletonBlock height={400} /> :
       sorted.length === 0 ? <EmptyState title="No leaderboard data yet" description="Students will appear here once they start earning XP." /> : (
        <div style={{ ...cardStyle, overflow: "hidden", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.bg, color: T.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {["Rank", "Student", "Class", "Level", "Total XP", "XP This Week"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const accent = rankAccent(i);
                const bg = i === 0 ? T.goldLight : "#fff";
                return (
                  <tr key={s.id} style={{ background: bg, borderTop: `1px solid ${T.border}`, borderLeft: `4px solid ${accent}` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: 16, color: T.textPrimary, width: 60 }}>#{i + 1}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: T.primaryLight, color: T.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {initialsOf(s.display_name)}
                        </div>
                        <div style={{ fontWeight: 600, color: T.textPrimary }}>{s.display_name}</div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: T.textSecondary }}>{s.class_group}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: T.primaryLight, color: T.primary }}>
                        L{s.level} {levelName(s.level)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: T.textPrimary }}>{s.xp_total.toLocaleString()}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: T.green }}>+{s.weekly_xp.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
       )}
    </TeacherShell>
  );
}
