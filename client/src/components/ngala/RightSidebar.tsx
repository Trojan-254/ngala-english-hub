import { Check, Crown } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";

const week = [
  { d: "M", done: true },
  { d: "T", done: true },
  { d: "W", done: true },
  { d: "T", done: true },
  { d: "F", done: true, today: true },
  { d: "S", done: false },
  { d: "S", done: false },
];


const rankColor = (r: number) =>
  r === 1 ? "text-secondary" : r === 2 ? "text-muted-foreground" : r === 3 ? "text-warm-orange" : "text-foreground";

export const RightSidebar = () => {
  const { leaderboard } = useSocket();
  const { user } = useAuth();

  const leaders = leaderboard.length > 0
  ? leaderboard.slice(0, 5).map((l, i) => ({
      rank: i + 1,
      name: l.display_name,
      xp: l.weekly_xp,
      init: l.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join(''),
      me: l.display_name === user?.display_name
    }))
  : [];
  return (
    <aside className="w-[300px] shrink-0 space-y-5">
      {/* Streak calendar */}
      <div className="bg-card rounded-2xl shadow-card p-5">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">This Week</div>
        <div className="mt-3 flex justify-between">
          {week.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition",
                  day.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
                  day.today ? "ring-4 ring-secondary/60" : "",
                ].join(" ")}
              >
                {day.done ? <Check className="w-4 h-4" strokeWidth={3} /> : ""}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">{day.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm font-extrabold text-foreground">🔥 7-day streak! Keep it going!</div>
      </div>

      {/* Leaderboard */}
       <div className="bg-card rounded-2xl shadow-card p-5">
        <h3 className="font-extrabold text-foreground">🏆 This Week's Leaders</h3>
        {leaders.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-3">
            Leaderboard updates as students answer questions.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {leaders.map((l, i) => (
              <li 
                key={l.rank} 
                style={{ animationDelay: `${i * 100}ms` }}
                className={[
                  "slide-in flex items-center gap-3 px-3 py-2.5 rounded-xl border-l-4",
                  l.me ? "bg-secondary/10 border-secondary" : "border-transparent hover:bg-muted/60",
                ].join(" ")}
              >
                <div className={`w-6 text-center font-extrabold ${rankColor(l.rank)}`}>
                  {l.rank === 1 ? <Crown className="w-5 h-5 mx-auto" /> : l.rank}
                </div>

                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-extrabold flex items-center justify-center">
                  {l.init}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${l.me ? "text-primary" : "text-foreground"}`}>
                    {l.name}{l.me && <span className="ml-1 text-[10px] text-secondary font-bold">YOU</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{l.xp.toLocaleString()} XP</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 text-[11px] text-muted-foreground">Resets Monday · 3 days left</div>
      </div>

      {/* Word of the day */}
      <div className="rounded-2xl shadow-card p-6 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -right-6 -bottom-8 text-[120px] opacity-10 select-none">📚</div>
        <div className="text-[11px] font-bold tracking-[0.2em] text-secondary uppercase">Word of the Day</div>
        <div className="stat-num text-4xl mt-2">Eloquent</div>
        <div className="text-xs italic text-white/70 mt-1">adjective</div>
        <div className="text-sm mt-3 text-white/90">Fluent or persuasive in speaking or writing.</div>
        <div className="text-xs mt-3 text-white/70 italic border-l-2 border-secondary pl-3">
          "The student gave an eloquent speech that moved the entire assembly."
        </div>
        <button className="mt-5 w-full py-2.5 rounded-lg bg-white text-primary text-sm font-bold hover:bg-secondary hover:text-primary transition">
          Add to My List →
        </button>
      </div>
    </aside>
  );
};
