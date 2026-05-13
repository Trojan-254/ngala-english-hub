import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Flag, Check, X } from "lucide-react";
import { pastPapers, sampleQuestions } from "@/lib/arenaData";

const PastPaperSession = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const paper = pastPapers.find((p) => p.id === Number(paperId)) ?? pastPapers[0];

  // Build 40 mock questions by cycling sampleQuestions
  const questions = useMemo(
    () => Array.from({ length: paper.question_count }, (_, i) => ({ ...sampleQuestions[i % sampleQuestions.length], id: i + 1 })),
    [paper.question_count]
  );

  const [seconds, setSeconds] = useState(paper.duration_minutes * 60);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); setSubmitted(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };
  const danger = seconds <= 15 * 60;

  if (submitted) {
    const correct = Object.entries(answers).filter(([qid, a]) => questions[Number(qid)].correct_answer === a).length;
    const pct = Math.round((correct / questions.length) * 100);
    const grade = pct >= 80 ? "A" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "E";
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-[820px] mx-auto">
          <div className="bg-card rounded-2xl border border-border p-8 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{paper.title}</div>
            <div className="mt-3 text-[48px] font-extrabold text-foreground tabular-nums leading-none">{correct}/{questions.length}</div>
            <div className="mt-2 text-[36px] font-extrabold text-primary">{pct}% · Grade {grade}</div>
            <button onClick={() => navigate("/arena/pastpapers")} className="mt-6 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Back to Papers</button>
          </div>

          <div className="mt-8 space-y-4">
            {questions.map((q, i) => {
              const a = answers[i];
              const ok = a === q.correct_answer;
              return (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-[13px] font-bold text-muted-foreground">Q{i + 1}</div>
                    {a ? (ok ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />) : <span className="text-xs text-muted-foreground">Skipped</span>}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{q.question_text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Correct answer: <span className="font-semibold text-success">{q.correct_answer}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = Object.keys(answers).length;

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
        <aside className="w-[200px] border-r border-border p-4 overflow-y-auto bg-card">
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => {
              const isAns = answers[i];
              const isFlag = flagged[i];
              const isCur = current === i;
              let cls = "bg-muted text-foreground";
              if (isAns) cls = "bg-primary text-primary-foreground";
              if (isFlag) cls = "bg-secondary text-secondary-foreground";
              return (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold ${cls} ${isCur ? "ring-2 ring-foreground" : ""}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setFlagged({ ...flagged, [current]: !flagged[current] })}
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted">
            <Flag className="w-3.5 h-3.5" /> {flagged[current] ? "Unflag" : "Flag for Review"}
          </button>
          <button
            onClick={() => setSubmitting(true)}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:brightness-110">
            Submit Paper
          </button>
          <div className="mt-3 text-[11px] text-muted-foreground text-center">{answered} of {questions.length} answered</div>
        </aside>

        <div className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-[680px] mx-auto">
            <div className="text-xs font-bold text-muted-foreground mb-2">Question {current + 1}</div>
            <p className="text-[17px] font-semibold text-foreground leading-relaxed">{q.question_text}</p>

            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSel = answers[current] === opt;
                return (
                  <button key={opt} onClick={() => setAnswers({ ...answers, [current]: opt })}
                    className={`w-full text-left flex items-center gap-3 px-5 py-3.5 rounded-[10px] border-2 transition-all ${isSel ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-primary/5"}`}>
                    <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">{letter}</span>
                    <span className="text-sm font-medium text-foreground">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold disabled:opacity-40">← Previous</button>
              <button onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40">Next →</button>
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
              <button onClick={() => { setSubmitting(false); setSubmitted(true); }} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastPaperSession;
