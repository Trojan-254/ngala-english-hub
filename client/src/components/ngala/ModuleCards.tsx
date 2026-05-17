import { Link } from "react-router-dom";
import { DashboardData } from "@/hooks/useDashboard";

interface Props {
  dashboard: DashboardData;
}

export const ModuleCards = ({ dashboard }: Props) => {
  const { grammarProgress, comprehensionProgress } = dashboard;

  const modules = [
    {
      title: "Grammar Drills",
      to: "/arena/grammar",
      desc: "Conquer tenses, articles, and concord. Battle your weaknesses.",
      done: grammarProgress?.total_attempts ?? 0,
      total: 100,
      unit: "questions",
      stat: grammarProgress
        ? `${grammarProgress.total_attempts} attempts · ${grammarProgress.accuracy_pct}% accuracy`
        : "No attempts yet",
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Reading Comprehension",
      to: "/arena/comprehension",
      desc: "Travel through passages. Find meaning between the lines.",
      done: comprehensionProgress?.total_attempts ?? 0,
      total: 10,
      unit: "passages",
      stat: comprehensionProgress
        ? `${comprehensionProgress.total_attempts} attempts · ${comprehensionProgress.accuracy_pct}% accuracy`
        : "No attempts yet",
      gradient: "from-success to-success-dark",
    },
    {
      title: "Past Papers",
      to: "/arena/pastpapers",
      desc: "Face the KCSE. Timed. Real questions. No shortcuts.",
      done: 0,
      total: 5,
      unit: "papers",
      stat: "No papers attempted yet",
      gradient: "from-purple-deep to-purple-light",
    },
    {
      title: "Vocabulary Builder",
      to: "/arena/vocabulary",
      desc: "Five new words a day. Build the arsenal of a Scholar.",
      done: 0,
      total: 200,
      unit: "words",
      stat: "Start building your vocabulary",
      gradient: "from-destructive to-warm-orange",
    },
  ];

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-primary">Choose Your Arena</h2>
          <p className="text-sm text-muted-foreground">Every question makes you stronger</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {modules.map((m) => {
          const pct = m.total > 0 ? Math.min(Math.round((m.done / m.total) * 100), 100) : 0;
          return (
            <article
              key={m.title}
              className={`lift-card relative rounded-2xl shadow-card overflow-hidden bg-gradient-to-br ${m.gradient} text-white p-6 min-h-[230px] flex flex-col`}
            >
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 select-none" />
              <div className="absolute -right-20 top-16 w-40 h-40 rounded-full bg-white/5 select-none" />

              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-md bg-white/90" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold leading-tight">{m.title}</h3>
                  <p className="text-sm text-white/85 mt-1 leading-snug">{m.desc}</p>
                </div>
              </div>

              <div className="relative mt-auto pt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-white/90 mb-1.5">
                  <span>{m.done} / {m.total} {m.unit}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-white/80">{m.stat}</div>
                  <Link
                    to={m.to}
                    className="px-4 py-2 rounded-lg bg-secondary text-primary text-sm font-bold hover:brightness-105 transition"
                  >
                    Enter Arena →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
