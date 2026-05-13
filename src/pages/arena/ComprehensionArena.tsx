import { Link } from "react-router-dom";
import { ArenaShell } from "@/components/ngala/ArenaShell";
import { passages, moduleStats } from "@/lib/arenaData";

const stripByDiff: Record<number, string> = { 1: "bg-success", 2: "bg-secondary", 3: "bg-destructive" };

const ComprehensionArena = () => {
  return (
    <ArenaShell
      module="Reading Comprehension"
      title="Reading Arena"
      subtitle="Choose your mission. Read closely. Think deeply."
      stats={moduleStats.comprehension}
    >
      <h2 className="text-lg font-bold text-foreground">Choose Your Mission</h2>

      <div className="space-y-4">
        {passages.map((p, i) => {
          const readMin = Math.max(1, Math.round(p.word_count / 200));
          return (
            <article
              key={p.id}
              className="bg-card rounded-xl border border-border overflow-hidden flex hover:border-success/60 transition-colors"
              style={{ opacity: 0, animation: `fade-in 0.4s ease-out ${i * 40}ms forwards` }}
            >
              <div className={`w-1 ${stripByDiff[p.difficulty]}`} />
              <div className="flex-1 p-5 flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-foreground">{p.title}</h3>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.type}</span>
                    <span className="text-xs text-muted-foreground">{p.word_count} words</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{p.question_count} questions</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">~{readMin} min read</span>
                  </div>
                </div>

                <div className="text-right">
                  {p.completed ? (
                    <span className="text-xs font-semibold text-success">Completed · {p.accuracy}%</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not attempted</span>
                  )}
                </div>

                <Link
                  to={`/arena/comprehension/${p.id}`}
                  className="shrink-0 px-4 py-2.5 rounded-lg bg-success text-success-foreground text-sm font-bold hover:brightness-110 transition"
                >
                  Begin Mission →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </ArenaShell>
  );
};

export default ComprehensionArena;
