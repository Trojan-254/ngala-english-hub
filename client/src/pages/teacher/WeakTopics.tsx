import { useEffect, useState } from "react";
import { teacherApi, WeakTopic, ClassGroupInfo } from "@/lib/teacherApi";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle, accuracyColor, moduleLabel } from "@/components/teacher/tokens";
import { SkeletonBlock, ErrorState, EmptyState } from "@/components/teacher/StatusViews";
import ChallengeModal, { ChallengePrefill } from "@/components/teacher/ChallengeModal";
export default function WeakTopicsPage() {
  const [topics, setTopics] = useState<WeakTopic[] | null>(null);
  const [groups, setGroups] = useState<ClassGroupInfo[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ChallengePrefill | null>(null);
  const load = (cg?: string) => {
    setLoading(true); setError(null);
    teacherApi.weakTopics(cg)
      .then((r) => setTopics(r.weak_topics))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { teacherApi.classGroups().then((r) => setGroups(r.class_groups)).catch(() => setGroups([])); }, []);
  useEffect(() => { load(classFilter || undefined); }, [classFilter]);
  return (
    <TeacherShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: T.textPrimary }}>Class Weak Areas</h1>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: "#fff", fontFamily: "inherit" }}>
          <option value="">All Classes</option>
          {groups.map((g) => <option key={g.class_group} value={g.class_group}>{g.class_group}</option>)}
        </select>
      </div>
      {error ? <ErrorState message={error} onRetry={() => load(classFilter || undefined)} /> :
       loading ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[0,1,2,3].map(i => <SkeletonBlock key={i} height={120} />)}</div> :
       !topics || topics.length === 0 ? (
         <EmptyState title="No weak topics identified yet" description="Students need to complete at least 5 attempts on a topic for it to appear here." />
       ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topics.map((t, i) => {
            const color = accuracyColor(t.accuracy_pct);
            return (
              <div key={`${t.module_slug}-${t.topic}`} className="flex flex-col sm:grid sm:items-center gap-4" style={{ ...cardStyle, padding: 20, gridTemplateColumns: "70px 1fr auto" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: T.textMuted, lineHeight: 1, textAlign: "center" }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{t.topic}</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 10px", background: T.primaryLight, color: T.primary, borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{moduleLabel(t.module_slug)}</span>
                    <span style={{ padding: "2px 10px", background: color, color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{t.accuracy_pct}% accuracy</span>
                    <span style={{ fontSize: 12, color: T.textSecondary }}>{t.total_attempts} attempts</span>
                    <span style={{ fontSize: 12, color: T.textSecondary }}>{t.students_attempted} students</span>
                  </div>
                  <div style={{ marginTop: 12, height: 8, background: T.bg, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${t.accuracy_pct}%`, background: color }} />
                  </div>
                </div>
                <button
                  onClick={() => setChallenge({ module_slug: t.module_slug, topic_label: t.topic })}
                  style={{ padding: "8px 14px", background: T.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  Drill This Topic →
                </button>
              </div>
            );
          })}
        </div>
       )}
      <ChallengeModal open={!!challenge} prefill={challenge} onClose={() => setChallenge(null)} />
    </TeacherShell>
  );
}
