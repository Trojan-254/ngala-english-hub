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

export const Badges = () => {
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
