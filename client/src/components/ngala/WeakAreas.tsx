import { Link } from "react-router-dom";
import { TopicBreakdown } from "@/lib/api";

interface Props {
  topics: TopicBreakdown[];
  loading: boolean;
}

export const WeakAreas = ({ topics, loading }: Props) => {
  if (loading) {
    return (
      <section className="rounded-2xl bg-amber-soft border-l-4 border-secondary p-6 shadow-card animate-pulse">
        <div className="h-4 bg-muted rounded w-40 mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-xl" />)}
        </div>
      </section>
    );
  }

  if (topics.length === 0) {
    return (
      <section className="rounded-2xl bg-amber-soft border-l-4 border-secondary p-6 shadow-card">
        <h3 className="font-extrabold text-foreground">Areas to Focus On</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Complete more grammar drills to see your weak areas here.
        </p>
      </section>
    );
  }

  return (
    <section className="sweep-in rounded-2xl bg-amber-soft border-l-4 border-secondary p-6 shadow-card">
      <h3 className="font-extrabold text-foreground">Areas to Focus On</h3>
      <p className="text-xs text-muted-foreground mt-1">
        These topics are slowing your XP — fix them and watch your accuracy climb.
      </p>
      <ul className="mt-4 space-y-2.5">
        {topics.map((t) => (
          <li
            key={t.topic}
            className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border/60"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{t.topic}</span>
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                {t.accuracy_pct}% accuracy
              </span>
            </div>
            <Link
              to="/arena/grammar"
              className="text-sm font-bold text-primary hover:text-primary-light transition"
            >
              Practice Now →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
