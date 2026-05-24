import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { api, VocabWord, ApiError } from "@/lib/api";
import { CountUp } from "@/components/ngala/CountUp";

const VocabularySession = () => {
  const { topicId } = useParams();
  const [words, setWords] = useState<VocabWord[] | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(false);
 
 const load = async () => {
    setLoading(true);
    setError(null);
    setEmpty(false);
    try {
      const res = await api.vocabulary.startSession({
        topic_id: topicId ? Number(topicId) : undefined,
        limit: 10,
      });
      setWords(res.words);
      setSessionId(res.session_id);
      setIdx(0);
      setFlipped(false);
      setXp(0);
      setDone(false);
      if (!res.words || res.words.length === 0) setEmpty(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setEmpty(true);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      setLoading(false);
    }

  };

 useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !flipped && words && !done) setFlipped(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, words, done]);

   const reveal = () => setFlipped(true);
  const rate = async (r: "forgot" | "hard" | "got") => {
    if (!words || !sessionId || rating) return;
    const w = words[idx];
    setRating(true);
    try {
      const res = await api.vocabulary.rate({ vocab_id: w.id, rating: r, session_id: sessionId });
      setXp((x) => x + (res.xp_earned ?? 0));
      if (idx + 1 >= words.length) {
        setDone(true);
      } else {
        setIdx(idx + 1);
        setFlipped(false);
      }
    } catch {
      /* swallow — keep card */
    } finally {
      setRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-[680px] mx-auto">
          <div className="h-5 w-20 bg-muted rounded mb-6 animate-pulse" />
          <div className="h-[420px] bg-card rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl border border-border p-10 max-w-md text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h2 className="text-lg font-bold text-foreground">No words available</h2>
          <p className="mt-2 text-sm text-muted-foreground">No words available. Your teacher may need to add vocabulary words.</p>
          <Link to="/arena/vocabulary" className="inline-block mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Back to Vocabulary
          </Link>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md text-center">
          <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
          <p className="mt-3 text-sm text-foreground font-semibold">Could not load session</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <button onClick={() => void load()} className="mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!words) return null;
  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl border border-border p-10 max-w-md w-full text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h2 className="text-2xl font-extrabold text-foreground">Session Complete</h2>
          <p className="mt-2 text-sm text-muted-foreground">{words.length} words reviewed</p>
          <div className="mt-6 text-[44px] font-extrabold text-primary tabular-nums leading-none">
            +<CountUp end={xp} /> XP
          </div>
          <div className="mt-2 text-xs text-muted-foreground">earned this session</div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button onClick={() => void load()} className="py-2.5 rounded-lg border-2 border-border text-sm font-semibold hover:bg-muted">Review Again</button>
            <Link to="/arena/vocabulary" className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
              Back to Vocabulary
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const w = words[idx];
  const progress = ((idx + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-[680px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/arena/vocabulary" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="text-sm font-bold text-primary tabular-nums">+{xp} XP</div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-[13px] text-muted-foreground mb-2">
            <span>Word {idx + 1} of {words.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="relative" style={{ perspective: 1200 }}>
          <div
            className="relative w-full min-h-[420px]"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 400ms ease-in-out",
            }}
          >
            
            <div className="absolute inset-0 bg-card rounded-2xl border border-border p-10 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div className="text-[48px] font-extrabold text-primary text-center leading-tight">{w.word}</div>
              <div className="mt-2 italic text-sm text-muted-foreground">{w.part_of_speech}</div>
              <button
                onClick={reveal}
                className="mt-10 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition"
                autoFocus
              >
                Reveal Definition →
              </button>
              <div className="mt-3 text-[11px] text-muted-foreground">Press Enter to reveal</div>
            </div>

            
            <div className="absolute inset-0 bg-card rounded-2xl border border-border p-8 flex flex-col"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div className="text-2xl font-extrabold text-primary">{w.word}</div>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{w.definition}</p>
              {w.example_sentence && (
                <blockquote className="mt-4 pl-3 border-l-[3px] border-secondary italic text-sm text-foreground/80">
                  "{w.example_sentence}"
                </blockquote>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                 {w.synonym && <span className="px-2.5 py-1 rounded-full bg-success/15 text-success text-[11px] font-semibold">Synonym: {w.synonym}</span>}
                {w.antonym && <span className="px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-[11px] font-semibold">Antonym: {w.antonym}</span>}
              </div>
              <div className="mt-auto pt-6 grid grid-cols-3 gap-3">
                 <button disabled={rating} onClick={() => void rate("forgot")} className="py-2.5 rounded-lg border-2 border-destructive text-destructive text-sm font-semibold hover:bg-destructive/5 disabled:opacity-50">Forgot it</button>
                <button disabled={rating} onClick={() => void rate("hard")} className="py-2.5 rounded-lg border-2 border-secondary text-warm-orange text-sm font-semibold hover:bg-secondary/5 disabled:opacity-50">Hard</button>
                <button disabled={rating} onClick={() => void rate("got")} className="py-2.5 rounded-lg border-2 border-success text-success text-sm font-semibold hover:bg-success/5 disabled:opacity-50">Got it</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularySession;
