import { Lock } from "lucide-react";

interface Badge {
  emoji: string; title: string; sub: string; bg: string; locked?: boolean;
}

const badges: Badge[] = [
  { emoji: "🥋", title: "Grammar Ninja", sub: "Earned May 2",  bg: "bg-primary/10" },
  { emoji: "⚡", title: "Streak Master", sub: "Earned Apr 30", bg: "bg-secondary/15" },
  { emoji: "📖", title: "Speed Reader",  sub: "Earned Apr 29", bg: "bg-success/15" },
  { emoji: "⚔️", title: "Exam Warrior",  sub: "Complete a full past paper", bg: "bg-purple-light/15", locked: true },
  { emoji: "🌍", title: "Griot",         sub: "Reach Level 5", bg: "bg-warm-orange/15", locked: true },
];

interface BadgesProps {
  compact?: boolean;
}
export const Badges = ({ compact }: BadgesProps) => {
  if (compact) {
    return (
      <section>
        <h3 className="font-extrabold text-foreground mb-3">Your Achievements</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((b) => (
            <div
              key={b.title}
              className={`badge-card relative rounded-xl bg-card shadow-card p-3 text-center ${b.locked ? "locked" : ""}`}
            >
              <div className={`mx-auto w-10 h-10 rounded-full ${b.bg} flex items-center justify-center text-xl mb-2`}>
                {b.emoji}
              </div>
              <div className="font-bold text-[11px] text-foreground leading-tight">{b.title}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{b.sub}</div>
              {b.locked && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-foreground/70 text-white flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section>
      <h2 className="text-xl font-extrabold text-primary mb-4">Your Achievements</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {badges.map((b) => (
          <div
            key={b.title}
            className={`badge-card relative shrink-0 w-[170px] rounded-xl bg-card shadow-card p-4 text-center ${b.locked ? "locked" : ""}`}
          >
            <div className={`mx-auto w-16 h-16 rounded-full ${b.bg} flex items-center justify-center text-3xl mb-3`}>
              {b.emoji}
            </div>
            <div className="font-bold text-sm text-foreground">{b.title}</div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{b.sub}</div>
            {b.locked && (
              <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 text-white flex items-center justify-center">
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
