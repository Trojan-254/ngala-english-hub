import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, X } from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle } from "@/components/teacher/tokens";
import { SkeletonBlock, EmptyState, ErrorState } from "@/components/teacher/StatusViews";
import {
  PrimaryButton, GhostButton, QuestionTypeSelector, MCQForm, OpenEndedForm,
  DifficultySelector, CurriculumSelector, inputStyle, labelStyle,
  difficultyPill, typePill, InlineDeleteButton, MCQFields, OpenFields,
} from "@/components/teacher/content/FormControls";
import { contentApi, Question, QuestionType, Difficulty, Curriculum, Topic } from "@/lib/contentApi";
const emptyMCQ: MCQFields = { options: ["", "", "", ""], correct_answer: "", explanation: "", xp_reward: 10 };
const emptyOpen: OpenFields = { model_answer: "", max_marks: 5, xp_reward: 10 };
export default function GrammarContent() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [qError, setQError] = useState<string | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [qType, setQType] = useState<QuestionType>("mcq");
  const [questionText, setQuestionText] = useState("");
  const [mcq, setMcq] = useState<MCQFields>(emptyMCQ);
  const [open, setOpen] = useState<OpenFields>(emptyOpen);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [curriculum, setCurriculum] = useState<Curriculum>("both");
  const [source, setSource] = useState("");
  const [addedCount, setAddedCount] = useState(0);
  useEffect(() => { loadTopics(); }, []);
  async function loadTopics() {
    try {
      setTopicsError(null);
      const data = await contentApi.getGrammarTopics();
      setTopics(data.topics);
    } catch (e) {
      setTopicsError((e as Error).message);
      setTopics([]);
    }
  }
  async function loadQuestions(t: Topic) {
    setLoadingQ(true); setQError(null);
    try {
      const data = await contentApi.getQuestions(t.id);
      setQuestions(data.questions);
    } catch (e) {
      setQError((e as Error).message); setQuestions([]);
    } finally { setLoadingQ(false); }
  }
  function selectTopic(t: Topic) {
    setActiveTopic(t);
    setQuestions(null);
    loadQuestions(t);
  }
  function openCreate() {
    setEditingId(null);
    setQType("mcq"); setQuestionText("");
    setMcq(emptyMCQ); setOpen(emptyOpen);
    setDifficulty(2); setCurriculum("both"); setSource("");
    setDrawerOpen(true);
  }
  function openEdit(q: Question) {
    setEditingId(q.id);
    setQType(q.question_type);
    setQuestionText(q.question_text);
    if (q.question_type === "mcq") {
      setMcq({
        options: q.options ?? ["", "", "", ""],
        correct_answer: q.correct_answer ?? "",
        explanation: q.explanation ?? "",
        xp_reward: q.xp_reward,
      });
    } else {
      setOpen({
        model_answer: q.explanation ?? "",
        max_marks: q.max_marks ?? 5,
        xp_reward: q.xp_reward,
      });
    }
    setDifficulty(q.difficulty);
    setCurriculum(q.curriculum);
    setSource(q.source ?? "");
    setDrawerOpen(true);
  }
  async function handleSave() {
    if (!activeTopic) return;
    if (!questionText.trim()) { toast.error("Question text is required"); return; }
    const base = {
      topic_id: activeTopic.id,
      question_text: questionText.trim(),
      question_type: qType,
      difficulty, curriculum,
      source: source.trim() || null,
    };
    const payload = qType === "mcq"
      ? {
          ...base,
          options: mcq.options,
          correct_answer: mcq.correct_answer,
          explanation: mcq.explanation,
          xp_reward: mcq.xp_reward,
          max_marks: null,
        }
      : {
          ...base,
          options: null,
          correct_answer: null,
          explanation: open.model_answer,
          xp_reward: open.xp_reward,
          max_marks: open.max_marks,
        };
    try {
      if (editingId) {
        await contentApi.updateQuestion(editingId, payload);
        toast.success("Question updated");
        setDrawerOpen(false);
      } else {
        await contentApi.createQuestion(payload);
        toast.success("Question added");
        setAddedCount((c) => c + 1);
        setQuestionText("");
        setMcq(emptyMCQ);
        setOpen(emptyOpen);
      }
      loadQuestions(activeTopic);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function handleDelete(id: number) {
    try {
      await contentApi.deleteQuestion(id);
      toast.success("Question deleted");
      if (activeTopic) loadQuestions(activeTopic);
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <TeacherShell>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>Grammar Questions</h1>
      <p style={{ color: T.textSecondary, marginTop: 6, fontSize: 14 }}>
        Pick a topic to view and manage its MCQ and open-ended questions.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginTop: 24, alignItems: "start" }}>
        <aside style={{ ...cardStyle, padding: 12, maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: T.textMuted, padding: "4px 8px 10px" }}>
            Topics
          </div>
          {topicsError && <ErrorState message={topicsError} onRetry={loadTopics} />}
          {!topics && !topicsError && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={48} />)}
            </div>
          )}
          {topics && topics.length === 0 && !topicsError && (
            <div style={{ fontSize: 13, color: T.textSecondary, padding: 12 }}>No grammar topics found.</div>
          )}
          {topics?.map((t) => {
            const active = activeTopic?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => selectTopic(t)}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 12px",
                  borderRadius: 8, marginBottom: 4, cursor: "pointer",
                  background: active ? T.primaryLight : "transparent",
                  borderLeft: `3px solid ${active ? T.primary : "transparent"}`,
                  border: "none", borderLeftWidth: 3, borderLeftStyle: "solid",
                  borderLeftColor: active ? T.primary : "transparent",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: T.textPrimary }}>{t.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                  {difficultyPill(t.difficulty)}
                  {t.question_count !== undefined && (
                    <span style={{ background: T.primaryLight, color: T.primary, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>
                      {t.question_count} Qs
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </aside>
        <section>
          {!activeTopic && (
            <EmptyState title="Select a topic" description="Select a topic from the left to view and add questions." />
          )}
          {activeTopic && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{activeTopic.title}</h2>
                <PrimaryButton onClick={openCreate}><Plus size={14} style={{ verticalAlign: -2 }} /> Add Question</PrimaryButton>
              </div>
              {qError && <ErrorState message={qError} onRetry={() => loadQuestions(activeTopic)} />}
              {loadingQ && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={56} />)}
                </div>
              )}
              {!loadingQ && questions && questions.length === 0 && (
                <EmptyState title="No questions yet" description="Add the first question for this topic." />
              )}
              {!loadingQ && questions && questions.length > 0 && (
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.bg }}>
                        <Th>Question</Th><Th>Type</Th><Th>Difficulty</Th><Th>XP</Th><Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.id} style={{ borderTop: `1px solid ${T.border}` }}>
                          <Td>{q.question_text.length > 80 ? q.question_text.slice(0, 80) + "..." : q.question_text}</Td>
                          <Td>{typePill(q.question_type)}</Td>
                          <Td>{difficultyPill(q.difficulty)}</Td>
                          <Td>{q.xp_reward}</Td>
                          <Td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEdit(q)} style={iconBtn}><Pencil size={14} /></button>
                              <InlineDeleteButton onConfirm={() => handleDelete(q.id)} />
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {drawerOpen && (
        <Drawer onClose={() => setDrawerOpen(false)} title={editingId ? "Edit Question" : "Add Question"} subtitle={!editingId && addedCount > 0 ? `${addedCount} added this session` : undefined}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Question Text</label>
              <textarea rows={4} style={{ ...inputStyle, resize: "vertical" }} value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Question Type</label>
              <QuestionTypeSelector value={qType} onChange={setQType} />
            </div>
            {qType === "mcq" ? <MCQForm value={mcq} onChange={setMcq} /> : <OpenEndedForm value={open} onChange={setOpen} />}
            <div>
              <label style={labelStyle}>Difficulty</label>
              <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>
            <div>
              <label style={labelStyle}>Curriculum</label>
              <CurriculumSelector value={curriculum} onChange={setCurriculum} />
            </div>
            <div>
              <label style={labelStyle}>Source (optional)</label>
              <input style={inputStyle} placeholder="e.g. KCSE 2022 Paper 1 Q3" value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
              <PrimaryButton onClick={handleSave}>Save Question</PrimaryButton>
              <GhostButton onClick={() => setDrawerOpen(false)}>Cancel</GhostButton>
            </div>
          </div>
        </Drawer>
      )}
    </TeacherShell>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: T.textMuted, letterSpacing: 0.6 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 14px", color: T.textPrimary, verticalAlign: "middle" }}>{children}</td>;
}
const iconBtn: React.CSSProperties = {
  background: "transparent", border: `1px solid ${T.border}`,
  padding: "6px 8px", borderRadius: 6, cursor: "pointer",
  color: T.textSecondary, fontFamily: "inherit",
};
export function Drawer({ children, onClose, title, subtitle }: { children: React.ReactNode; onClose: () => void; title: string; subtitle?: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)" }} />
      <aside style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 480,
        background: T.surface, boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textSecondary }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>{children}</div>
      </aside>
    </div>
  );
}
