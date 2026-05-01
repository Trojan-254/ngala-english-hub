import { BookOpen, Home, PenLine, BookMarked, FileText, Type, Trophy, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: PenLine, label: "Grammar Drills" },
  { icon: BookMarked, label: "Reading" },
  { icon: FileText, label: "Past Papers" },
  { icon: Type, label: "Vocabulary" },
  { icon: Trophy, label: "Leaderboard" },
  { icon: User, label: "My Progress" },
];

export const Sidebar = () => {
  return (
    <aside className="w-[240px] shrink-0 bg-primary text-primary-foreground flex flex-col min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary/15 ring-1 ring-secondary/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-secondary" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-extrabold tracking-tight">Ngala</div>
            <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">English Hub</div>
          </div>
        </div>
      </div>

      {/* User greeting */}
      <div className="mx-4 mb-6 p-3 rounded-xl bg-white/5 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-secondary text-primary font-extrabold flex items-center justify-center text-sm">
            JO
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">John Otieno</div>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold tracking-wide">
              Lv.3 · Wordsmith
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1">
        <ul className="space-y-1">
          {navItems.map(({ icon: Icon, label, active }) => (
            <li key={label}>
              <a
                href="#"
                className={[
                  "group flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-white/10 border-l-4 border-secondary text-white"
                    : "border-l-4 border-transparent text-white/75 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-6 py-5 text-[11px] text-white/40">
        Powered by Pwani University TP 2026
      </div>
    </aside>
  );
};
