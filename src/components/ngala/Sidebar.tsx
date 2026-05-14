import {
  BookOpen,
  Home,
  PenLine,
  BookMarked,
  FileText,
  Type,
  Trophy,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Dashboard", to: "/dashboard" },
  { icon: PenLine, label: "Grammar Drills", to: "/arena/grammar" },
  { icon: BookMarked, label: "Reading", to: "/arena/comprehension" },
  { icon: FileText, label: "Past Papers", to: "/arena/pastpapers" },
  { icon: Type, label: "Vocabulary", to: "/arena/vocabulary" },
  { icon: Trophy, label: "Leaderboard", to: "#" },
  { icon: User, label: "My Progress", to: "#" },
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const SidebarInner = (
    <>
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary/15 ring-1 ring-secondary/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-secondary" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-extrabold tracking-tight">Ngala</div>
            <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">English Hub</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
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
      <nav className="px-3 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ icon: Icon, label, active }) => (
            <li key={label}>
              <a
                href="#"
                onClick={() => setOpen(false)}
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
    </>
  );

  return (
    <>
      {/* Mobile/tablet hamburger trigger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg ring-1 ring-white/10"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop (mobile/tablet) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
        />
      )}

      {/* Desktop: fixed sidebar that stays put on scroll */}
      <aside className="hidden lg:flex w-[240px] shrink-0 bg-primary text-primary-foreground flex-col fixed top-0 left-0 h-screen z-30">
        {SidebarInner}
      </aside>

      {/* Spacer to reserve layout space for the fixed desktop sidebar */}
      <div className="hidden lg:block w-[240px] shrink-0" aria-hidden="true" />

      {/* Mobile/tablet drawer */}
      <aside
        className={[
          "lg:hidden fixed top-0 left-0 h-screen w-[260px] bg-primary text-primary-foreground flex flex-col z-50 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {SidebarInner}
      </aside>
    </>
  );
};
