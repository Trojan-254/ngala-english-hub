import { Link } from "react-router-dom";
import { Clock, Check } from "lucide-react";
import { ArenaShell } from "@/components/ngala/ArenaShell";
// import { vocabCategories, moduleStats } from "@/lib/arenaData";

const vocabCategories = [];
const stats = { attempts: 0, accuracy: 0, xp: 0 };

const VocabularyArena = () => {
  return (
    <ArenaShell
      module="Vocabulary Builder"
      title="Vocabulary Arena"
      subtitle="Choose your weapon. Sharpen the words you know best."
      stats={moduleStats.vocabulary}
    >
      <h2 className="text-lg font-bold text-foreground">Choose Your Weapon</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vocabCategories.map((c, i) => {
          const pct = Math.round((c.mastered / c.total) * 100);
          return (
            <article
              key={c.id}
              className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col transition-colors hover:border-secondary/60"
              style={{ opacity: 0, animation: `fade-in 0.4s ease-out ${i * 40}ms forwards` }}
            >
              <div className="h-1 bg-secondary group-hover:h-1.5 transition-all duration-150" />
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-[15px] font-bold text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.mastered} / {c.total} words mastered</p>
                <div className="mt-3 h-1.5 bg-muted overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-4">
                  {c.due_today > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-secondary/15 text-warm-orange">
                      <Clock className="w-3 h-3" /> {c.due_today} due today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-success/15 text-success">
                      <Check className="w-3 h-3" /> Up to date
                    </span>
                  )}
                </div>

                <Link
                  to={`/arena/vocabulary/${c.id}`}
                  className="mt-5 block text-center w-full rounded-lg py-2.5 text-[13px] font-semibold bg-primary text-primary-foreground hover:brightness-110 transition"
                >
                  Enter →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </ArenaShell>
  );
};

export default VocabularyArena;
