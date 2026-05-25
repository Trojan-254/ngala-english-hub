import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { api, Passage, Question } from "@/lib/api";

const ComprehensionSession = () => {
  const { passageId } = useParams();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const passageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!passageId) return;
    api.comprehension.startSession(Number(passageId))
      .then(res => {
        setSessionId(res.session_id);
        setPassage(res.passage);
        setQuestions(res.questions);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [passageId]);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const onScroll = () => {
    const el = passageRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
  };

  const handleConfirm = async () => {
  if (!selected || !sessionId) return;
  const q = questions[idx];
  
  // Find letter for selected option
  const selectedLetter = String.fromCharCode(65 + q.options.indexOf(selected));
  
  try {
    const res = await api.comprehension.submitAnswer({
      passage_question_id: q.id,
      answer: selectedLetter,  // ← send "B" not full text
      session_id: sessionId,
      time_taken_ms: seconds * 1000,
    });
    setCorrectAnswer(res.correct_answer); // backend returns "B"
    setExplanation(res.explanation);
  } catch {
    setCorrectAnswer(q.correct_answer);
    setExplanation(q.explanation ?? '');
  }
  setConfirmed(true);
};

  const handleNext = async () => {
    if (idx + 1 >= questions.length) {
      if (sessionId) {
        await api.comprehension.endSession(sessionId, seconds).catch(console.error);
      }
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setConfirmed(false);
    setCorrectAnswer('');
    setExplanation('');
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading passage...</div>
      </div>
    );
  }

  if (error || !passage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error ?? 'Passage not found'}</p>
          <Link to="/arena/comprehension" className="mt-4 inline-block text-sm text-primary">← Back</Link>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card flex items-center gap-4">
        <Link to="/arena/comprehension"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-base font-bold text-foreground truncate">{passage.title}</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[55%] border-r border-border flex flex-col">
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${scrollPct}%` }} />
          </div>
          <div ref={passageRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-10">
            <h2 className="text-lg font-bold text-foreground mb-4">{passage.title}</h2>
            <div className="text-[15px] text-muted-foreground" style={{ lineHeight: 1.8 }}>
              {passage.content.split("\n\n").map((para, i) => (
                <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[45%] p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-semibold text-muted-foreground">
              Question {idx + 1} of {questions.length}
            </div>
            <div className="text-sm font-semibold text-muted-foreground tabular-nums">{mm}:{ss}</div>
          </div>

          {q && (
            <>
              <p className="text-[16px] font-semibold text-foreground leading-relaxed">{q.question_text}</p>

              <div className="mt-5 space-y-3">
                {q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSel = selected === opt;
                  const isCorrect = confirmed && letter === correctAnswer;
                  const isWrong = confirmed && isSel && !isCorrect;
                  let cls = "border-border hover:border-primary/40 hover:bg-primary/5";
                  if (!confirmed && isSel) cls = "border-primary bg-primary/10";
                  if (confirmed) {
                    if (isCorrect) cls = "border-success bg-success/10";
                    else if (isSel) cls = "border-destructive bg-destructive/10";
                    else cls = "border-border opacity-60";
                  }
                  return (
                    <button key={opt} disabled={confirmed} onClick={() => setSelected(opt)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-[10px] border-2 transition-all ${cls}`}>
                      <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                        {letter}
                      </span>
                      <span className="text-sm font-medium text-foreground">{opt}</span>
                      {confirmed && isCorrect && <Check className="ml-auto w-5 h-5 text-success" />}
                      {confirmed && isSel && !isCorrect && <X className="ml-auto w-5 h-5 text-destructive" />}
                    </button>
                  );
                })}
              </div>

              {!confirmed && selected && (
                <button onClick={handleConfirm}
                  className="mt-5 w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-bold hover:brightness-110">
                  Confirm →
                </button>
              )}

              {confirmed && (
                <>
                  <div className="mt-5 bg-primary/5 border-l-[3px] border-primary rounded p-4"
                    style={{ animation: "explainSlide 300ms ease forwards" }}>
                    <div className="text-sm font-semibold text-primary mb-1">Why?</div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{explanation}</p>
                  </div>
                  <button onClick={handleNext}
                    className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-bold hover:brightness-110">
                    {idx + 1 >= questions.length ? "Finish Session →" : "Next Question →"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes explainSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ComprehensionSession;
