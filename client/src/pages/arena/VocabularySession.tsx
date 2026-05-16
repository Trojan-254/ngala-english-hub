import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { vocabWords } from "@/lib/arenaData";

const VocabularySession = () => {
  const words = vocabWords;
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const reveal = () => setFlipped(true);
  const rate = (_q: "forgot" | "hard" | "got") => {
    if (idx + 1 >= words.length) { setIdx(0); setFlipped(false); return; }
    setIdx(idx + 1);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !flipped) reveal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped]);

  const w = words[idx];
  const progress = ((idx + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-[680px] mx-auto">
        <Link to="/arena/vocabulary" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

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
            {/* Front */}
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

            {/* Back */}
            <div className="absolute inset-0 bg-card rounded-2xl border border-border p-8 flex flex-col"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div className="text-2xl font-extrabold text-primary">{w.word}</div>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{w.definition}</p>
              <blockquote className="mt-4 pl-3 border-l-[3px] border-secondary italic text-sm text-foreground/80">
                "{w.example_sentence}"
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-success/15 text-success text-[11px] font-semibold">Synonym: {w.synonym}</span>
                <span className="px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-[11px] font-semibold">Antonym: {w.antonym}</span>
              </div>
              <div className="mt-auto pt-6 grid grid-cols-3 gap-3">
                <button onClick={() => rate("forgot")} className="py-2.5 rounded-lg border-2 border-destructive text-destructive text-sm font-semibold hover:bg-destructive/5">Forgot it</button>
                <button onClick={() => rate("hard")} className="py-2.5 rounded-lg border-2 border-secondary text-warm-orange text-sm font-semibold hover:bg-secondary/5">Hard</button>
                <button onClick={() => rate("got")} className="py-2.5 rounded-lg border-2 border-success text-success text-sm font-semibold hover:bg-success/5">Got it</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularySession;
