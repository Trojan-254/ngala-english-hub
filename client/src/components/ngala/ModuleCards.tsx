import { Link } from "react-router-dom";

interface Mod {
  title: string;
  to: string;
  desc: string;
  done: number;
  total: number;
  unit: string;
  stat: string;
  gradient: string;
  extra?: string;
}

const modules: Mod[] = [
  {
    title: "Grammar Drills",
    to: "/arena/grammar",
    desc: "Conquer tenses, articles, and concord. Battle your weaknesses.",
    done: 47, total: 100, unit: "questions",
    stat: "47 questions completed · 68% accuracy",
    gradient: "from-primary to-primary-light",
  },
  {
    title: "Reading Comprehension",
    to: "/arena/comprehension",
    desc: "Travel through passages. Find meaning between the lines.",
    done: 3, total: 10, unit: "passages",
    stat: "3 passages completed · 81% accuracy",
    gradient: "from-success to-success-dark",
  },
  {
    title: "Past Papers",
    to: "/arena/pastpapers",
    desc: "Face the KCSE. Timed. Real questions. No shortcuts.",
    done: 1, total: 5, unit: "papers",
    stat: "1 paper completed · Avg score 64%",
    gradient: "from-purple-deep to-purple-light",
  },
  {
    title: "Vocabulary Builder",
    to: "/arena/vocabulary",
    desc: "Five new words a day. Build the arsenal of a Scholar.",
    done: 35, total: 200, unit: "words",
    stat: "35 words mastered",
    gradient: "from-destructive to-warm-orange",
    extra: "5 words today",
  },
];

export const ModuleCards = () => {
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
          const pct = Math.round((m.done / m.total) * 100);
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
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-white/80">
                    {m.stat}{m.extra && <span className="ml-2">· {m.extra}</span>}
                  </div>
                  <Link to={m.to} className="px-4 py-2 rounded-lg bg-secondary text-primary text-sm font-bold hover:brightness-105 transition">
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
