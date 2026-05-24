import { useEffect, useRef, useState } from "react";
import { Crown, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/ngala/Sidebar";
import { api, LeaderboardEntry } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meRowRef = useRef<HTMLTableRowElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.misc.leaderboard();
      setRows(res.leaderboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!rows || !user) return;
    const idx = rows.findIndex((r) => r.display_name === user.display_name);
    if (idx >= 5 && meRowRef.current) {
      meRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [rows, user]);

  const levelPill = (lvl: number): string => {
    if (lvl >= 4) return "bg-primary/10 text-primary";
    if (lvl === 3) return "bg-secondary/15 text-warm-orange";
    return "bg-muted text-muted-foreground";
  };

  const rankStyle = (rank: number): { row: string; border: string } => {
    if (rank === 1) return { row: "bg-secondary/10", border: "border-l-4 border-secondary" };
    if (rank === 2) return { row: "bg-muted/40", border: "border-l-4 border-muted-foreground/50" };
    if (rank === 3) return { row: "bg-secondary/5", border: "border-l-4 border-secondary/40" };
    return { row: "", border: "border-l-4 border-transparent" };
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-8 py-8 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">Weekly Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Resets every Monday. Compete with your classmates.</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">This Week</button>
            <button disabled className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground opacity-50">All Time</button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rank</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Student</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Class</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Level</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">XP This Week</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-5 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <AlertCircle className="w-5 h-5 text-destructive mx-auto" />
                      <p className="mt-2 text-sm font-semibold text-foreground">Could not load leaderboard</p>
                      <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                      <button onClick={() => void load()} className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                        Retry
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && rows && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No activity this week yet. Answer some questions to get on the board!
                    </td>
                  </tr>
                )}

                {!loading && !error && rows && rows.map((r, i) => {
                  const rank = i + 1;
                  const isMe = user?.display_name === r.display_name;
                  const rs = rankStyle(rank);
                  const meCls = isMe ? "bg-primary/10 border-l-4 border-primary" : `${rs.row} ${rs.border}`;
                  return (
                    <tr
                      key={r.id}
                      ref={isMe ? meRowRef : undefined}
                      className={`border-b border-border last:border-b-0 ${meCls}`}
                      style={{ opacity: 0, animation: `fade-in 0.3s ease-out ${i * 40}ms forwards` }}
                    >
                      <td className="px-5 py-3 font-bold tabular-nums">
                        <span className="inline-flex items-center gap-2">
                          {rank === 1 && <Crown className="w-4 h-4 text-secondary" />}
                          {rank}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-sm ${isMe ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                        {r.display_name}
                        {isMe && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">YOU</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{r.class_group ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${levelPill(r.level)}`}>Lv.{r.level}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold tabular-nums text-success">
                        +{r.weekly_xp.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
