import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArenaShell } from "@/components/ngala/ArenaShell";
import { api, Topic, Passage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const stripByDiff: Record<number, string> = {
  1: "bg-success",
  2: "bg-secondary",
  3: "bg-destructive"
};

const ComprehensionArena = () => {
  const { user } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<{ total_attempts: number; accuracy_pct: number; xp_from_module: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.comprehension.topics(user?.curriculum ?? undefined),
      api.comprehension.progress(),
    ]).then(async ([topicsRes, progressRes]) => {
      setTopics(topicsRes.topics);
      setProgress(progressRes.progress);

      // Fetch passages for all topics
      const allPassages = await Promise.all(
        topicsRes.topics.map(t =>
          api.comprehension.passages(t.id).then(r => r.passages).catch(() => [])
        )
      );
      setPassages(allPassages.flat());
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const stats = {
    attempts: progress?.total_attempts ?? 0,
    accuracy: progress?.accuracy_pct ?? 0,
    xp: progress?.xp_from_module ?? 0,
  };

  return (
    <ArenaShell module="Reading Comprehension" title="Reading Arena"
      subtitle="Choose your mission. Read closely. Think deeply." stats={stats}>
      <h2 className="text-lg font-bold text-foreground">Choose Your Mission</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : passages.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No passages available yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Check back after your teacher adds content.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {passages.map((p, i) => {
            const readMin = Math.max(1, Math.round(p.word_count / 200));
            return (
              <article key={p.id}
                className="bg-card rounded-xl border border-border overflow-hidden flex hover:border-success/60 transition-colors"
                style={{ opacity: 0, animation: `fade-in 0.4s ease-out ${i * 40}ms forwards` }}>
                <div className={`w-1 ${stripByDiff[p.difficulty]}`} />
                <div className="flex-1 p-5 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-foreground">{p.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{p.word_count} words</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{p.question_count} questions</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">~{readMin} min read</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Not attempted</span>
                  </div>
                  <Link to={`/arena/comprehension/${p.id}`}
                    className="shrink-0 px-4 py-2.5 rounded-lg bg-success text-success-foreground text-sm font-bold hover:brightness-110 transition">
                    Begin Mission →
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

export default ComprehensionArena;
