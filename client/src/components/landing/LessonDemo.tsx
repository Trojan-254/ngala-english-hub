import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, RotateCcw, Sparkles, X, ArrowRight, Flame } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   A 60-second, three-card sample lesson in the style Ngala lessons
   use everywhere: do first, explain second, retry freely.
   ------------------------------------------------------------------ */

type Status = "idle" | "wrong" | "right";

const STEPS = [
  { key: "grammar", label: "Grammar", skill: "bg-skill-write-ink text-white", text: "text-skill-write-ink" },
  { key: "poetry", label: "Poetry", skill: "bg-skill-lit text-white", text: "text-skill-lit" },
  { key: "vocab", label: "Vocabulary", skill: "bg-skill-read-ink text-white", text: "text-skill-read-ink" },
] as const;

const XP_PER_STEP = 10;

/* ---------- Step 1: tap the word that breaks the sentence ---------- */
const SENTENCE = ["Neither", "the", "teacher", "nor", "the", "students", "was", "ready", "for", "the", "test."];
const WRONG_WORD = 6;

/* ---------- Step 2: tap the stressed syllables ---------- */
// Thomas Gray, "Elegy Written in a Country Churchyard" (1751), public domain.
const SYLLABLES = [
  { t: "The", w: 0 }, { t: "cur", w: 1 }, { t: "few", w: 1 }, { t: "tolls", w: 2 }, { t: "the", w: 3 },
  { t: "knell", w: 4 }, { t: "of", w: 5 }, { t: "part", w: 6 }, { t: "ing", w: 6 }, { t: "day", w: 7 },
];
const STRESSED = new Set([1, 3, 5, 7, 9]);
// syllable indexes grouped into words, so a word never breaks across lines
const WORD_GROUPS = SYLLABLES.reduce<number[][]>((acc, s, i) => {
  if (i > 0 && SYLLABLES[i - 1].w === s.w) acc[acc.length - 1].push(i);
  else acc.push([i]);
  return acc;
}, []);

/* ---------- Step 3: order by connotation ---------- */
const WORDS = ["slender", "scrawny", "thin"];
const ORDER = ["scrawny", "thin", "slender"];
const SLOTS = ["Negative", "Neutral", "Positive"];

export const LessonDemo = () => {
  const { fire } = useConfetti();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const [xp, setXp] = useState(0);
  const [xpPing, setXpPing] = useState(0);
  const [done, setDone] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // step-local state
  const [picked, setPicked] = useState<number | null>(null);
  const [stresses, setStresses] = useState<Set<number>>(new Set());
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null]);

  const current = STEPS[Math.min(step, STEPS.length - 1)];

  const resetStepState = () => {
    setStatus("idle");
    setAttempts(0);
    setPicked(null);
    setStresses(new Set());
    setSlots([null, null, null]);
  };

  const markWrong = () => {
    setStatus("wrong");
    setAttempts((a) => a + 1);
    setShakeKey((k) => k + 1);
  };

  const markRight = () => {
    setStatus("right");
    setXp((x) => x + XP_PER_STEP);
    setXpPing((p) => p + 1);
  };

  const check = () => {
    if (step === 0) {
      if (picked === null) return;
      picked === WRONG_WORD ? markRight() : markWrong();
    } else if (step === 1) {
      const ok = stresses.size === STRESSED.size && [...stresses].every((i) => STRESSED.has(i));
      ok ? markRight() : markWrong();
    } else {
      if (slots.some((s) => s === null)) return;
      const ok = slots.every((s, i) => s === ORDER[i]);
      ok ? markRight() : markWrong();
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      resetStepState();
    } else {
      setDone(true);
      fire({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
    }
  };

  const restart = () => {
    setStep(0);
    setXp(0);
    setDone(false);
    resetStepState();
  };

  const canCheck =
    status !== "right" &&
    ((step === 0 && picked !== null) || (step === 1 && stresses.size > 0) || (step === 2 && slots.every(Boolean)));

  const stressHint = useMemo(() => {
    const found = [...stresses].filter((i) => STRESSED.has(i)).length;
    const extra = [...stresses].filter((i) => !STRESSED.has(i)).length;
    if (extra > 0) return `You found ${found} of 5 beats, but ${extra} of your taps land on soft syllables. Read it aloud and clap on the strong ones.`;
    return `You found ${found} of 5 beats. Read the line aloud. The strong beat falls on every second syllable.`;
  }, [stresses]);

  /* ---------------------------- render ---------------------------- */

  if (done) {
    return (
      <Shell xp={xp} xpPing={xpPing} progress={3} label="Lesson complete" chipClass="bg-secondary text-ink">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="pop-in mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
            <Flame className="h-10 w-10 text-secondary" strokeWidth={2.4} />
          </div>
          <h3 className="font-display text-3xl font-extrabold text-ink">Lesson complete</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Grammar, poetry and vocabulary in about a minute. You earned{" "}
            <span className="font-bold text-ink">{xp} XP</span> and started a 1 day streak.
          </p>
          <div className="mt-7 flex w-full max-w-xs flex-col gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3.5 font-bold text-ink shadow-[0_8px_20px_-8px_hsl(var(--secondary))] transition hover:brightness-105"
            >
              Save my progress, it's free <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={restart} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-ink">
              <RotateCcw className="h-4 w-4" /> Play again
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      xp={xp}
      xpPing={xpPing}
      progress={step + (status === "right" ? 1 : 0)}
      label={`${current.label} · ${step + 1} of 3`}
      chipClass={current.skill}
    >
      {/* Prompt + interaction */}
      <div key={`step-${step}`} className="rise-in flex-1 px-5 pb-4 pt-6 sm:px-8">
        {step === 0 && (
          <>
            <Prompt title="One word breaks this sentence." sub="Tap it." />
            <div key={shakeKey} className={cn("mt-6 flex flex-wrap gap-2", status === "wrong" && "shake")}>
              {SENTENCE.map((w, i) => {
                const isPicked = picked === i;
                const solved = status === "right" && i === WRONG_WORD;
                return (
                  <button
                    key={i}
                    disabled={status === "right"}
                    onClick={() => {
                      setPicked(i);
                      if (status === "wrong") setStatus("idle");
                    }}
                    aria-pressed={isPicked}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2 text-base font-semibold transition-all duration-200 sm:text-lg",
                      solved
                        ? "pop-in border-skill-read bg-skill-read/10 text-skill-read-ink"
                        : isPicked
                          ? status === "wrong"
                            ? "border-skill-write bg-skill-write/10 text-skill-write-ink"
                            : "-translate-y-0.5 border-skill-write bg-skill-write/10 text-ink shadow-sm"
                          : "border-border bg-white text-ink hover:-translate-y-0.5 hover:border-skill-write/50",
                    )}
                  >
                    {solved ? (
                      <span>
                        <s className="mr-1.5 text-muted-foreground/70">was</s>were
                      </span>
                    ) : (
                      w
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Prompt title="Every line of poetry has a heartbeat." sub="Tap the syllables you say more strongly." />
            <p className="mt-2 text-xs font-medium text-muted-foreground">Thomas Gray, 1751</p>
            <div key={shakeKey} className={cn("mt-5 flex flex-wrap items-end gap-y-3", status === "wrong" && "shake")}>
              {WORD_GROUPS.map((group, gi) => (
                <div key={gi} className={cn("flex items-end whitespace-nowrap", gi > 0 && "ml-3 sm:ml-4")}>
                  {group.map((i, k) => {
                    const s = SYLLABLES[i];
                    const on = stresses.has(i);
                    const reveal = status === "right";
                    const isStress = STRESSED.has(i);
                    return (
                      <div key={i} className="flex items-end">
                        {k > 0 && <span className="mb-2 px-px text-xl text-ink/25">·</span>}
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "mb-1 h-3 text-sm font-black leading-none transition-all",
                              reveal
                                ? isStress
                                  ? "pop-in text-skill-lit"
                                  : "text-muted-foreground/40"
                                : on
                                  ? "text-skill-lit"
                                  : "text-transparent",
                            )}
                            style={reveal ? { animationDelay: `${i * 70}ms` } : undefined}
                          >
                            {reveal ? (isStress ? "/" : "˘") : "/"}
                          </span>
                          <button
                            disabled={status === "right"}
                            onClick={() => {
                              setStresses((prev) => {
                                const n = new Set(prev);
                                n.has(i) ? n.delete(i) : n.add(i);
                                return n;
                              });
                              if (status === "wrong") setStatus("idle");
                            }}
                            aria-pressed={on}
                            aria-label={`${s.t}${group.length > 1 ? `, part of ${group.map((j) => SYLLABLES[j].t).join("")}` : ""}`}
                            className={cn(
                              "font-literary rounded-lg px-1 py-1 text-2xl transition-all duration-200 sm:text-[28px]",
                              reveal
                                ? isStress
                                  ? "font-semibold uppercase text-skill-lit"
                                  : "text-muted-foreground"
                                : on
                                  ? "-translate-y-1 bg-skill-lit/10 font-semibold text-skill-lit"
                                  : "text-ink hover:bg-muted",
                            )}
                          >
                            {s.t}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Prompt title="Same meaning. Different feeling." sub="Tap the words to place them from negative to positive." />
            <div key={shakeKey} className={cn("mt-6 grid grid-cols-3 gap-2 sm:gap-3", status === "wrong" && "shake")}>
              {SLOTS.map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <button
                    disabled={status === "right" || !slots[i]}
                    onClick={() => {
                      setSlots((s) => s.map((v, j) => (j === i ? null : v)));
                      if (status === "wrong") setStatus("idle");
                    }}
                    className={cn(
                      "flex h-14 w-full items-center justify-center rounded-xl border-2 border-dashed text-base font-bold transition-all sm:text-lg",
                      slots[i]
                        ? status === "right"
                          ? "pop-in border-solid border-skill-read bg-skill-read/10 text-skill-read-ink"
                          : "border-solid border-skill-read bg-skill-read/10 text-ink"
                        : "border-border text-muted-foreground/50",
                    )}
                  >
                    {slots[i] ?? "?"}
                  </button>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="relative mx-1 mt-2 h-1.5 rounded-full bg-gradient-to-r from-destructive/60 via-muted-foreground/30 to-success/70" />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {WORDS.map((w) => {
                const used = slots.includes(w);
                return (
                  <button
                    key={w}
                    disabled={used || status === "right"}
                    onClick={() => {
                      setSlots((s) => {
                        const idx = s.findIndex((v) => v === null);
                        if (idx === -1) return s;
                        const n = [...s];
                        n[idx] = w;
                        return n;
                      });
                      if (status === "wrong") setStatus("idle");
                    }}
                    className={cn(
                      "rounded-xl border-2 px-4 py-2 text-lg font-semibold transition-all",
                      used ? "border-transparent bg-muted text-transparent" : "border-border bg-white text-ink hover:-translate-y-0.5 hover:border-skill-read/60",
                    )}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Feedback tray, the heart of learning by doing */}
      <div
        className={cn(
          "border-t px-5 py-4 transition-colors duration-300 sm:px-8",
          status === "right" && "border-skill-read/30 bg-skill-read/10",
          status === "wrong" && "border-skill-write/25 bg-skill-write/5",
          status === "idle" && "border-border bg-white",
        )}
      >
        {status === "right" && (
          <div className="rise-in mb-3 flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-skill-read-ink text-white">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <div className="text-sm leading-relaxed text-ink">
              {step === 0 && (
                <>
                  <b>Spot on.</b> With <i>neither... nor</i>, the verb agrees with the subject closest to it.{" "}
                  <i>Students</i> is plural, so the verb becomes <b>were</b>.
                </>
              )}
              {step === 1 && (
                <>
                  <b>You hear it.</b> da-DUM, five times: the CUR · few TOLLS · the KNELL · of PART · ing DAY. That
                  pattern is called{" "}
                  <b>iambic pentameter</b>, the rhythm Shakespeare wrote most of his plays in.
                </>
              )}
              {step === 2 && (
                <>
                  <b>Exactly.</b> All three mean "not fat". What changes is the feeling, called <b>connotation</b>. Good
                  writers choose words for how they feel, not only for what they mean.
                </>
              )}
            </div>
          </div>
        )}

        {status === "wrong" && (
          <div className="rise-in mb-3 flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-skill-write-ink text-white">
              <X className="h-4 w-4" strokeWidth={3} />
            </span>
            <div className="text-sm leading-relaxed text-ink">
              {step === 0 && (
                <>
                  <b>Not that one.</b> Every word is spelled correctly. Look at the verb, then look at the noun right
                  before it. Do they agree?
                </>
              )}
              {step === 1 && (
                <>
                  <b>Almost.</b> {stressHint}
                </>
              )}
              {step === 2 && (
                <>
                  <b>Think about it this way.</b> Which word would you use as a compliment? Which one would hurt
                  someone's feelings?
                </>
              )}
              {attempts >= 2 && step === 1 && (
                <button
                  className="ml-1 font-bold text-skill-lit underline underline-offset-2"
                  onClick={() => {
                    setStresses(new Set(STRESSED));
                    markRight();
                  }}
                >
                  Show me
                </button>
              )}
            </div>
          </div>
        )}

        {status === "right" ? (
          <button
            onClick={next}
            className="w-full rounded-full bg-skill-read-ink px-6 py-3.5 font-bold text-white transition hover:brightness-110"
          >
            {step < 2 ? "Continue" : "Finish lesson"}
          </button>
        ) : (
          <button
            onClick={check}
            disabled={!canCheck}
            className={cn(
              "w-full rounded-full px-6 py-3.5 font-bold transition",
              canCheck ? "bg-ink text-white hover:brightness-125" : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {status === "wrong" ? "Try again" : "Check"}
          </button>
        )}
      </div>
    </Shell>
  );
};

const Prompt = ({ title, sub }: { title: string; sub: string }) => (
  <div>
    <h3 className="font-display text-xl font-extrabold leading-tight text-ink sm:text-2xl">{title}</h3>
    <p className="mt-1 text-sm font-medium text-muted-foreground sm:text-base">{sub}</p>
  </div>
);

const Shell = ({
  children,
  xp,
  xpPing,
  progress,
  label,
  chipClass,
}: {
  children: React.ReactNode;
  xp: number;
  xpPing: number;
  progress: number;
  label: string;
  chipClass: string;
}) => (
  <div className="relative flex min-h-[470px] flex-col overflow-hidden rounded-[28px] border border-border bg-[#FFFDF8] shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.45)]">
    <div className="flex items-center gap-3 border-b border-border/70 px-5 py-3.5 sm:px-8">
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", chipClass)}>
        {label}
      </span>
      <div className="flex flex-1 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
              style={{ width: progress > i ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <div className="relative flex items-center gap-1 text-sm font-extrabold text-ink">
        <Sparkles className="h-4 w-4 text-secondary" />
        <span className="tabular-nums">{xp}</span>
        <span className="text-[10px] font-bold text-muted-foreground">XP</span>
        {xpPing > 0 && (
          <span key={xpPing} className="xp-float pointer-events-none absolute -top-1 right-0 text-xs font-black text-secondary">
            +{XP_PER_STEP}
          </span>
        )}
      </div>
    </div>
    {children}
  </div>
);

export default LessonDemo;
