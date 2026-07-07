import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle } from "@/components/teacher/tokens";
import { SkeletonBlock, EmptyState, ErrorState } from "@/components/teacher/StatusViews";
import {
  PrimaryButton, GhostButton, QuestionTypeSelector, MCQForm, OpenEndedForm,
  DifficultySelector, CurriculumSelector, inputStyle, labelStyle,
  InlineDeleteButton, MCQFields, OpenFields,
} from "@/components/teacher/content/FormControls";
import { contentApi, PastPaper, QuestionType, Difficulty, Curriculum, MarkingQueueItem } from "@/lib/contentApi";
const emptyMCQ: MCQFields = { options: ["", "", "", ""], correct_answer: "", explanation: "", xp_reward: 10 };
const emptyOpen: OpenFields = { model_answer: "", max_marks: 5, xp_reward: 10 };
type Tab = "papers" | "marking";
export default function PastPapersContent() {
  const initial: Tab = new URLSearchParams(window.location.search).get("tab") === "marking" ? "marking" : "papers";
  const [tab, setTab] = useState<Tab>(initial);
  return (
    <TeacherShell>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>Past Papers</h1>
      <p style={{ color: T.textSecondary, marginTop: 6, fontSize: 14 }}>
        Manage KCSE papers and review open-ended student answers awaiting marks.
      </p>
      <div style={{ display: "flex", gap: 4, marginTop: 18, borderBottom: `1px solid ${T.border}` }}>
        <TabBtn active={tab === "papers"} onClick={() => setTab("papers")}>Papers</TabBtn>
        <TabBtn active={tab === "marking"} onClick={() => setTab("marking")}>Marking Queue</TabBtn>
      </div>
      <div style={{ marginTop: 22 }}>
        {tab === "papers" ? <PapersTab /> : <MarkingTab />}
      </div>
    </TeacherShell>
  );
}
function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", border: "none",
        padding: "10px 16px", cursor: "pointer", fontFamily: "inherit",
        fontSize: 13, fontWeight: 600,
        color: active ? T.primary : T.textSecondary,
        borderBottom: `2px solid ${active ? T.primary : "transparent"}`,
        marginBottom: -1,
      }}
    >{children}</button>
  );
}
function PapersTab() {
  const [papers, setPapers] = useState<PastPaper[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  useEffect(() => { load(); }, []);
  async function load() {
    try { setError(null); const data = await contentApi.getPapers(); setPapers(data.papers); }
    catch (e) { setError((e as Error).message); setPapers([]); }
  }
  const grouped = useMemo(() => {
    const map = new Map<number, PastPaper[]>();
    (papers ?? []).forEach((p) => {
      if (!map.has(p.year)) map.set(p.year, []);
      map.get(p.year)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [papers]);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <PrimaryButton onClick={() => setShowNew((s) => !s)}><Plus size={14} style={{ verticalAlign: -2 }} /> Create New Paper</PrimaryButton>
      </div>
      {showNew && <NewPaperForm onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!papers && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} height={90} />)}
        </div>
      )}
      {papers && papers.length === 0 && !error && (
        <EmptyState title="No papers yet" description="Create your first past paper to start adding questions." />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {grouped.map(([year, list]) => (
          <div key={year}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: T.textMuted, marginBottom: 8 }}>{year}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.map((p) => (
                <div key={p.id} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
                        Paper {p.paper_number} · {p.duration_minutes} min · {p.mcq_count} MCQ · {p.open_count} Open
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        style={{ background: T.primary, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}
                      >
                        {expandedId === p.id ? "Close" : "Add Questions"}
                      </button>
                      <InlineDeleteButton onConfirm={async () => { try { await contentApi.deletePaper(p.id); toast.success("Paper deleted"); load(); } catch (e) { toast.error((e as Error).message); } }} />
                    </div>
                  </div>
                  {expandedId === p.id && <PaperQuestionForm paperId={p.id} onAdded={load} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
function NewPaperForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [paperNum, setPaperNum] = useState<1 | 2>(1);
  const [title, setTitle] = useState(`KCSE ${thisYear} English Paper 1`);
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState(150);
  async function save() {
    try {
      await contentApi.createPaper({ title: title.trim(), year, paper_number: paperNum, description: desc.trim() || undefined, duration_minutes: duration });
      toast.success("Paper created");
      onCreated();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div style={{ ...cardStyle, padding: 18, marginBottom: 14 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Year</label>
          <input type="number" style={inputStyle} value={year} onChange={(e) => {
            const y = Number(e.target.value); setYear(y); setTitle(`KCSE ${y} English Paper ${paperNum}`);
          }} />
        </div>
        <div>
          <label style={labelStyle}>Paper Number</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2].map((n) => (
              <button key={n} type="button" onClick={() => { setPaperNum(n as 1 | 2); setTitle(`KCSE ${year} English Paper ${n}`); }}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${paperNum === n ? T.primary : T.border}`,
                  background: paperNum === n ? T.primaryLight : T.surface,
                  color: paperNum === n ? T.primary : T.textSecondary,
                  fontWeight: paperNum === n ? 700 : 500, fontSize: 13, fontFamily: "inherit",
                }}>Paper {n}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Duration (minutes)</label>
          <input type="number" style={inputStyle} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <PrimaryButton onClick={save}>Create Paper</PrimaryButton>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
      </div>
    </div>
  );
}
function PaperQuestionForm({ paperId, onAdded }: { paperId: number; onAdded: () => void }) {
  const [qNum, setQNum] = useState("");
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<QuestionType>("mcq");
  const [mcq, setMcq] = useState<MCQFields>(emptyMCQ);
  const [open, setOpen] = useState<OpenFields>(emptyOpen);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [curriculum, setCurriculum] = useState<Curriculum>("both");
  const [count, setCount] = useState(0);
  async function add() {
    if (!qText.trim()) { toast.error("Question text is required"); return; }
    const payload = qType === "mcq"
      ? {
          question_text: qText.trim(), question_type: "mcq" as const,
          options: mcq.options, correct_answer: mcq.correct_answer,
          explanation: mcq.explanation, xp_reward: mcq.xp_reward,
          difficulty, source: qNum.trim() || null, curriculum, max_marks: null,
        }
      : {
          question_text: qText.trim(), question_type: qType,
          options: null, correct_answer: null,
          explanation: open.model_answer, xp_reward: open.xp_reward,
          difficulty, source: qNum.trim() || null, curriculum, max_marks: open.max_marks,
        };
    try {
      await contentApi.addPaperQuestion(paperId, payload);
      toast.success("Question added");
      setCount((c) => c + 1);
      setQNum(""); setQText(""); setMcq(emptyMCQ); setOpen(emptyOpen);
      onAdded();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div style={{ padding: 18, background: T.bg, borderTop: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
          <div>
            <label style={labelStyle}>Question Number</label>
            <input style={inputStyle} placeholder="e.g. 1(a)" value={qNum} onChange={(e) => setQNum(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Question Text</label>
            <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={qText} onChange={(e) => setQText(e.target.value)} required />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Question Type</label>
          <QuestionTypeSelector value={qType} onChange={setQType} />
        </div>
        {qType === "mcq" ? <MCQForm value={mcq} onChange={setMcq} /> : <OpenEndedForm value={open} onChange={setOpen} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><DifficultySelector value={difficulty} onChange={setDifficulty} /></div>
          <div><label style={labelStyle}>Curriculum</label><CurriculumSelector value={curriculum} onChange={setCurriculum} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6 }}>
          <span style={{ fontSize: 12, color: T.textSecondary }}>{count} question{count === 1 ? "" : "s"} added so far</span>
          <PrimaryButton onClick={add}>Add Question</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
function MarkingTab() {
  const [filter, setFilter] = useState<"pending" | "marked">("pending");
  const [items, setItems] = useState<MarkingQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { load(); }, [filter]);
  async function load() {
    setItems(null); setError(null);
    try { const data = await contentApi.getMarkingQueue(filter); setItems(data.queue); }
    catch (e) { setError((e as Error).message); setItems([]); }
  }
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <FilterPill active={filter === "pending"} onClick={() => setFilter("pending")}>Pending {items && filter === "pending" ? `(${items.length})` : ""}</FilterPill>
        <FilterPill active={filter === "marked"} onClick={() => setFilter("marked")}>Marked</FilterPill>
      </div>
      {error && <ErrorState message={error} onRetry={load} />}
      {!items && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 2 }).map((_, i) => <SkeletonBlock key={i} height={220} />)}
        </div>
      )}
      {items && items.length === 0 && filter === "pending" && (
        <div style={{ ...cardStyle, padding: 40, textAlign: "center" }}>
          <CheckCircle2 size={32} color={T.green} style={{ margin: "0 auto" }} />
          <div style={{ marginTop: 10, fontWeight: 700, color: T.textPrimary }}>No answers pending review. Well done!</div>
        </div>
      )}
      {items && items.length === 0 && filter === "marked" && (
        <EmptyState title="Nothing marked yet" description="Once you mark answers they will appear here." />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items?.map((it) => (
          <MarkingCard key={it.attempt_id} item={it} readOnly={filter === "marked"} onMarked={load} />
        ))}
      </div>
    </>
  );
}
function FilterPill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 999, cursor: "pointer",
      border: `1px solid ${active ? T.primary : T.border}`,
      background: active ? T.primaryLight : T.surface,
      color: active ? T.primary : T.textSecondary,
      fontWeight: active ? 700 : 500, fontSize: 12, fontFamily: "inherit",
    }}>{children}</button>
  );
}
function MarkingCard({ item, readOnly, onMarked }: { item: MarkingQueueItem; readOnly: boolean; onMarked: () => void }) {
  const [showGuide, setShowGuide] = useState(false);
  const [marks, setMarks] = useState<number>(item.marks_awarded ?? 0);
  const [feedback, setFeedback] = useState<string>(item.teacher_feedback ?? "");
  const [removing, setRemoving] = useState(false);
  const maxMarks = item.question_max_marks ?? item.max_marks ?? 5;
  async function submit() {
    if (marks < 0 || marks > maxMarks) { toast.error(`Marks must be between 0 and ${maxMarks}`); return; }
    try {
      await contentApi.markAnswer(item.attempt_id, marks, feedback.trim() || undefined);
      toast.success("Marks submitted");
      setRemoving(true);
      setTimeout(onMarked, 300);
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div style={{
      ...cardStyle, padding: 18,
      transition: "all 300ms ease",
      opacity: removing ? 0 : 1, transform: removing ? "translateX(40px)" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{item.student_name}</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>{item.class_group}</div>
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, textAlign: "right" }}>{item.paper_title ?? "—"}</div>
      </div>
      <div style={{ marginTop: 14, padding: 12, background: T.primaryLight, borderRadius: 8, fontSize: 14, color: T.textPrimary }}>
        {item.question_text}
      </div>
      <div style={{ marginTop: 12, padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {item.open_answer}
      </div>
      {item.model_answer && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowGuide((s) => !s)} style={{ background: "transparent", border: "none", color: T.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {showGuide ? "Hide" : "Show"} marking guide
          </button>
          {showGuide && (
            <div style={{ marginTop: 8, padding: 12, background: T.goldLight, borderRadius: 8, fontSize: 13, color: T.textPrimary, whiteSpace: "pre-wrap" }}>
              {item.model_answer}
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle}>Marks awarded</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min={0} max={maxMarks} disabled={readOnly} style={{ ...inputStyle, width: 80 }} value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
            <span style={{ fontSize: 12, color: T.textMuted }}>/ {maxMarks} marks</span>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Optional feedback to student</label>
          <textarea rows={2} disabled={readOnly} style={{ ...inputStyle, resize: "vertical" }} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      </div>
      {!readOnly && (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <PrimaryButton onClick={submit}>Submit Marks</PrimaryButton>
        </div>
      )}
    </div>
  );
}
