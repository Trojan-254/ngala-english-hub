import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Ear,
  Feather,
  Flame,
  GraduationCap,
  Menu,
  Mic,
  PenLine,
  ScrollText,
  Smartphone,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NgalaLogo, NgalaMark } from "@/components/brand/Logo";
import LessonDemo from "@/components/landing/LessonDemo";
import { cn } from "@/lib/utils";

/* ------------------------------ helpers ------------------------------ */

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useCountUp(target: number, duration = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

/* ------------------------------ content ------------------------------ */

const SKILLS = [
  { word: "Listen", tint: "bg-skill-listen/15", text: "text-skill-listen-ink", Icon: Ear },
  { word: "Speak", tint: "bg-skill-speak/20", text: "text-skill-speak-ink", Icon: Mic },
  { word: "Write", tint: "bg-skill-write/15", text: "text-skill-write-ink", Icon: PenLine },
  { word: "Read", tint: "bg-skill-read/15", text: "text-skill-read-ink", Icon: BookOpen },
];

const STEPS = [
  {
    n: "01",
    title: "Puzzle first",
    body: "Every lesson opens with a problem, not a lecture. Your first attempt is what makes the explanation land.",
    color: "bg-skill-listen",
  },
  {
    n: "02",
    title: "Play with it",
    body: "Tap, drag, sort, slide and speak. You move the language around until you can feel how it works.",
    color: "bg-skill-speak",
  },
  {
    n: "03",
    title: "See why",
    body: "Every answer is explained, right or wrong. A mistake is a clue, so you always get another go.",
    color: "bg-skill-write",
  },
  {
    n: "04",
    title: "Make it stick",
    body: "Review sessions bring ideas back just before you would forget them, mixed up the way exams mix them.",
    color: "bg-skill-read",
  },
];

type PathItem = { name: string; live: boolean };
const PATHS: {
  skill: string;
  title: string;
  blurb: string;
  Icon: typeof Ear;
  color: string;
  tint: string;
  items: PathItem[];
}[] = [
  {
    skill: "Read",
    title: "Read between the lines",
    blurb: "Comprehension, inference and the vocabulary to back it up.",
    Icon: BookOpen,
    color: "bg-skill-read-ink text-white",
    tint: "bg-skill-read/10",
    items: [
      { name: "Comprehension arena", live: true },
      { name: "Vocabulary builder", live: true },
      { name: "Summary and note-making", live: false },
    ],
  },
  {
    skill: "Write",
    title: "Write with control",
    blurb: "Grammar that clicks, then writing that persuades.",
    Icon: PenLine,
    color: "bg-skill-write-ink text-white",
    tint: "bg-skill-write/10",
    items: [
      { name: "Grammar arena", live: true },
      { name: "Functional writing", live: false },
      { name: "Composition", live: false },
    ],
  },
  {
    skill: "Literature",
    title: "Literature, decoded",
    blurb: "Poetry, oral literature and the texts you study, made playable.",
    Icon: Feather,
    color: "bg-skill-lit text-white",
    tint: "bg-skill-lit/10",
    items: [
      { name: "Poetry: rhythm, imagery, tone", live: false },
      { name: "Oral literature", live: false },
      { name: "Set text studios", live: false },
    ],
  },
  {
    skill: "Listen",
    title: "Listen closely",
    blurb: "Tune your ear for tone, intention and detail.",
    Icon: Ear,
    color: "bg-skill-listen-ink text-white",
    tint: "bg-skill-listen/10",
    items: [
      { name: "Listening comprehension", live: false },
      { name: "Tone and attitude", live: false },
    ],
  },
  {
    skill: "Speak",
    title: "Sound right",
    blurb: "Pronunciation, stress and intonation with instant feedback.",
    Icon: Mic,
    color: "bg-skill-speak text-ink",
    tint: "bg-skill-speak/15",
    items: [
      { name: "Pronunciation lab", live: false },
      { name: "Speeches and debates", live: false },
    ],
  },
];

const RANKS = [
  { name: "Apprentice", xp: "0 XP", icon: PenLine },
  { name: "Scribe", xp: "300 XP", icon: ScrollText },
  { name: "Wordsmith", xp: "1,000 XP", icon: Feather },
  { name: "Scholar", xp: "3,000 XP", icon: GraduationCap },
  { name: "Griot", xp: "10,000 XP", icon: Sparkles },
];

const FAQS = [
  {
    q: "Is Ngala free?",
    a: "Yes. Create an account and start practising for free. No card, no class code, no catch.",
  },
  {
    q: "Do I need a class code from a teacher?",
    a: "No. Any student can join from anywhere. If your teacher gave you a class code, add it when you sign up and you will join your class.",
  },
  {
    q: "Which curriculum does it follow?",
    a: "The CBC. Pick your grade (10, 11 or 12) when you sign up and your practice follows the senior school English syllabus.",
  },
  {
    q: "Will it work on my phone?",
    a: "Yes. Ngala runs in the browser on any phone, tablet or computer. Lessons are text and lightweight animation, not video, so they are easy on your data bundle.",
  },
  {
    q: "Who builds Ngala?",
    a: "A practising secondary school English teacher on the Kenyan coast. Every question is written the way exams actually ask it, with an explanation for every answer.",
  },
];

/* ------------------------------ page ------------------------------ */

const Landing = () => {
  const { user } = useAuth();
  const [active, setActive] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useReveal();

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % SKILLS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const primaryCta = user
    ? { to: user.role === "teacher" ? "/teacher" : "/dashboard", label: "Go to my dashboard" }
    : { to: "/register", label: "Start learning free" };

  return (
    <div className="min-h-screen overflow-x-hidden bg-sand text-ink">
      {/* ============================ NAV ============================ */}
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-sand/80 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Ngala home">
            <NgalaLogo animated />
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-ink/70 md:flex">
            <a href="#try" className="hover:text-ink">Try a lesson</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#paths" className="hover:text-ink">Paths</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {!user && (
              <Link to="/login" className="px-3 py-2 text-[15px] font-semibold text-ink/80 hover:text-ink">
                Log in
              </Link>
            )}
            <Link
              to={primaryCta.to}
              className="rounded-full bg-secondary px-5 py-2.5 text-[15px] font-bold text-ink shadow-[0_6px_16px_-6px_hsl(var(--secondary))] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              {user ? "Dashboard" : "Start free"}
            </Link>
          </div>
          <button className="rounded-lg p-2 md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-ink/5 bg-sand px-4 pb-5 pt-2 md:hidden">
            {[
              ["#try", "Try a lesson"],
              ["#how", "How it works"],
              ["#paths", "Paths"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block py-3 text-base font-semibold">
                {label}
              </a>
            ))}
            <div className="mt-3 flex gap-3">
              {!user && (
                <Link to="/login" className="flex-1 rounded-full border border-ink/15 py-3 text-center font-semibold">
                  Log in
                </Link>
              )}
              <Link to={primaryCta.to} className="flex-1 rounded-full bg-secondary py-3 text-center font-bold">
                {user ? "Dashboard" : "Start free"}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================ HERO ============================ */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute -right-32 top-40 h-[460px] w-[460px] rounded-full bg-skill-read/15 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.2fr_1fr] lg:pb-24">
          <div className="min-w-0">
            <div className="rise-in inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3.5 py-1.5 text-[13px] font-semibold text-ink/80 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Now open to every student, anywhere
            </div>

            <h1 className="font-display mt-6 text-[40px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-[54px] lg:text-[58px] xl:text-[64px]">
              {SKILLS.map((s, i) => {
                const on = i === active;
                const Icon = s.Icon;
                return (
                  <Fragment key={s.word}>
                    <span className="whitespace-nowrap">
                      <span
                        className={cn(
                          "-mx-1.5 inline-flex items-center gap-[0.12em] rounded-2xl px-1.5 transition-colors duration-500",
                          on ? cn(s.tint, s.text) : "text-ink",
                        )}
                      >
                        {s.word}
                        <Icon
                          className={cn(
                            "h-[0.5em] w-[0.5em] transition-all duration-500",
                            on ? "opacity-100" : "text-ink/25",
                          )}
                          strokeWidth={2.4}
                        />
                      </span>
                      {i < 2 ? "," : ""}
                    </span>
                    {i === 2 ? " and " : " "}
                  </Fragment>
                );
              })}
              <span>English with </span>
              <span className="relative inline-block">
                confidence.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden>
                  <path
                    className="draw-path"
                    d="M3 9 C 60 3, 120 3, 180 7 S 270 11, 297 5"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            <p className="rise-in mt-7 max-w-xl text-lg leading-relaxed text-ink/70" style={{ animationDelay: "150ms" }}>
              Ngala is an interactive English and Literature tutor for secondary students. Short lessons you play
              instead of read, instant feedback on every answer, and a streak that pulls you back tomorrow. Built for
              the CBC.
            </p>

            <div className="rise-in mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "250ms" }}>
              <Link
                to={primaryCta.to}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-7 py-4 text-base font-bold text-ink shadow-[0_10px_24px_-10px_hsl(var(--secondary))] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#try"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white/60 px-7 py-4 text-base font-bold text-ink transition hover:border-ink/30 hover:bg-white"
              >
                <Zap className="h-4 w-4 text-secondary" fill="currentColor" />
                Try a 60-second lesson
              </a>
            </div>

            <div className="rise-in mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink/65" style={{ animationDelay: "350ms" }}>
              {["No class code needed", "Works on any phone", "Free to start"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-skill-read-ink" strokeWidth={3} /> {t}
                </span>
              ))}
            </div>
          </div>

          <HeroCard />
        </div>
      </section>

      {/* ========================= PROOF STRIP ========================= */}
      <section className="border-y border-ink/5 bg-white/60">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-7 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
          {[
            { Icon: GraduationCap, t: "CBC aligned", s: "Senior school English" },
            { Icon: ScrollText, t: "Exam practice", s: "Timed, marked, explained" },
            { Icon: Feather, t: "Teacher-written", s: "By a practising English teacher" },
            { Icon: Smartphone, t: "Light on data", s: "No video, works on any phone" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="whitespace-nowrap font-bold leading-tight">{t}</div>
                <div className="text-sm text-ink/65">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================== TRY IT ========================== */}
      <section id="try" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div className="reveal">
            <Eyebrow>Learn by doing</Eyebrow>
            <h2 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Don't take our word for it. <span className="text-primary">Play one.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">
              Three quick cards: a grammar fix, a line of poetry and a word choice. This is how every Ngala lesson
              works. You try first, we explain second, and a wrong answer only means another go.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                ["bg-skill-write", "Grammar", "spot the error, see the rule"],
                ["bg-skill-lit", "Poetry", "tap the rhythm you can hear"],
                ["bg-skill-read", "Vocabulary", "feel the shade of a word"],
              ].map(([c, a, b]) => (
                <li key={a} className="flex items-center gap-3 text-[15px]">
                  <span className={cn("h-2.5 w-2.5 rounded-full", c)} />
                  <b>{a}</b>
                  <span className="text-ink/65">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal" style={{ transitionDelay: "120ms" }}>
            <LessonDemo />
          </div>
        </div>
      </section>

      {/* ======================== HOW IT WORKS ======================== */}
      <section id="how" className="scroll-mt-20 bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="reveal max-w-2xl">
            <Eyebrow dark>How a lesson works</Eyebrow>
            <h2 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Ten minutes. Ten small wins. One idea that sticks.
            </h2>
            <p className="mt-5 text-lg text-white/70">
              Watching a teacher explain feels clear. Doing it yourself is where learning happens. So every Ngala lesson
              is built as a short run of hands-on cards that get a little harder each time.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="reveal group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.07]"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className={cn("mb-10 flex h-12 w-12 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-ink", s.color)}>
                  {s.n}
                </div>
                <StepArt index={i} />
                <h3 className="font-display text-2xl font-bold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================== PATHS =========================== */}
      <section id="paths" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Learning paths</Eyebrow>
              <h2 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Four skills and a love of literature.
              </h2>
              <p className="mt-4 text-lg text-ink/70">
                Each path is a colour-coded trail of short lessons. Pick up where you left off on any device.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-skill-read-ink" /> Live now</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink/25" /> Coming soon</span>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PATHS.map((p, i) => (
              <div
                key={p.skill}
                className={cn(
                  "reveal lift-card relative overflow-hidden rounded-3xl border border-ink/5 bg-white p-6 shadow-card",
                  i === 2 && "lg:row-span-1",
                )}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", p.color)}>
                    <p.Icon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink/65">{p.skill}</span>
                </div>
                <h3 className="font-display mt-5 text-2xl font-bold">{p.title}</h3>
                <p className="mt-1.5 text-[15px] text-ink/65">{p.blurb}</p>
                {/* trail */}
                <ol className="relative mt-6 space-y-3 pl-1">
                  <span className={cn("absolute bottom-3 left-[13px] top-3 w-0.5 rounded-full opacity-25", p.color)} />
                  {p.items.map((it) => (
                    <li key={it.name} className="relative flex items-center gap-3">
                      <span
                        className={cn(
                          "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                          it.live ? p.color : "bg-ink/10",
                        )}
                      >
                        {it.live ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />}
                      </span>
                      <span className={cn("text-[15px]", it.live ? "font-semibold" : "text-ink/65")}>{it.name}</span>
                      {it.live && (
                        <span className="ml-auto rounded-full bg-skill-read/10 px-2 py-0.5 text-[11px] font-bold text-skill-read-ink">Live</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            {/* Exam room */}
            <div className="reveal relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-lift" style={{ transitionDelay: "350ms" }}>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/30 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-ink">
                    <Trophy className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">Exam room</span>
                </div>
                <h3 className="font-display mt-5 text-2xl font-bold">Past exam papers</h3>
                <p className="mt-1.5 text-[15px] text-white/75">
                  Real exam questions with marking guidance, so you know exactly where every mark comes from.
                </p>
                <span className="mt-6 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-bold text-ink">Live now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== MOTIVATION ========================== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="reveal order-2 lg:order-1">
            <RankLadder />
          </div>
          <div className="reveal order-1 lg:order-2">
            <Eyebrow>Stay motivated</Eyebrow>
            <h2 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              From Apprentice to Griot.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">
              Earn XP for every card you solve and keep a daily streak alive. Climb five ranks from Apprentice to
              Griot, named for the West African storytellers who carry a people's history in words. Then chase the
              top of the weekly leaderboard.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { Icon: Flame, t: "Daily streaks", c: "text-secondary" },
                { Icon: Sparkles, t: "XP and ranks", c: "text-primary" },
                { Icon: Trophy, t: "Weekly leaderboard", c: "text-skill-read" },
              ].map(({ Icon, t, c }) => (
                <div key={t} className="rounded-2xl border border-ink/5 bg-sand p-4 text-center">
                  <Icon className={cn("mx-auto h-6 w-6", c)} />
                  <div className="mt-2 text-sm font-bold leading-tight">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ STORY ============================ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:py-28">
          <div className="reveal flex justify-center">
            <SparkDiagram />
          </div>
          <div className="reveal">
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Born in a classroom on the coast. Built for everyone.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">
              Ngala started as a practice platform for one secondary school in Kilifi, where the motto on the crest
              reads <i className="font-literary not-italic text-ink">"Elimu ni mwanga"</i>: education is light. Students
              used it so much that keeping it inside one school felt wrong.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink/70">
              So the doors are open. The spark in our logo has four points, one for each skill: listening, speaking,
              reading and writing. It rises from an open book, because that is where the light comes from.
            </p>
          </div>
        </div>
      </section>

      {/* ============================= FAQ ============================= */}
      <section id="faq" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="reveal text-center">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="font-display mt-3 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Good to know</h2>
          </div>
          <div className="reveal mt-10 divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-sand/60">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-bold"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {f.q}
                    <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform duration-300", open && "rotate-180")} />
                  </button>
                  <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-[16px] leading-relaxed text-ink/70">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================== FINAL CTA ========================== */}
      <section className="px-4 py-20 sm:px-6">
        <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-primary px-6 py-16 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-skill-read/25 blur-3xl" />
          <NgalaMark className="float-slow relative mx-auto h-16 w-16" variant="inverse" animated />
          <h2 className="font-display relative mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Your first lesson takes five minutes.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-lg text-white/75">
            Join free from any school, any town, any phone. Your streak starts today.
          </p>
          <Link
            to={primaryCta.to}
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-4 text-base font-bold text-ink transition hover:-translate-y-0.5 hover:brightness-105"
          >
            {primaryCta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
          <div>
            <NgalaLogo />
            <p className="mt-3 text-sm text-ink/65">Elimu ni mwanga. Education is light.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink/65">
            <a href="#try" className="hover:text-ink">Try a lesson</a>
            <a href="#paths" className="hover:text-ink">Paths</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
            <Link to="/login" className="hover:text-ink">Log in</Link>
            <Link to="/register" className="hover:text-ink">Sign up</Link>
          </nav>
          <p className="text-sm text-ink/65">© {new Date().getFullYear()} Ngala English Hub</p>
        </div>
      </footer>
    </div>
  );
};

/* ------------------------------ pieces ------------------------------ */

const Eyebrow = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em]",
      dark ? "text-secondary" : "text-primary",
    )}
  >
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path d="M12 1C12.6 7.7 14.3 9.4 23 12C14.3 14.6 12.6 16.3 12 23C11.4 16.3 9.7 14.6 1 12C9.7 9.4 11.4 7.7 12 1Z" fill="hsl(var(--secondary))" />
    </svg>
    {children}
  </span>
);

const HeroCard = () => {
  const xp = useCountUp(2480);
  const streak = useCountUp(12, 1100);
  return (
    <div className="relative mx-auto w-full max-w-[460px] lg:mx-0 lg:justify-self-end">
      {/* floating chips */}
      <div className="float-slower absolute -right-6 bottom-[132px] z-20 hidden rounded-2xl border border-ink/5 bg-white px-3.5 py-2.5 shadow-lift sm:block">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-skill-read-ink text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          Subject-verb agreement
        </div>
      </div>
      <div className="float-slow absolute -right-3 -top-6 z-20 rounded-2xl bg-ink px-3.5 py-2.5 text-white shadow-lift">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-secondary" /> +15 XP
        </div>
      </div>
      <div className="float-slower absolute -bottom-7 left-8 z-20 hidden items-end gap-1 rounded-2xl border border-ink/5 bg-white px-4 py-3 shadow-lift sm:flex">
        {[0.4, 0.9, 0.55, 1, 0.5, 0.85, 0.45].map((h, i) => (
          <span
            key={i}
            className="wave-bar w-1.5 rounded-full bg-skill-listen"
            style={{ height: `${h * 26}px`, animationDelay: `${i * 0.12}s` }}
          />
        ))}
        <span className="ml-2 text-sm font-bold">da-DUM da-DUM</span>
      </div>

      <div className="rise-in">
      <div className="relative rotate-[2deg] rounded-[32px] border border-ink/5 bg-white p-6 shadow-[0_40px_80px_-40px_hsl(var(--primary)/0.55)] transition-transform duration-500 hover:rotate-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-ink/65">Habari, Amani</div>
            <div className="font-display mt-1 text-xl font-extrabold">Grade 10 · Term 2</div>
          </div>
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">Level 3 · Wordsmith</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-amber-soft p-4">
            <div className="text-xs font-semibold text-ink/65">Total XP</div>
            <div className="stat-num font-display mt-1 text-3xl">{xp.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-skill-read/10 p-4">
            <div className="text-xs font-semibold text-ink/65">Streak</div>
            <div className="stat-num font-display mt-1 flex items-center gap-1.5 text-3xl">
              <Flame className="h-6 w-6 text-secondary" fill="currentColor" /> {streak}d
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-ink/65">
            <span>Next rank: Scholar</span>
            <span>74%</span>
          </div>
          <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="xp-shimmer relative h-full w-[74%] rounded-full bg-secondary" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-primary p-4 text-white">
            <PenLine className="h-5 w-5 text-secondary" />
            <div className="mt-3 font-bold">Grammar drills</div>
            <div className="text-xs text-white/70">8 sets ready</div>
          </div>
          <div className="rounded-2xl bg-skill-read-ink p-4 text-white">
            <BookOpen className="h-5 w-5" />
            <div className="mt-3 font-bold">Reading</div>
            <div className="text-xs text-white/80">3 new passages</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const StepArt = ({ index }: { index: number }) => {
  // tiny looping illustrations for each step of a lesson
  if (index === 0)
    return (
      <div className="absolute right-5 top-6 flex gap-1.5" aria-hidden>
        {["?", "?", "?"].map((q, i) => (
          <span
            key={i}
            className="float-slow flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 font-display font-bold text-skill-listen"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            {q}
          </span>
        ))}
      </div>
    );
  if (index === 1)
    return (
      <div className="absolute right-5 top-7 flex gap-1.5" aria-hidden>
        {["was", "were"].map((w, i) => (
          <span
            key={w}
            className={cn(
              "float-slower rounded-lg px-2 py-1 text-xs font-bold",
              i === 1 ? "bg-skill-speak text-ink" : "bg-white/10 text-white/70 line-through",
            )}
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            {w}
          </span>
        ))}
      </div>
    );
  if (index === 2)
    return (
      <div className="absolute right-5 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-skill-write/20" aria-hidden>
        <span className="spark-twinkle font-display text-lg font-black text-skill-write">!</span>
      </div>
    );
  return (
    <div className="absolute right-5 top-7 flex items-end gap-1" aria-hidden>
      {[10, 18, 13, 24].map((h, i) => (
        <span key={i} className="wave-bar w-2 rounded-sm bg-skill-read/80" style={{ height: h, animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
};

const RankLadder = () => (
  <div className="relative rounded-[32px] border border-ink/5 bg-sand p-6 sm:p-8">
    <div className="mb-6 flex items-center justify-between">
      <div className="font-display text-xl font-extrabold">Your journey</div>
      <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-sm">
        <Flame className="h-4 w-4 text-secondary" fill="currentColor" /> 12 day streak
      </div>
    </div>
    <ol className="relative space-y-3">
      <span className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-ink/10" />
      {RANKS.map((r, i) => {
        const state = i < 2 ? "done" : i === 2 ? "current" : "locked";
        const Icon = r.icon;
        return (
          <li
            key={r.name}
            className={cn(
              "relative flex items-center gap-4 rounded-2xl p-2.5 pr-4",
              state === "current" && "bg-white shadow-card",
            )}
          >
            <span
              className={cn(
                "relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ring-4 ring-sand",
                state === "done" && "bg-primary text-white",
                state === "current" && "pulse-glow bg-secondary text-ink ring-white",
                state === "locked" && "bg-white text-ink/30",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.3} />
            </span>
            <div className="flex-1">
              <div className={cn("font-bold", state === "locked" && "text-ink/65")}>{r.name}</div>
              <div className="text-xs text-ink/65">{r.xp}</div>
            </div>
            {state === "done" && <Check className="h-5 w-5 text-skill-read-ink" strokeWidth={3} />}
            {state === "current" && <span className="text-xs font-bold text-primary">You are here</span>}
          </li>
        );
      })}
    </ol>
  </div>
);

const SparkDiagram = () => {
  // The logo's spark, enlarged: one point per skill, rising from the open book.
  const tips = [
    { t: "Listen", x: 50, y: 6, c: "bg-skill-listen-ink text-white", align: "-translate-x-1/2 -translate-y-full" },
    { t: "Speak", x: 86, y: 38, c: "bg-skill-speak text-ink", align: "-translate-y-1/2" },
    { t: "Write", x: 14, y: 38, c: "bg-skill-write-ink text-white", align: "-translate-x-full -translate-y-1/2" },
    { t: "Read", x: 50, y: 100, c: "bg-skill-read-ink text-white", align: "-translate-x-1/2" },
  ];
  return (
    <div className="relative mx-auto my-8 aspect-square w-[260px] sm:w-[300px]">
      <div className="absolute inset-6 rounded-full bg-secondary/25 blur-3xl" />
      <svg viewBox="0 0 100 100" className="relative h-full w-full overflow-visible" aria-hidden>
        <circle cx="50" cy="38" r="30" fill="none" stroke="hsl(var(--secondary))" strokeOpacity=".35" strokeDasharray="1.5 3" />
        <g className="spark-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <path d="M50 6C52.4 27 56 30.6 80 38C56 45.4 52.4 49 50 70C47.6 49 44 45.4 20 38C44 30.6 47.6 27 50 6Z" fill="#F4A932" />
        </g>
        <path d="M48.5 97C40 90.5 30 87.6 17 88.4V66.5C30 65.4 40 68.2 48.5 74.4Z" fill="#0B4F6C" />
        <path d="M51.5 97C60 90.5 70 87.6 83 88.4V66.5C70 65.4 60 68.2 51.5 74.4Z" fill="#3E7F99" />
      </svg>
      {tips.map((tip) => (
        <span
          key={tip.t}
          className={cn("absolute whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold shadow-lift", tip.c, tip.align)}
          style={{ left: `${tip.x}%`, top: `${tip.y}%`, marginTop: tip.t === "Read" ? 6 : tip.t === "Listen" ? -6 : 0, marginLeft: tip.t === "Speak" ? 8 : tip.t === "Write" ? -8 : 0 }}
        >
          {tip.t}
        </span>
      ))}
    </div>
  );
};

export default Landing;
