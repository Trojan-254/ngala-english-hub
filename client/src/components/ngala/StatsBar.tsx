import { Zap, Flame, CheckCircle2, Target } from "lucide-react";
import { CountUp } from "./CountUp";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";

export const StatsBar = () => {
  const { user } = useAuth();
  const { grammarProgress } = useDashboard();

  const totalAttempts = grammarProgress?.total_attempts ?? 0;
  const accuracy = grammarProgress?.accuracy_pct ?? 0;
  const xp = user?.xp_total ?? 0;

  const stats = [
    {
      border: "bg-secondary",
      value: xp,
      label: "Total Experience",
      Icon: Zap,
      iconClass: "text-secondary",
      suffix: " XP"
    },
    {
      border: "bg-success",
      value: 0,
      label: "Current Streak",
      Icon: Flame,
      iconClass: "text-warm-orange",
      suffix: " Days",
      sub: "Keep going!"
    },
    {
      border: "bg-primary",
      value: totalAttempts,
      label: "Questions Answered",
      Icon: CheckCircle2,
      iconClass: "text-primary"
    },
    {
      border: "bg-destructive",
      value: accuracy,
      label: "Accuracy Rate",
      Icon: Target,
      iconClass: "text-destructive",
      suffix: "%"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map(({ Icon, iconClass, sub, ...s }) => (
        <div key={s.label} className="relative bg-card rounded-xl shadow-card overflow-hidden pl-5 pr-5 py-5 lift-card">
         <div className={`absolute left-0 top-0 bottom-0 w-1.5`} />
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-num text-[34px] leading-none text-foreground">
                <CountUp end={s.value} suffix={s.suffix ?? ""} />
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</div>
              {sub && <div className="mt-1 text-xs text-muted-foreground/80">{sub}</div>}
            </div>
            <Icon className={`w-6 h-6 ${iconClass}`} strokeWidth={2.2} />
          </div>
        </div>
      ))}
    </div>
  );
};
