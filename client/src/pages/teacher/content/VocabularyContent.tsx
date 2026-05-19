import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle } from "@/components/teacher/tokens";
import { SkeletonBlock, EmptyState, ErrorState } from "@/components/teacher/StatusViews";
import {
  PrimaryButton, GhostButton, DifficultySelector, CurriculumSelector,
  inputStyle, labelStyle, InlineDeleteButton,
} from "@/components/teacher/content/FormControls";
import { contentApi, VocabWord, Difficulty, Curriculum } from "@/lib/contentApi";
const TOPIC_TAGS = [
  { v: "academic", label: "Academic" },
  { v: "literary", label: "Literary" },
  { v: "formal", label: "Formal Register" },
  { v: "idiomatic", label: "Idioms" },
  { v: "synonyms-antonyms", label: "Synonyms/Antonyms" },
  { v: "cbe-core", label: "CBE Core" },
];
const PART_OF_SPEECH = ["noun", "verb", "adjective", "adverb", "pronoun", "conjunction", "preposition", "interjection"];
export default function VocabularyContent() {
  const [words, setWords] = useState<VocabWord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<Difficulty | null>(null);
  const [currFilter, setCurrFilter] = useState<Curriculum | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VocabWord | null>(null);
  useEffect(() => { load(); }, []);
  async function load() {
    try { setError(null); const data = await contentApi.getVocabulary(); setWords(data.words); }
    catch (e) { setError((e as Error).message); setWords([]); }
  }
  const filtered = useMemo(
    () => (words ?? []).filter((w) =>
      (tagFilter === null || w.topic_tag === tagFilter) &&
      (diffFilter === null || w.difficulty === diffFilter) &&
      (currFilter === null || w.curriculum === currFilter)
    ),
    [words, tagFilter, diffFilter, currFilter],
  );
  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(w: VocabWord) { setEditing(w); setShowForm(true); }
  return (
    <TeacherShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>Vocabulary Bank</h1>
          <p style={{ color: T.textSecondary, marginTop: 6, fontSize: 14 }}>
            Words students will encounter during daily spaced repetition.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}><Plus size={14} style={{ verticalAlign: -2 }} /> Add Word</PrimaryButton>
      </div>
      {showForm && (
        <WordForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginTop: 22, alignItems: "start" }}>
        <aside style={{ ...cardStyle, padding: 16 }}>
          <FilterSection label="Topic">
            <FilterRow active={tagFilter === null} onClick={() => setTagFilter(null)} count={words?.length}>All</FilterRow>
            {TOPIC_TAGS.map((t) => (
              <FilterRow key={t.v} active={tagFilter === t.v} onClick={() => setTagFilter(t.v)} count={words?.filter((w) => w.topic_tag === t.v).length}>
                {t.label}
              </FilterRow>
            ))}
          </FilterSection>
          <FilterSection label="Difficulty">
            <FilterRow active={diffFilter === null} onClick={() => setDiffFilter(null)}>All</FilterRow>
            {[1, 2, 3].map((d) => (
              <FilterRow key={d} active={diffFilter === d} onClick={() => setDiffFilter(d as Difficulty)}>
                {d === 1 ? "Easy" : d === 2 ? "Medium" : "Hard"}
              </FilterRow>
            ))}
          </FilterSection>
          <FilterSection label="Curriculum">
            <FilterRow active={currFilter === null} onClick={() => setCurrFilter(null)}>All</FilterRow>
            <FilterRow active={currFilter === "both"} onClick={() => setCurrFilter("both")}>Both</FilterRow>
            <FilterRow active={currFilter === "844"} onClick={() => setCurrFilter("844")}>8-4-4</FilterRow>
            <FilterRow active={currFilter === "CBE"} onClick={() => setCurrFilter("CBE")}>CBE</FilterRow>
          </FilterSection>
        </aside>
        <div>
          {error && <ErrorState message={error} onRetry={load} />}
          {!words && !error && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={150} />)}
            </div>
          )}
          {words && filtered.length === 0 && !error && (
            <EmptyState title="No words found" description="No words found. Add the first word for this category." />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {filtered.map((w) => <WordCard key={w.id} word={w} onEdit={() => openEdit(w)} onDelete={async () => { try { await contentApi.deleteWord(w.id); toast.success("Deleted"); load(); } catch (e) { toast.error((e as Error).message); } }} />)}
          </div>
        </div>
      </div>
    </TeacherShell>
  );
}
function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: T.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</div>
    </div>
  );
}
function FilterRow({ children, active, onClick, count }: { children: React.ReactNode; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 10px", borderRadius: 6, border: "none",
      background: active ? T.primaryLight : "transparent",
      color: active ? T.primary : T.textPrimary,
      fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer",
      fontFamily: "inherit", textAlign: "left",
    }}>
      <span>{children}</span>
      {count !== undefined && <span style={{ color: T.textMuted, fontSize: 11 }}>{count}</span>}
    </button>
  );
}
function WordCard({ word, onEdit, onDelete }: { word: VocabWord; onEdit: () => void; onDelete: () => void }) {
  const dotColor = word.difficulty === 1 ? T.green : word.difficulty === 2 ? T.gold : T.red;
  return (
    <div style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.primary }}>{word.word}</div>
          <div style={{ fontStyle: "italic", fontSize: 12, color: T.textMuted, marginTop: 2 }}>{word.part_of_speech}</div>
        </div>
        <span title={`Difficulty ${word.difficulty}`} style={{ width: 10, height: 10, borderRadius: 999, background: dotColor }} />
      </div>
      <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {word.definition}
      </p>
      <p style={{ fontSize: 12, fontStyle: "italic", color: T.textSecondary, marginTop: 6 }}>"{word.example_sentence}"</p>
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {word.synonym && <span style={{ background: T.greenLight, color: T.green, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>≈ {word.synonym}</span>}
        {word.antonym && <span style={{ background: T.redLight, color: T.red, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>≠ {word.antonym}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
        <button onClick={onEdit} style={{ background: "transparent", border: `1px solid ${T.border}`, padding: "6px 8px", borderRadius: 6, cursor: "pointer", color: T.textSecondary, fontFamily: "inherit" }}>
          <Pencil size={14} />
        </button>
        <InlineDeleteButton onConfirm={onDelete} />
      </div>
    </div>
  );
}
function WordForm({ initial, onClose, onSaved }: { initial: VocabWord | null; onClose: () => void; onSaved: () => void }) {
  const [word, setWord] = useState(initial?.word ?? "");
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [pos, setPos] = useState(initial?.part_of_speech ?? "noun");
  const [example, setExample] = useState(initial?.example_sentence ?? "");
  const [synonym, setSynonym] = useState(initial?.synonym ?? "");
  const [antonym, setAntonym] = useState(initial?.antonym ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 2);
  const [topicTag, setTopicTag] = useState(initial?.topic_tag ?? "academic");
  const [curriculum, setCurriculum] = useState<Curriculum>(initial?.curriculum ?? "both");
  async function save() {
    if (!word.trim() || !definition.trim() || !example.trim()) { toast.error("Word, definition and example are required"); return; }
    const payload = {
      word: word.trim().toLowerCase(),
      definition: definition.trim(),
      part_of_speech: pos,
      example_sentence: example.trim(),
      synonym: synonym.trim() || null,
      antonym: antonym.trim() || null,
      difficulty, topic_tag: topicTag, curriculum,
    };
    try {
      if (initial) {
        await contentApi.updateWord(initial.id, payload);
        toast.success("Word updated");
      } else {
        await contentApi.createWord(payload);
        toast.success("Word added");
      }
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div style={{ ...cardStyle, padding: 20, marginTop: 18 }}>
      <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{initial ? "Edit Word" : "Add Word"}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <div>
          <label style={labelStyle}>Word</label>
          <input style={inputStyle} value={word} onChange={(e) => setWord(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Part of Speech</label>
          <select style={inputStyle} value={pos} onChange={(e) => setPos(e.target.value)}>
            {PART_OF_SPEECH.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Definition</label>
          <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={definition} onChange={(e) => setDefinition(e.target.value)} required />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Example Sentence</label>
          <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={example} onChange={(e) => setExample(e.target.value)} placeholder="Use the word in a sentence a Form 3 student would understand" required />
        </div>
        <div>
          <label style={labelStyle}>Synonym (optional, comma-separated)</label>
          <input style={inputStyle} value={synonym} onChange={(e) => setSynonym(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Antonym (optional, comma-separated)</label>
          <input style={inputStyle} value={antonym} onChange={(e) => setAntonym(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Difficulty</label>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>
        <div>
          <label style={labelStyle}>Topic Tag</label>
          <select style={inputStyle} value={topicTag} onChange={(e) => setTopicTag(e.target.value)}>
            {TOPIC_TAGS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Curriculum</label>
          <CurriculumSelector value={curriculum} onChange={setCurriculum} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <PrimaryButton onClick={save}>{initial ? "Save Changes" : "Add Word"}</PrimaryButton>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
      </div>
    </div>
  );
}
