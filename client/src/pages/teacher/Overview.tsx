import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { teacherApi, Overview, ModuleStat, WeakTopic, Student } from "@/lib/teacherApi";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle, moduleLabel, accuracyColor, initialsOf, relativeTime } from "@/components/teacher/tokens";
import CountUp from "@/components/teacher/CountUp";
import { SkeletonBlock, ErrorState } from "@/components/teacher/StatusViews";
import ChallengeModal, { ChallengePrefill } from "@/components/teacher/ChallengeModal";
export default function TeacherOverview() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [modules, setModules] = useState<ModuleStat[] | null>(null);
  const [weak, setWeak] = useState<WeakTopic[] | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ChallengePrefill | null>(null);
  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      teacherApi.overview(),
      teacherApi.moduleStats(),
      teacherApi.weakTopics(),
      teacherApi.students(),
    ])
      .then(([o, m, w, s]) => {
        setOverview(o);
        setModules(m.module_stats);
        setWeak(w.weak_topics);
        setStudents(s.students);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };
  return (
    <TeacherShell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
          {greeting()}, {user?.display_name || user?.username}
        </h1>
        <div style={{ color: T.textSecondary, fontSize: 14, marginTop: 4 }}>
          Here is how your class is performing today.
        </div>
      </div>
      {error && <ErrorState message={error} onRetry={load} />}
      {!error && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <StatsRow loading={loading} overview={overview} />
            <ModulePerformance loading={loading} modules={modules} />
            <WeakAreasList loading={loading} topics={weak} onDrill={setChallenge} />
          </div>
          <RecentActivity loading={loading} students={students} />
        </div>
      )}
      <ChallengeModal open={!!challenge} prefill={challenge} onClose={() => setChallenge(null)} />
    </TeacherShell>
  );
}
function StatsRow({ loading, overview }: { loading: boolean; overview: Overview | null }) {
  const cards = [
    { color: T.primary, label: "Total Students", value: overview?.total_students ?? 0, suffix: "" },
    { color: T.green, label: "Active Today", value: overview?.active_today ?? 0, suffix: "" },
    { color: T.gold, label: "Weekly Attempts", value: overview?.weekly_attempts ?? 0, suffix: "" },
    { color: T.red, label: "Weekly Accuracy", value: overview?.weekly_accuracy ?? 0, suffix: "%" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {cards.map((c) => (
        <div key={c.label} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ height: 4, background: c.color }} />
          <div style={{ padding: 20 }}>
            {loading ? (
              <SkeletonBlock height={36} />
            ) : (
              <div style={{ fontSize: 32, fontWeight: 800, color: T.textPrimary, lineHeight: 1 }}>
                <CountUp value={c.value} suffix={c.suffix} />
              </div>
            )}
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {c.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function ModulePerformance({ loading, modules }: { loading: boolean; modules: ModuleStat[] | null }) {
  const slugs = ["grammar", "comprehension", "pastpapers", "vocabulary"];
  const byslug = new Map((modules ?? []).map((m) => [m.module_slug, m]));
  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 16 }}>Module Performance This Week</div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slugs.map((s) => <SkeletonBlock key={s} height={40} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {slugs.map((slug) => {
            const m = byslug.get(slug);
            const pct = m?.accuracy_pct ?? 0;
            const color = m ? accuracyColor(pct) : T.border;
            return (
              <div key={slug} style={{ display: "grid", gridTemplateColumns: "180px 1fr 70px", gap: 16, alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{moduleLabel(slug)}</div>
                <div>
                  <div style={{ height: 8, background: T.bg, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 600ms ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                    {m ? `${m.total_attempts} attempts · ${m.unique_students} students` : "No attempts yet"}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, textAlign: "right" }}>{m ? `${pct}%` : "—"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function WeakAreasList({ loading, topics, onDrill }: { loading: boolean; topics: WeakTopic[] | null; onDrill: (p: ChallengePrefill) => void }) {
  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>Class Weak Areas</div>
      <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 16 }}>Topics where students are struggling most.</div>
      {loading ? <SkeletonBlock height={60} /> : !topics || topics.length === 0 ? (
        <div style={{ color: T.textSecondary, fontSize: 13, padding: "16px 0" }}>No weak topics identified yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topics.slice(0, 5).map((t) => {
            const pillColor = t.accuracy_pct < 50 ? T.red : T.gold;
            return (
              <div key={`${t.module_slug}-${t.topic}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "12px 0", borderTop: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{t.topic}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                    <span style={{ padding: "2px 8px", background: T.primaryLight, color: T.primary, borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{moduleLabel(t.module_slug)}</span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{t.students_attempted} students</span>
                    <span style={{ padding: "2px 8px", background: pillColor, color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{t.accuracy_pct}%</span>
                  </div>
                </div>
                <button
                  onClick={() => onDrill({ module_slug: t.module_slug, topic_label: t.topic })}
                  style={{ padding: "6px 12px", border: `1px solid ${T.primary}`, color: T.primary, background: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Drill this class →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function RecentActivity({ loading, students }: { loading: boolean; students: Student[] | null }) {
  const recent = (students ?? [])
    .slice()
    .sort((a, b) => {
      const ta = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
      const tb = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 8);
  return (
    <div style={{ ...cardStyle, padding: 20, position: "sticky", top: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>Recent Activity</div>
      {loading ? <SkeletonBlock height={200} /> : recent.length === 0 ? (
        <div style={{ color: T.textSecondary, fontSize: 13 }}>No activity yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recent.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: T.primaryLight, color: T.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {initialsOf(s.display_name || s.username)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.display_name || s.username}</div>
                <div style={{ fontSize: 11, color: s.last_login_at ? T.textMuted : T.red }}>
                  {s.class_group ? `${s.class_group} · ` : ""}{s.last_login_at ? `Last seen ${relativeTime(s.last_login_at)}` : "Never logged in"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
