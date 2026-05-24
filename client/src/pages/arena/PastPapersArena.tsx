import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, AlertCircle } from "lucide-react";
import { ArenaShell } from "@/components/ngala/ArenaShell";
import { api, PastPaper, PastPaperResult } from "@/lib/api";

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const PastPapersArena = () => {
  const [papers, setPapers] = useState<PastPaper[] | null>(null);
  const [results, setResults] = useState<PastPaperResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([api.pastpapers.list(), api.pastpapers.results()]);
      setPapers(p.papers);
      setResults(r.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = { attempts: results.length, accuracy: 0, xp: 0 };
  const years = papers ? Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a) : [];

  const resultFor = (paper: PastPaper): PastPaperResult | undefined =>
    results.find((r) => r.paper_title === paper.title && r.year === paper.year && r.paper_number === paper.paper_number);

  return (
    <ArenaShell
      module="Past Papers"
      title="Past Papers Arena"
      subtitle="Choose your challenge. Real KCSE. No shortcuts."
      stats={stats}
    >
      <h2 className="text-lg font-bold text-foreground">Choose Your Challenge</h2>

      {loading && (
        <div className="space-y-8">
          {[0, 1].map((y) => (
            <section key={y}>
              <div className="h-4 w-16 bg-muted rounded mb-3 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="bg-card rounded-xl border border-border h-[180px] animate-pulse" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Could not load past papers</div>
            <div className="text-xs text-muted-foreground mt-1">{error}</div>
          </div>
          <button onClick={() => void load()} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && papers && papers.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No past papers available yet.
        </div>
      )}

      {!loading && !error && papers && papers.length > 0 && (
        <div className="space-y-8">
          {years.map((y) => {
            const list = papers.filter((p) => p.year === y);
            return (
              <section key={y}>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{y}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((p, i) => {
                    const h = Math.floor(p.duration_minutes / 60);
                    const m = p.duration_minutes % 60;
                    const r = resultFor(p);
                    const noQuestions = p.question_count === 0;
                    const pct = r ? Math.round((r.score / Math.max(r.total_q, 1)) * 100) : 0;
                    return (
                      <article
                        key={p.id}
                        className="bg-card rounded-xl border border-border p-5 hover:border-purple-deep/60 transition-colors"
                        style={{ opacity: 0, animation: `fade-in 0.4s ease-out ${i * 40}ms forwards` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-[15px] font-bold text-foreground">{p.title}</h4>
                          {noQuestions && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                              No questions yet
                            </span>
                          )}
                        </div>
                        {p.description && <p className="text-[13px] text-muted-foreground mt-1">{p.description}</p>}
                        <div className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" /> {h} hours {m > 0 && `${m} minutes`}
                        </div>
                        <div className="mt-3 text-xs">
                          {r ? (
                            <span className="text-success font-semibold">Score: {pct}% · {fmtDate(r.ended_at || r.started_at)}</span>
                          ) : (
                            <span className="text-muted-foreground">Not attempted</span>
                          )}
                        </div>

                        {noQuestions ? (
                          <div className="mt-4 block text-center w-full rounded-lg py-2.5 text-[13px] font-semibold bg-muted text-muted-foreground">
                            Questions coming soon
                          </div>
                        ) : (
                          <Link
                            to={`/arena/pastpapers/${p.id}`}
                            className="mt-4 block text-center w-full rounded-lg py-2.5 text-[13px] font-semibold bg-purple-deep text-white hover:brightness-110 transition"
                          >
                            Enter Chamber →
                          </Link>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </ArenaShell>
  );
};

export default PastPapersArena;
