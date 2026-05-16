const levels = [
  { icon: "✍️", name: "Apprentice", n: 1, state: "done" },
  { icon: "📜", name: "Scribe",     n: 2, state: "done" },
  { icon: "🖊️", name: "Wordsmith",  n: 3, state: "current" },
  { icon: "🎓", name: "Scholar",    n: 4, state: "locked" },
  { icon: "🌍", name: "Griot",      n: 5, state: "locked" },
] as const;

export const LevelProgress = () => {
  const pct = (2450 / 3000) * 100;
  return (
    <div className="bg-card rounded-2xl shadow-card p-7">
      <div className="grid grid-cols-12 gap-8 items-center">
        {/* Left */}
        <div className="col-span-5">
          <div className="flex items-baseline gap-3">
            <div className="stat-num text-5xl text-primary">Level 3</div>
            <div className="text-secondary font-bold text-lg">Wordsmith</div>
          </div>

          <div className="relative mt-5 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="xp-shimmer relative h-full rounded-full bg-secondary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">2,450 / 3,000 XP</span> to Level 4 — Scholar
          </div>
        </div>

        {/* Right - path */}
        <div className="col-span-7">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-border" />
            {levels.map((l) => {
              const base = "relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl ring-4 transition-all";
              const styles =
                l.state === "current"
                  ? "bg-secondary text-primary ring-secondary/30 pulse-glow"
                  : l.state === "done"
                  ? "bg-primary text-primary-foreground ring-primary/15"
                  : "bg-muted text-muted-foreground/60 ring-border locked";
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
