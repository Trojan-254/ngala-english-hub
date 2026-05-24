import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Check, AlertCircle } from "lucide-react";
import { ArenaShell } from "@/components/ngala/ArenaShell";
import { api, Topic } from "@/lib/api";

interface Progress {
   mastered: number;
   due_today: number;
   total: number;
}

const VocabularyArena = () => {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, p] = await Promise.all([api.vocabulary.topics(), api.vocabulary.progress()]);
      setTopics(t.topics);
      setProgress(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = {
    attempts: progress?.total ?? 0,
    accuracy: 0,
    xp: 0,
  };

  return (
    <ArenaShell
      module="Vocabulary Builder"
      title="Vocabulary Arena"
      subtitle="Choose your weapon. Sharpen the words you know best."
      stats={stats}
    >
      <h2 className="text-lg font-bold text-foreground">Choose Your Weapon</h2>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card h-[200px] animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Could not load topics</div>
            <div className="text-xs text-muted-foreground mt-1">{error}</div>
          </div>
          <button
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && topics && topics.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No vocabulary topics yet. Ask your teacher to add words.
        </div>
      )}

      {!loading && !error && topics && topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((c, i) => {
            const due = progress?.due_today ?? 0;
            return (
              <article
                key={c.id}
                className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col transition-colors hover:border-secondary/60"
                style={{ opacity: 0, animation: `fade-in 0.4s ease-out ${i * 40}ms forwards` }}
              >
                <div className="h-1 bg-secondary group-hover:h-1.5 transition-all duration-150" />
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-[15px] font-bold text-foreground">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.question_count > 0 ? `${c.question_count} words available` : "Words available"}
                  </p>
                  {i === 0 && (
                    <div className="mt-4">
                      {due > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-secondary/15 text-warm-orange">
                          <Clock className="w-3 h-3" /> {due} due today
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full bg-success/15 text-success">
                          <Check className="w-3 h-3" /> Up to date
                        </span>
                      )}
                    </div>
                  )}
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
      )}
    </ArenaShell>
  );
};

export default VocabularyArena;
