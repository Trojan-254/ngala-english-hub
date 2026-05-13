import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface Props {
  module: string;
  title: string;
  subtitle: string;
  stats: { attempts: number; accuracy: number; xp: number };
  children: React.ReactNode;
}

export const ArenaShell = ({ module, title, subtitle, stats, children }: Props) => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1280px] mx-auto px-8 py-8 space-y-6 animate-fade-in">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{module}</span>
          </nav>

          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 grid grid-cols-3 gap-6">
            {[
              { label: "Total attempts", value: stats.attempts.toLocaleString() },
              { label: "Accuracy", value: `${stats.accuracy}%` },
              { label: "XP earned", value: `${stats.xp.toLocaleString()} XP` },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <div className="text-2xl font-extrabold text-foreground tabular-nums">{s.value}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};
