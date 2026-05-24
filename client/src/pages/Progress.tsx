import { useEffect, useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/ngala/Sidebar";
import { CountUp } from "@/components/ngala/CountUp";
import { api, ModuleProgress, Badge, XpHistory } from "@/lib/api";

interface ProgressResponse {
  user: { id: number; display_name: string; level: number; xp_total: number; weekly_xp: number };
  modules: ModuleProgress[];
  badges: Badge[];
  xp_history: XpHistory[];
  vocab: { words_reviewed: number; words_mastered: number };
}

const LEVEL_NAMES = ["Apprentice", "Apprentice", "Scribe", "Wordsmith", "Scholar", "Griot"];

const MODULES: { slug: string; label: string }[] = [
  { slug: "grammar", label: "Grammar Drills" },
  { slug: "comprehension", label: "Reading Comprehension" },
  { slug: "pastpapers", label: "Past Papers" },
  { slug: "vocabulary", label: "Vocabulary Builder" },
];

const ALL_BADGES = [
  "First Step", "On a Roll", "Week Warrior", "Streak Master",
  "Grammar Ninja", "Speed Reader", "Exam Warrior", "Word Collector",
  "Lexicon Builder", "Sharp Mind", "Wordsmith", "Griot",
  "All-Rounder", "Night Owl", "Comeback Kid",
];

const relativeTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

const accuracyColor = (acc: number, attempts: number): string => {
  if (attempts === 0) return "bg-muted";
  if (acc >= 70) return "bg-success";
  if (acc >= 50) return "bg-secondary";
  return "bg-destructive";
};

const Progress = () => {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.misc.progress();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const earnedSlugs = new Set((data?.badges ?? []).map((b) => b.title));
  const lockedBadges = ALL_BADGES.filter((b) => !earnedSlugs.has(b)).slice(0, 6);
  const moreLocked = ALL_BADGES.filter((b) => !earnedSlugs.has(b)).length - lockedBadges.length;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">My Progress</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your XP, accuracy, and achievements.</p>
          </div>

          {loading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[96px] bg-card rounded-xl border border-border animate-pulse" />
                ))}
              </div>
              <div className="h-[280px] bg-card rounded-xl border border-border animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-3 h-[300px] bg-card rounded-xl border border-border animate-pulse" />
                <div className="md:col-span-2 h-[300px] bg-card rounded-xl border border-border animate-pulse" />
              </div>
            </>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Could not load progress</div>
                <div className="text-xs text-muted-foreground mt-1">{error}</div>
              </div>
              <button onClick={() => void load()} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Retry</button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Section 1: stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total XP", value: data.user.xp_total, accent: "text-warm-orange" },
                  { label: `Level ${data.user.level} · ${LEVEL_NAMES[data.user.level] ?? "Scholar"}`, value: data.user.level, accent: "text-primary" },
                  { label: "XP This Week", value: data.user.weekly_xp, accent: "text-success" },
                  { label: "Words Mastered", value: data.vocab?.words_mastered ?? 0, accent: "text-purple-deep" },
                ].map((s) => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <div className={`text-2xl font-extrabold tabular-nums ${s.accent}`}>
                      <CountUp end={s.value} />
                    </div>
                    <div className="text-xs font-medium text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Section 2: module breakdown */}
              <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <h2 className="text-base font-bold text-foreground">Performance by Module</h2>
                <div className="mt-5 space-y-5">
                  {MODULES.map(({ slug, label }) => {
                    const m = data.modules.find((mm) => mm.module_slug === slug);
                    const attempts = m?.total_attempts ?? 0;
                    const correct = m?.correct ?? 0;
                    const acc = m?.accuracy_pct ?? 0;
                    return (
                      <div key={slug}>
                        <div className="flex items-center justify-between">
                          <div className="text-[15px] font-semibold text-foreground">{label}</div>
                          {attempts === 0 ? (
                            <span className="text-xs text-muted-foreground">No attempts yet</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{relativeTime(m!.last_activity)}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-6 text-xs">
                          <span className="text-muted-foreground">Attempts: <span className="font-bold text-foreground tabular-nums">{attempts}</span></span>
                          <span className="text-muted-foreground">Correct: <span className="font-bold text-foreground tabular-nums">{correct}</span></span>
                          <span className="text-muted-foreground">Accuracy: <span className="font-bold text-foreground tabular-nums">{acc}%</span></span>
                        </div>
                        <div className="mt-2 h-2 bg-muted overflow-hidden">
                          <div className={`h-full ${accuracyColor(acc, attempts)}`} style={{ width: `${attempts === 0 ? 0 : Math.min(acc, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: XP history + badges */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-3 bg-card rounded-xl border border-border p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <h2 className="text-base font-bold text-foreground">Recent XP Activity</h2>
                  {data.xp_history.length === 0 ? (
                    <p className="mt-6 text-sm text-muted-foreground text-center">No XP earned yet. Start answering questions!</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {data.xp_history.slice(0, 20).map((h, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.xp_change >= 0 ? "bg-success" : "bg-destructive"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-success tabular-nums">{h.xp_change >= 0 ? "+" : ""}{h.xp_change} XP</span>
                              <span className="text-sm text-muted-foreground truncate">{h.reason}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{relativeTime(h.created_at)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="md:col-span-2 bg-card rounded-xl border border-border p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <h2 className="text-base font-bold text-foreground">Achievements</h2>
                  {data.badges.length === 0 && lockedBadges.length === 0 ? (
                    <p className="mt-6 text-sm text-muted-foreground text-center">Complete challenges to earn badges.</p>
                  ) : (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {data.badges.map((b) => (
                          <div key={b.slug} className="rounded-[10px] border border-border bg-card p-3 text-center">
                            <span className="text-2xl block">{b.icon}</span>
                            <div className="mt-1 text-xs font-semibold text-foreground truncate">{b.title}</div>
                            <div className="text-[11px] text-muted-foreground">Earned {relativeTime(b.earned_at)}</div>
                          </div>
                        ))}
                        {lockedBadges.map((title) => (
                          <div key={title} className="relative rounded-[10px] border border-border bg-card p-3 text-center" style={{ opacity: 0.4 }}>
                            <Lock className="w-3 h-3 text-muted-foreground mx-auto" />
                            <div className="mt-1 text-xs font-semibold text-foreground truncate">{title}</div>
                            <div className="text-[11px] text-muted-foreground">Locked</div>
                          </div>
                        ))}
                      </div>
                      {moreLocked > 0 && (
                        <p className="mt-3 text-[11px] text-muted-foreground text-center">{moreLocked} more locked</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Progress;
