import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Zap } from "lucide-react";
import { api, Question } from "@/lib/api";
import { CountUp } from "@/components/ngala/CountUp";
import { BadgeNotification } from '@/components/ngala/BadgeNotification';
import { useConfetti } from '@/hooks/useConfetti';

const QUESTION_TIME = 20;

const TimerRing = ({ seconds }: { seconds: number }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, seconds) / QUESTION_TIME;
  const color = seconds > 10
    ? "hsl(var(--success))"
    : seconds > 5
    ? "hsl(var(--secondary))"
    : "hsl(var(--destructive))";
  return (
    <div className="relative w-11 h-11">
      <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 200ms" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[14px] font-bold tabular-nums" style={{ color }}>
        {Math.max(0, seconds)}
      </div>
    </div>
  );
};

const GrammarSession = () => {
  const { fireSession } = useConfetti();
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [seconds, setSeconds] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [showXpFloat, setShowXpFloat] = useState(false);
  const [done, setDone] = useState(false);
  const tickRef = useRef<number | null>(null);

  // Load session on mount
  useEffect(() => {
    if (!topicId) return;
    api.grammar.startSession(Number(topicId), 10)
      .then(res => {
        setSessionId(res.session_id);
        setTopicTitle(res.topic.title);
        setQuestions(res.questions);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [topicId]);

  // Per-question timer
  useEffect(() => {
    if (confirmed || done || loading) return;
    setSeconds(QUESTION_TIME);
    tickRef.current = window.setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          window.clearInterval(tickRef.current!);
          setConfirmed(true);
          setCorrectAnswer(questions[idx]?.correct_answer ?? '');
          setExplanation(questions[idx]?.explanation ?? '');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [idx, confirmed, done, loading]);

  const handleConfirm = async () => {
    if (!selected || !sessionId) return;
    if (tickRef.current) window.clearInterval(tickRef.current);

    const q = questions[idx];
    const timeTaken = (QUESTION_TIME - seconds) * 1000;
 
    const selectedLetter = String.fromCharCode(65 + q.options.indexOf(selected));

    try {
      const res = await api.grammar.submitAnswer({
        question_id: q.id,
        answer: selectedLetter,
        session_id: sessionId,
        time_taken_ms: timeTaken,
      });

      setConfirmed(true);
      setCorrectAnswer(res.correct_answer);
      setExplanation(res.explanation);

      if (res.is_correct) {
        setScore(s => s + 1);
        setXp(res.new_xp);
        setShowXpFloat(true);
        setTimeout(() => setShowXpFloat(false), 800);
      }
      if (res.new_badges && res.new_badges.length > 0) {
        setNewBadges(res.new_badges);
      }
    } catch (err) {
      console.error('Answer submission failed:', err);
      setConfirmed(true);
      setCorrectAnswer(q.correct_answer);
      setExplanation(q.explanation ?? '');
    }
  };

  const handleNext = async () => {
    if (idx + 1 >= questions.length) {
      if (sessionId) {
        await api.grammar.endSession(sessionId).catch(console.error);
      }
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setConfirmed(false);
    setExplanation('');
    setCorrectAnswer('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-destructive font-semibold">{error}</p>
          <Link to="/arena/grammar" className="mt-4 inline-block text-sm text-primary">
            ← Back to Arena
          </Link>
        </div>
      </div>
    );
  }

 useEffect(() => {
  if (done) {
    const accuracy = Math.round((score / questions.length) * 100);
    const perfect = accuracy === 100;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className={`max-w-[680px] w-full bg-card rounded-2xl border p-10 text-center ${perfect ? "border-secondary animate-pulse" : "border-border"}`}
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Complete</div>
          <div className="mt-3 text-[48px] font-extrabold text-foreground tabular-nums leading-none">
            <CountUp end={score} />/{questions.length}
          </div>
          <div className="mt-2 text-[48px] font-extrabold text-primary tabular-nums leading-none">
            <CountUp end={accuracy} suffix="%" />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-warm-orange">
            <Zap className="w-5 h-5" />
            <span className="text-lg font-bold tabular-nums"><CountUp end={xp} /> XP total</span>
          </div>
          <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden max-w-sm mx-auto">
            <div className="h-full bg-success transition-all duration-700" style={{ width: `${accuracy}%` }} />
          </div>
          {perfect && <div className="mt-6 text-sm font-bold text-secondary">Grammar Ninja unlocked</div>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => navigate("/arena/grammar")}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted">
              Back to Arena
            </button>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
 }, [done]);

  const q = questions[idx];
  const progress = ((idx + (confirmed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-[680px] mx-auto">
        <Link to="/arena/grammar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{topicTitle}</h1>
            <div className="text-[13px] text-muted-foreground mt-1">
              Question {idx + 1} of {questions.length}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-warm-orange text-sm font-bold tabular-nums">
              <Zap className="w-4 h-4" /> {xp} XP
            </div>
            <TimerRing seconds={seconds} />
          </div>
        </div>

        <div className="h-1.5 bg-muted overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-card rounded-xl border border-border p-8 relative"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <p className="text-[17px] font-semibold text-foreground leading-relaxed">{q.question_text}</p>

          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSel = selected === opt;
              const isCorrect = confirmed && letter === correctAnswer;
              const isWrong = confirmed && isSel && !isCorrect;

              let cls = "border-border bg-card hover:border-primary/40 hover:bg-primary/5";
              if (!confirmed && isSel) cls = "border-primary bg-primary/10";
              if (confirmed) {
                if (isCorrect) cls = "border-success bg-success/10";
                else if (isSel) cls = "border-destructive bg-destructive/10";
                else cls = "border-border bg-card opacity-60";
              }
              return (
                <button key={opt} disabled={confirmed} onClick={() => setSelected(opt)}
                  className={`relative w-full text-left flex items-center gap-3 px-5 py-3.5 rounded-[10px] border-2 transition-all ${cls}`}>
                  <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                    {letter}
                  </span>
                  <span className="text-sm font-medium text-foreground">{opt}</span>
                  {confirmed && isCorrect && <Check className="ml-auto w-5 h-5 text-success" />}
                  {confirmed && isSel && !isCorrect && <X className="ml-auto w-5 h-5 text-destructive" />}
                  {confirmed && isCorrect && showXpFloat && (
                    <span className="absolute right-12 -top-2 text-success font-bold text-sm pointer-events-none"
                      style={{ animation: "xpFloat 800ms ease-out forwards" }}>
                      +{q.xp_reward} XP
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!confirmed && selected && (
            <button onClick={handleConfirm}
              className="mt-6 w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-bold hover:brightness-110 transition">
              Confirm →
            </button>
          )}
        </div>

        {confirmed && (
          <>
            <div className="mt-5 bg-primary/5 border-l-[3px] border-primary rounded p-4"
              style={{ animation: "explainSlide 300ms ease forwards" }}>
              <div className="text-sm font-semibold text-primary mb-1">Why?</div>
              <p className="text-sm text-foreground/80 leading-relaxed">{explanation}</p>
            </div>
            <button onClick={handleNext}
              className="mt-5 w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-bold hover:brightness-110 transition">
              {idx + 1 >= questions.length ? "Finish Session →" : "Next Question →"}
            </button>
            <BadgeNotification
               badges={newBadges}
               onDismiss={() => setNewBadges([])}
             />
          </>
        )}
      </div>

      <style>{`
        @keyframes xpFloat { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
        @keyframes explainSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default GrammarSession;
