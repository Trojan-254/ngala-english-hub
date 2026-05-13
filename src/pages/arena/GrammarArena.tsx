import { Link } from "react-router-dom";
import { ArenaShell } from "@/components/ngala/ArenaShell";
import { grammarTopics, moduleStats, accuracyColor } from "@/lib/arenaData";

const stripColor: Record<string, string> = {
  primary: "bg-primary",
  red: "bg-destructive",
  gold: "bg-secondary",
  green: "bg-success",
};
const borderColor: Record<string, string> = {
  primary: "hover:border-primary/60",
  red: "hover:border-destructive/60",
  gold: "hover:border-secondary/60",
  green: "hover:border-success/60",
};
const btnColor: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  red: "bg-destructive text-destructive-foreground",
  gold: "bg-secondary text-secondary-foreground",
  green: "bg-success text-success-foreground",
};
const diffPill: Record<number, { label: string; cls: string }> = {
  1: { label: "Easy", cls: "bg-success/15 text-success" },
  2: { label: "Medium", cls: "bg-secondary/20 text-warm-orange" },
  3: { label: "Hard", cls: "bg-destructive/15 text-destructive" },
};

const GrammarArena = () => {
  const weakest = [...grammarTopics]
    .filter((t) => t.my_accuracy !== null && t.question_count >= 3)
    .sort((a, b) => (a.my_accuracy! - b.my_accuracy!))[0];

  return (
    <ArenaShell
      module="Grammar Drills"
      title="Grammar Drills Arena"
      subtitle="Choose your weapon. Your accuracy data guides the way."
      stats={moduleStats.grammar}
    >
      <h2 className="text-lg font-bold text-foreground">Choose Your Weapon</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {grammarTopics.map((t, i) => {
          const c = accuracyColor(t.my_accuracy);
          const tinted = t.my_accuracy !== null && t.my_accuracy < 50;
          return (
            <article
              key={t.id}
              className={`group relative rounded-xl border border-border bg-card overflow-hidden flex flex-col transition-colors ${borderColor[c]}`}
              style={{
                opacity: 0,
                animation: `fade-in 0.4s ease-out ${i * 40}ms forwards`,
                backgroundColor: tinted ? "rgba(217,64,53,0.03)" : undefined,
              }}
            >
              <div className={`h-1 ${stripColor[c]} group-hover:h-1.5 transition-all duration-150`} />
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-[15px] font-bold text-foreground leading-tight">{t.title}</h3>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${diffPill[t.difficulty].cls}`}>
                    {diffPill[t.difficulty].label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t.question_count} questions available</p>

                <div className="mt-4 mb-5">
                  {t.my_accuracy === null ? (
                    <p className="text-xs italic text-muted-foreground">Not yet attempted</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                        <div className={`h-full ${stripColor[c]}`} style={{ width: `${t.my_accuracy}%` }} />
                      </div>
                      <span className="text-[13px] font-bold text-foreground tabular-nums">{t.my_accuracy}%</span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/arena/grammar/${t.id}`}
                  className={`mt-auto block text-center w-full rounded-lg py-2.5 text-[13px] font-semibold transition hover:brightness-110 ${btnColor[c]}`}
                >
                  Draw Weapon →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {weakest && (
        <div className="rounded-xl p-5 flex items-center justify-between gap-4" style={{ background: "hsl(var(--amber-soft))", border: "1px solid hsl(var(--secondary) / 0.3)" }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-warm-orange">Recommended Weapon</div>
            <p className="text-sm text-foreground mt-1">
              Your weakest area is <span className="font-bold">{weakest.title}</span> at <span className="font-bold">{weakest.my_accuracy}%</span> accuracy. Face it now.
            </p>
          </div>
          <Link
            to={`/arena/grammar/${weakest.id}`}
            className="shrink-0 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-bold hover:brightness-105 transition"
          >
            Confront It →
          </Link>
        </div>
      )}
    </ArenaShell>
  );
};

export default GrammarArena;
