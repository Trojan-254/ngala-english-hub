import { CountUp } from "./CountUp";

interface Stat {
  border: string;
  value: number;
  suffix?: string;
  label: string;
  icon: string;
  sub?: string;
}

const stats: Stat[] = [
  { border: "bg-secondary",   value: 2450, label: "Total Experience",   icon: "⚡", suffix: " XP" },
  { border: "bg-success",     value: 7,    label: "Current Streak",     icon: "🔥", suffix: " Days", sub: "Best: 12 days" },
  { border: "bg-primary",     value: 184,  label: "Questions Answered", icon: "✅" },
  { border: "bg-destructive", value: 73,   label: "Accuracy Rate",      icon: "🎯", suffix: "%" },
];

export const StatsBar = () => {
  return (
    <div className="grid grid-cols-4 gap-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative bg-card rounded-xl shadow-card overflow-hidden pl-5 pr-5 py-5 lift-card"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.border}`} />
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-num text-[34px] leading-none text-foreground">
                <CountUp end={s.value} suffix={s.suffix ?? ""} />
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</div>
              {s.sub && <div className="mt-1 text-xs text-muted-foreground/80">{s.sub}</div>}
            </div>
            <div className="text-2xl select-none">{s.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
