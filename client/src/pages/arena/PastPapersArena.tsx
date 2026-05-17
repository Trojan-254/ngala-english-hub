import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { ArenaShell } from "@/components/ngala/ArenaShell";
// import { pastPapers, moduleStats } from "@/lib/arenaData";

const pastPapers = [];
const stats = { attempts: 0, accuracy: 0, xp: 0};

const PastPapersArena = () => {
  const years = Array.from(new Set(pastPapers.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <ArenaShell
      module="Past Papers"
      title="Past Papers Arena"
      subtitle="Choose your challenge. Real KCSE. No shortcuts."
      stats={moduleStats.pastpapers}
    >
      <h2 className="text-lg font-bold text-foreground">Choose Your Challenge</h2>

      <div className="space-y-8">
        {years.map((y) => {
          const list = pastPapers.filter((p) => p.year === y);
          return (
            <section key={y}>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{y}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((p, i) => {
                  const h = Math.floor(p.duration_minutes / 60);
                  const m = p.duration_minutes % 60;
                  return (
                    <article key={p.id}
                      className="bg-card rounded-xl border border-border p-5 hover:border-purple-deep/60 transition-colors"
                      style={{ opacity: 0, animation: `fade-in 0.4s ease-out ${i * 40}ms forwards` }}>
                      <h4 className="text-[15px] font-bold text-foreground">{p.title}</h4>
                      <p className="text-[13px] text-muted-foreground mt-1">{p.description}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /> {h} hours {m > 0 && `${m} minutes`}
                      </div>
                      <div className="mt-3 text-xs">
                        {p.attempted ? (
                          <span className="text-success font-semibold">Score: {p.score}% · {p.date_attempted}</span>
                        ) : (
                          <span className="text-muted-foreground">Not attempted</span>
                        )}
                      </div>
                      <Link to={`/arena/pastpapers/${p.id}`}
                        className="mt-4 block text-center w-full rounded-lg py-2.5 text-[13px] font-semibold bg-purple-deep text-white hover:brightness-110 transition">
                        Enter Chamber →
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </ArenaShell>
  );
};

export default PastPapersArena;
