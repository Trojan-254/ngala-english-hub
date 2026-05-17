import { useAuth } from "@/context/AuthContext";

const LEVELS = [
  { name: "Apprentice", n: 1, minXp: 0,     icon: "✍️" },
  { name: "Scribe",     n: 2, minXp: 300,   icon: "📜" },
  { name: "Wordsmith",  n: 3, minXp: 1000,  icon: "🖊️" },
  { name: "Scholar",    n: 4, minXp: 3000,  icon: "🎓" },
  { name: "Griot",      n: 5, minXp: 10000, icon: "🌍" },
];

function getLevelInfo(xp: number) {
  const current = [...LEVELS].reverse().find(l => xp >= l.minXp) ?? LEVELS[0];
  const next = LEVELS.find(l => l.n === current.n + 1);
  const pct = next
    ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;
  return { current, next, pct };
}

export const LevelProgress = () => {
  const { user } = useAuth();
  const xp = user?.xp_total ?? 0;
  const { current, next, pct } = getLevelInfo(xp);

  return (
    <div className="bg-card rounded-2xl shadow-card p-7">
      <div className="grid grid-cols-12 gap-8 items-center">
        <div className="col-span-5">
          <div className="flex items-baseline gap-3">
            <div className="stat-num text-5xl text-primary">Level {current.n}</div>
            <div className="text-secondary font-bold text-lg">{current.name}</div>
          </div>

          <div className="relative mt-5 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="xp-shimmer relative h-full rounded-full bg-secondary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {xp.toLocaleString()} / {next ? next.minXp.toLocaleString() : '∞'} XP
            </span>
            {next && ` to Level ${next.n} - ${next.name}`}
          </div>
        </div>

        <div className="col-span-7">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-border" />
            {LEVELS.map((l) => {
              const state = l.n < current.n ? 'done'
                : l.n === current.n ? 'current'
                : 'locked';
              const base = "relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl ring-4 transition-all";
              const styles =
                state === "current" ? "bg-secondary text-primary ring-secondary/30 pulse-glow"
                : state === "done"  ? "bg-primary text-primary-foreground ring-primary/15"
                : "bg-muted text-muted-foreground/60 ring-border";
              return (
                <div key={l.n} className="flex flex-col items-center gap-2 w-16">
                  <div className={`${base} ${styles}`}>{l.icon}</div>
                  <div className="text-[11px] font-semibold text-foreground text-center leading-tight">
                    {l.name}
                    <div className="text-[10px] text-muted-foreground font-medium">Lv.{l.n}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
