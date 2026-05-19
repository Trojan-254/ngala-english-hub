import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, ScrollText, BookA, ArrowRight } from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle } from "@/components/teacher/tokens";
import { SkeletonBlock } from "@/components/teacher/StatusViews";
import { contentApi } from "@/lib/contentApi";
interface Counts {
  grammar: number | null;
  passages: number | null;
  papers: number | null;
  vocab: number | null;
  pendingMarks: number | null;
}
export default function ContentHub() {
  const [counts, setCounts] = useState<Counts>({ grammar: null, passages: null, papers: null, vocab: null, pendingMarks: null });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const safe = async <T,>(p: Promise<T>): Promise<T | null> => {
        try { return await p; } catch { return null; }
      };
      const [q, ps, pp, vo, mq] = await Promise.all([
        safe(contentApi.getQuestions(undefined, "grammar")),
        safe(contentApi.getPassages()),
        safe(contentApi.getPapers()),
        safe(contentApi.getVocabulary()),
        safe(contentApi.getMarkingQueue("pending")),
      ]);
      if (cancelled) return;
      setCounts({
        grammar: q?.questions.length ?? 0,
        passages: ps?.passages.length ?? 0,
        papers: pp?.papers.length ?? 0,
        vocab: vo?.words.length ?? 0,
        pendingMarks: mq?.queue.length ?? 0,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return (
    <TeacherShell>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: 0, color: T.textPrimary }}>Content Management</h1>
      <p style={{ color: T.textSecondary, marginTop: 6, fontSize: 14 }}>
        Add and manage all learning content for your students.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        <ModuleCard
          strip={T.primary}
          Icon={BookOpen}
          title="Grammar Questions"
          description="Add MCQ questions to grammar topics. Students practice tenses, articles, concord and more."
          stat={loading ? null : `${counts.grammar} questions`}
          to="/teacher/content/grammar"
          ctaLabel="Manage Questions"
        />
        <ModuleCard
          strip={T.green}
          Icon={FileText}
          title="Passages & Questions"
          description="Add reading passages and the questions that accompany them."
          stat={loading ? null : `${counts.passages} passages`}
          to="/teacher/content/comprehension"
          ctaLabel="Manage Passages"
        />
        <ModuleCard
          strip={T.purple}
          Icon={ScrollText}
          title="Past Papers"
          description="Add KCSE past paper questions. MCQ questions are auto-marked. Open-ended answers go to the marking queue."
          stat={loading ? null : `${counts.papers} papers`}
          to="/teacher/content/pastpapers"
          ctaLabel="Manage Papers"
          secondary={{ label: "Marking Queue", to: "/teacher/content/pastpapers?tab=marking", badge: counts.pendingMarks ?? 0 }}
        />
        <ModuleCard
          strip={T.gold}
          Icon={BookA}
          title="Vocabulary Bank"
          description="Add words students will encounter in the Vocabulary Builder module with daily spaced repetition."
          stat={loading ? null : `${counts.vocab} words`}
          to="/teacher/content/vocabulary"
          ctaLabel="Manage Words"
        />
      </div>
    </TeacherShell>
  );
}
function ModuleCard({ strip, Icon, title, description, stat, to, ctaLabel, secondary }: {
  strip: string;
  Icon: typeof BookOpen;
  title: string;
  description: string;
  stat: string | null;
  to: string;
  ctaLabel: string;
  secondary?: { label: string; to: string; badge: number };
}) {
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
      <div style={{ height: 4, background: strip }} />
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={20} color={strip} />
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: T.textPrimary }}>{title}</h3>
        </div>
        <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>{description}</p>
        <div style={{ marginTop: 14, marginBottom: 16 }}>
          {stat === null
            ? <SkeletonBlock height={18} width={120} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{stat}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to={to}
            style={{
              flex: secondary ? "0 0 auto" : 1, textAlign: "center",
              background: T.primary, color: "#fff", padding: "9px 14px",
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
            }}
          >
            {ctaLabel} <ArrowRight size={14} />
          </Link>
          {secondary && (
            <Link
              to={secondary.to}
              style={{
                flex: 1, textAlign: "center",
                background: T.surface, color: T.textPrimary,
                border: `1px solid ${T.border}`, padding: "9px 14px",
                borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
              }}
            >
              {secondary.label}
              {secondary.badge > 0 && (
                <span style={{
                  background: T.red, color: "#fff", borderRadius: 999,
                  padding: "1px 7px", fontSize: 11, fontWeight: 700,
                }}>{secondary.badge}</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
