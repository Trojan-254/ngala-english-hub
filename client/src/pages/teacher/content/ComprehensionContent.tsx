import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeft } from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle } from "@/components/teacher/tokens";
import { SkeletonBlock, EmptyState, ErrorState } from "@/components/teacher/StatusViews";
import {
  PrimaryButton, GhostButton, QuestionTypeSelector, MCQForm, OpenEndedForm,
  DifficultySelector, CurriculumSelector, inputStyle, labelStyle,
  difficultyPill, typePill, InlineDeleteButton, MCQFields, OpenFields,
} from "@/components/teacher/content/FormControls";
import { contentApi, Passage, PassageQuestion, QuestionType, Difficulty, Curriculum, Topic } from "@/lib/contentApi";
const emptyMCQ: MCQFields = { options: ["", "", "", ""], correct_answer: "", explanation: "", xp_reward: 10 };
const emptyOpen: OpenFields = { model_answer: "", max_marks: 5, xp_reward: 10 };
export default function ComprehensionContent() {
  const [passages, setPassages] = useState<Passage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicFilter, setTopicFilter] = useState<number | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => { load(); loadTopics(); }, []);
  async function load() {
    try { setError(null); const data = await contentApi.getPassages(); setPassages(data.passages); }
    catch (e) { setError((e as Error).message); setPassages([]); }
  }
  async function loadTopics() {
    try { const data = await contentApi.getComprehensionTopics(); setTopics(data.topics); } catch { /* empty */ }
  }
  const filtered = useMemo(
    () => (passages ?? []).filter((p) => topicFilter === undefined || p.topic_id === topicFilter),
    [passages, topicFilter],
  );
  if (selectedId !== null) {
    return <PassageDetail passageId={selectedId} onBack={() => { setSelectedId(null); load(); }} />;
  }
  return (
    <TeacherShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>Passages</h1>
          <p style={{ color: T.textSecondary, marginTop: 6, fontSize: 14 }}>
            Reading passages students will work through, each with its own set of questions.
          </p>
        </div>
        <PrimaryButton onClick={() => setShowForm((s) => !s)}>
          <Plus size={14} style={{ verticalAlign: -2 }} /> Add New Passage
        </PrimaryButton>
      </div>
      {showForm && <PassageForm topics={topics} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>Topic:</label>
        <select style={{ ...inputStyle, width: 240 }} value={topicFilter ?? ""} onChange={(e) => setTopicFilter(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      <div style={{ marginTop: 18 }}>
        {error && <ErrorState message={error} onRetry={load} />}
        {!passages && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} height={120} />)}
          </div>
        )}
        {passages && filtered.length === 0 && !error && (
          <EmptyState title="No passages yet" description="Add the first reading passage to get started." />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ ...cardStyle, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{p.title}</h3>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: T.primaryLight, color: T.primary, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{p.topic_title}</span>
                    {difficultyPill(p.difficulty)}
                    <span style={{ fontSize: 11, color: T.textMuted }}>{p.word_count} words</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{p.question_count} questions</span>
                  </div>
                  <p style={{ marginTop: 10, fontSize: 12, color: T.textSecondary, fontStyle: "italic", lineHeight: 1.5 }}>
                    {p.content.slice(0, 150)}{p.content.length > 150 ? "..." : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setSelectedId(p.id)} style={{ background: T.primary, color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                    View & Edit
                  </button>
                  <InlineDeleteButton onConfirm={async () => { try { await contentApi.deletePassage(p.id); toast.success("Passage deleted"); load(); } catch (e) { toast.error((e as Error).message); } }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TeacherShell>
  );
}
function PassageForm({ topics, onClose, onCreated }: { topics: Topic[]; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [curriculum, setCurriculum] = useState<Curriculum>("both");
  const [source, setSource] = useState("");
  const [content, setContent] = useState("");
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  async function save() {
    if (!title.trim() || !topicId || !content.trim()) { toast.error("Title, topic and content are required"); return; }
    try {
      await contentApi.createPassage({ topic_id: Number(topicId), title: title.trim(), content, difficulty, source: source.trim() || undefined, curriculum });
      toast.success("Passage created");
      onCreated();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div style={{ ...cardStyle, padding: 20, marginTop: 18 }}>
      <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>New Passage</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 14 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Topic</label>
          <select style={inputStyle} value={topicId} onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")} required>
            <option value="">Select topic</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Difficulty</label>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>
        <div>
          <label style={labelStyle}>Curriculum</label>
          <CurriculumSelector value={curriculum} onChange={setCurriculum} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Source (optional)</label>
          <input style={inputStyle} placeholder="e.g. KCSE 2021 Paper 2" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Passage Content — students will read this during the session</label>
          <textarea rows={12} style={{ ...inputStyle, resize: "vertical" }} value={content} onChange={(e) => setContent(e.target.value)} required />
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
            {wordCount} words — aim for 200-400 words for best student engagement.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <PrimaryButton onClick={save}>Save Passage</PrimaryButton>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
      </div>
    </div>
  );
}
function PassageDetail({ passageId, onBack }: { passageId: number; onBack: () => void }) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [questions, setQuestions] = useState<PassageQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  // Form
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<QuestionType>("mcq");
  const [mcq, setMcq] = useState<MCQFields>(emptyMCQ);
  const [open, setOpen] = useState<OpenFields>(emptyOpen);
  useEffect(() => { load(); loadQ(); }, [passageId]);
  async function load() {
    try {
      const data = await contentApi.getPassages();
      const found = data.passages.find((p) => p.id === passageId) ?? null;
      setPassage(found);
    } catch (e) { setError((e as Error).message); }
  }
  async function loadQ() {
    try {
      const data = await contentApi.getPassageQuestions(passageId);
      setQuestions(data.questions);
    } catch (e) { setError((e as Error).message); setQuestions([]); }
  }
  async function addQuestion() {
    if (!qText.trim()) { toast.error("Question text is required"); return; }
    const payload: Omit<PassageQuestion, "id" | "passage_id"> = qType === "mcq"
      ? {
          question_text: qText.trim(), question_type: "mcq",
          options: mcq.options, correct_answer: mcq.correct_answer,
          explanation: mcq.explanation, xp_reward: mcq.xp_reward,
          sort_order: (questions?.length ?? 0) + 1, max_marks: null,
        }
      : {
          question_text: qText.trim(), question_type: qType,
          options: null, correct_answer: null,
          explanation: open.model_answer, xp_reward: open.xp_reward,
          sort_order: (questions?.length ?? 0) + 1, max_marks: open.max_marks,
        };
    try {
      await contentApi.addPassageQuestion(passageId, payload);
      toast.success("Question added");
      setQText(""); setMcq(emptyMCQ); setOpen(emptyOpen);
      loadQ();
    } catch (e) { toast.error((e as Error).message); }
  }
  async function deleteQ(id: number) {
    try { await contentApi.deletePassageQuestion(passageId, id); toast.success("Deleted"); loadQ(); }
    catch (e) { toast.error((e as Error).message); }
  }
  return (
    <TeacherShell>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: T.textSecondary, cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, fontFamily: "inherit" }}>
        <ArrowLeft size={14} /> Back to passages
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 20, alignItems: "start" }}>
        <div style={{ ...cardStyle, padding: 24 }}>
          {!passage ? <SkeletonBlock height={300} /> : (
            <>
              <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{passage.title}</h2>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                {difficultyPill(passage.difficulty)}
                <span style={{ fontSize: 11, color: T.textMuted }}>{passage.word_count} words</span>
              </div>
              <div style={{ marginTop: 16, fontSize: 15, lineHeight: 1.7, color: T.textPrimary, whiteSpace: "pre-wrap", maxHeight: "70vh", overflowY: "auto" }}>
                {passage.content}
              </div>
            </>
          )}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Questions</h3>
            <PrimaryButton onClick={() => setShowAdd((s) => !s)}><Plus size={14} style={{ verticalAlign: -2 }} /> Add</PrimaryButton>
          </div>
          {error && <div style={{ color: T.red, fontSize: 12 }}>{error}</div>}
          {!questions && <SkeletonBlock height={120} />}
          {questions && questions.length === 0 && !showAdd && (
            <EmptyState title="No questions" description="Add the first question for this passage." />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions?.map((q) => (
              <div key={q.id} style={{ ...cardStyle, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ fontSize: 13, color: T.textPrimary, flex: 1 }}>{q.question_text}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {typePill(q.question_type)}
                    <InlineDeleteButton onConfirm={() => deleteQ(q.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showAdd && (
            <div style={{ ...cardStyle, padding: 16, marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Question Text</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={qText} onChange={(e) => setQText(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <QuestionTypeSelector value={qType} onChange={setQType} />
                </div>
                {qType === "mcq" ? <MCQForm value={mcq} onChange={setMcq} /> : <OpenEndedForm value={open} onChange={setOpen} />}
                <div style={{ display: "flex", gap: 8 }}>
                  <PrimaryButton onClick={addQuestion}>Add Question</PrimaryButton>
                  <GhostButton onClick={() => setShowAdd(false)}>Close</GhostButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TeacherShell>
  );
}
