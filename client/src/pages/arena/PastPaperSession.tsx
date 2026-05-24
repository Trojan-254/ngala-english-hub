import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Flag, AlertCircle, Info } from "lucide-react";
import { api, ApiError, PastPaper, PastPaperQuestion } from "@/lib/api";

type AnswerRecord = {
  value: string;
  type: "mcq" | "short_answer" | "essay";
  marking_status: string | null;
  saved_at: number;
};

const PastPaperSession = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [questions, setQuestions] = useState<PastPaperQuestion[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const [seconds, setSeconds] = useState(0);
  const [startTs, setStartTs] = useState<number>(Date.now());
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | {
    score: number;
    total: number;
    pending_marking: number;
    accuracy: number;
    grade: string;
    xp_earned: number;
  }>(null);

  const [openText, setOpenText] = useState<Record<number, string>>({});
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState<number | null>(null);
  const [questionStart, setQuestionStart] = useState<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setEmpty(false);
      try {
        const res = await api.pastpapers.startSession(Number(paperId));
        if (cancelled) return;
        setPaper(res.paper);
        setQuestions(res.questions);
        setSessionId(res.session_id);
        setDurationSeconds(res.duration_seconds);
        setSeconds(res.duration_seconds);
        setStartTs(Date.now());
        setQuestionStart(Date.now());
        if (!res.questions || res.questions.length === 0) setEmpty(true);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) setEmpty(true);
        else setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paperId]);

  // Reset per-question timer when moving
  useEffect(() => {
    setQuestionStart(Date.now());
  }, [current]);

  // Countdown
  useEffect(() => {
    if (submitted || loading || error || empty) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          void doSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, loading, error, empty]);

  const fmt = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };
  const danger = seconds <= 15 * 60;

  const submitMcq = async (qIdx: number, letter: string) => {
    if (!sessionId) return;
    const q = questions[qIdx];
    const elapsed = Date.now() - questionStart;
    setAnswers((a) => ({ ...a, [qIdx]: { value: letter, type: "mcq", marking_status: null, saved_at: Date.now() } }));
    try {
      await api.pastpapers.submitAnswer({
        question_id: q.id,
        session_id: sessionId,
        answer: letter,
        time_taken_ms: elapsed,
      });
    } catch {
      /* silent */
    }
  };

  const saveOpen = async (qIdx: number) => {
    if (!sessionId) return;
    const q = questions[qIdx];
    const text = (openText[qIdx] ?? "").trim();
    if (!text) return;
    setSavingIdx(qIdx);
    const elapsed = Date.now() - questionStart;
    try {
      const res = await api.pastpapers.submitAnswer({
        question_id: q.id,
        session_id: sessionId,
        open_answer: text,
        time_taken_ms: elapsed,
      });
      setAnswers((a) => ({
        ...a,
        [qIdx]: { value: text, type: q.question_type as "short_answer" | "essay", marking_status: res.marking_status, saved_at: Date.now() },
      }));
      setSavedFlash(qIdx);
      setTimeout(() => {
        setSavedFlash((cur) => (cur === qIdx ? null : cur));
        setCurrent((c) => Math.min(questions.length - 1, c + 1));
      }, 2000);
    } catch {
      /* silent */
    } finally {
      setSavingIdx(null);
    }
  };

  const doSubmit = async () => {
    if (!sessionId || submitted) return;
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    try {
      const res = await api.pastpapers.submitPaper({
        session_id: sessionId,
        time_taken_seconds: Math.min(elapsed, durationSeconds),
      });
      setSubmitted(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    }
  };

  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl border border-border p-10 max-w-md text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h2 className="text-lg font-bold text-foreground">No questions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">This paper has no questions yet. Ask your teacher to add questions.</p>
          <Link to="/arena/pastpapers" className="inline-block mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Back to Past Papers
          </Link>
        </div>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md text-center">
          <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
          <p className="mt-3 text-sm font-semibold text-foreground">Could not load session</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Link to="/arena/pastpapers" className="mt-5 inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (submitted && paper) {
    const gradeColor = (g: string): string => {
      if (g === "A" || g === "B") return "text-success";
      if (g === "C" || g === "D") return "text-warm-orange";
      return "text-destructive";
    };
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-[820px] mx-auto">
          <div className="bg-card rounded-2xl border border-border p-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{paper.title}</div>
            <div className="mt-3 text-[48px] font-extrabold text-foreground tabular-nums leading-none">
              {submitted.score}/{submitted.total}
            </div>
            <div className={`mt-2 text-[36px] font-extrabold ${gradeColor(submitted.grade)}`}>
              {submitted.accuracy}% · Grade {submitted.grade}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">+{submitted.xp_earned} XP earned</div>

            {submitted.pending_marking > 0 && (
              <div className="mt-6 mx-auto max-w-md rounded-xl border border-border bg-secondary/10 p-4 text-left flex gap-3 items-start">
                <Info className="w-4 h-4 text-warm-orange mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{submitted.pending_marking} answer(s)</span> are with your teacher for marking.
                  Your final score will update when marked.
                </p>
              </div>
            )}

            <button onClick={() => navigate("/arena/pastpapers")} className="mt-6 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Back to Papers
            </button>
          </div>

          <div className="mt-8 space-y-3">
            {questions.map((q, i) => {
              const a = answers[i];
              return (
                <div key={q.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[13px] font-bold text-muted-foreground">Q{i + 1}</div>
                    {a ? (
                      a.type === "mcq" ? (
                        <span className="text-xs font-semibold text-muted-foreground">Answered</span>
                      ) : (
                        <span className="text-xs font-semibold text-warm-orange">Submitted for marking</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">Skipped</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground">{q.question_text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!paper) return null;

  const q = questions[current];
  const qTypeShort = (t: string): string => (t === "mcq" ? "MCQ" : t === "short_answer" ? "SA" : "E");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card flex items-center gap-6">
        <Link to="/arena/pastpapers" className="text-sm font-medium text-muted-foreground hover:text-primary">← Exit</Link>
        <h1 className="text-base font-bold text-foreground flex-1 truncate">{paper.title}</h1>
        <div className="text-xl font-bold tabular-nums" style={{ color: danger ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}>
          {fmt(seconds)}
        </div>
        <div className="text-sm font-semibold text-muted-foreground">Q {current + 1} / {questions.length}</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[220px] border-r border-border p-4 overflow-y-auto bg-card">
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((qq, i) => {
              const a = answers[i];
              const isFlag = flagged[i];
              const isCur = current === i;
              let cls = "bg-muted text-foreground";
              if (a?.type === "mcq") cls = "bg-primary text-primary-foreground";
              else if (a) cls = "bg-secondary text-secondary-foreground";
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={`relative w-full aspect-square rounded-lg text-[11px] font-bold flex flex-col items-center justify-center ${cls} ${isCur ? "ring-2 ring-foreground" : ""}`}
                >
                  <span>{i + 1}</span>
                  <span className="text-[8px] font-medium opacity-75">{qTypeShort(qq.question_type)}</span>
                  {isFlag && <Flag className="absolute -top-1 -right-1 w-3 h-3 text-warm-orange fill-current" />}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setFlagged({ ...flagged, [current]: !flagged[current] })}
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
          >
            <Flag className="w-3.5 h-3.5" /> {flagged[current] ? "Unflag" : "Flag for Review"}
          </button>
          <button
            onClick={() => setSubmitting(true)}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:brightness-110"
          >
            Submit Paper
          </button>
          <div className="mt-3 text-[11px] text-muted-foreground text-center">{answered} of {questions.length} answered</div>
        </aside>

        <div className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-[680px] mx-auto">
            <div className="text-xs font-bold text-muted-foreground mb-2">Question {current + 1} · {qTypeShort(q.question_type)}</div>
            <p className="text-[17px] font-semibold text-foreground leading-relaxed whitespace-pre-wrap">{q.question_text}</p>

            {q.question_type === "mcq" && q.options && (
              <div className="mt-6 space-y-3">
                {q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSel = answers[current]?.value === letter;
                  return (
                    <button
                      key={`${q.id}-${i}`}
                      onClick={() => void submitMcq(current, letter)}
                      className={`w-full text-left flex items-center gap-3 px-5 py-3.5 rounded-[10px] border-2 transition-all ${isSel ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-primary/5"}`}
                    >
                      <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">{letter}</span>
                      <span className="text-sm font-medium text-foreground">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {(q.question_type === "short_answer" || q.question_type === "essay") && (
              <div className="mt-6">
                <textarea
                  rows={q.question_type === "essay" ? 10 : 4}
                  maxLength={q.question_type === "essay" ? 2000 : 500}
                  value={openText[current] ?? ""}
                  onChange={(e) => setOpenText({ ...openText, [current]: e.target.value })}
                  placeholder={q.question_type === "essay" ? "Write your essay response here..." : "Write your answer here (2-3 sentences)..."}
                  className="w-full rounded-lg border border-border bg-card p-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {(openText[current] ?? "").length} / {q.question_type === "essay" ? 2000 : 500} characters
                  </span>
                  <button
                    onClick={() => void saveOpen(current)}
                    disabled={savingIdx === current || !(openText[current] ?? "").trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
                  >
                    {savingIdx === current ? "Saving…" : "Save Answer →"}
                  </button>
                </div>
                {savedFlash === current && (
                  <div className="mt-3 px-4 py-2.5 rounded-lg bg-success/15 text-success text-xs font-medium">
                    {q.question_type === "essay" ? "Essay submitted for marking." : "Answer saved — your teacher will review this."}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrent(Math.max(0, current - 1))}
                disabled={current === 0}
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))}
                disabled={current === questions.length - 1}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {submitting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border p-8 max-w-md" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 className="text-lg font-bold text-foreground">Submit paper?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure? You cannot change answers after submission.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSubmitting(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Cancel</button>
              <button
                onClick={() => {
                  setSubmitting(false);
                  void doSubmit();
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastPaperSession;
