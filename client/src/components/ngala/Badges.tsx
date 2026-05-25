import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { api, Badge } from "@/lib/api";

// Full badge catalog — matches database seed
const ALL_BADGES = [
  { slug: 'first_answer',  title: 'First Step',       icon: '👣', description: 'Answered your first question' },
  { slug: 'streak_3',      title: 'On a Roll',         icon: '🔥', description: '3-day login streak' },
  { slug: 'streak_7',      title: 'Week Warrior',      icon: '🗓️', description: '7-day login streak' },
  { slug: 'streak_10',     title: 'Streak Master',     icon: '⚡', description: '10 correct in a row' },
  { slug: 'grammar_ninja', title: 'Grammar Ninja',     icon: '🥋', description: '100% on a grammar drill' },
  { slug: 'speed_reader',  title: 'Speed Reader',      icon: '💨', description: 'Comprehension under time' },
  { slug: 'exam_warrior',  title: 'Exam Warrior',      icon: '⚔️', description: 'Completed a full past paper' },
  { slug: 'vocab_25',      title: 'Word Collector',    icon: '📚', description: 'Learned 25 vocabulary words' },
  { slug: 'vocab_100',     title: 'Lexicon Builder',   icon: '📖', description: 'Learned 100 vocabulary words' },
  { slug: 'accuracy_80',   title: 'Sharp Mind',        icon: '🎯', description: '80% accuracy over 50 questions' },
  { slug: 'level_3',       title: 'Wordsmith',         icon: '🖊️', description: 'Reached Level 3' },
  { slug: 'level_5',       title: 'Griot',             icon: '🌍', description: 'Reached Level 5' },
  { slug: 'all_modules',   title: 'All-Rounder',       icon: '🏅', description: 'Tried all four modules' },
  { slug: 'night_owl',     title: 'Night Owl',         icon: '🦉', description: 'Studied after 8pm' },
  { slug: 'comeback_kid',  title: 'Comeback Kid',      icon: '💪', description: 'Retried and got it right' },
  { slug: 'grammar_first', title: 'Grammar Initiate',  icon: '⚔️', description: 'First grammar question' },
  { slug: 'reading_first', title: 'First Reader',      icon: '📖', description: 'First reading passage' },
  { slug: 'vocab_first',   title: 'Word Apprentice',   icon: '🔤', description: 'First vocabulary word' },
  { slug: 'papers_first',  title: 'Exam Entrant',      icon: '📜', description: 'First past paper attempted' },
  { slug: 'questions_10',  title: 'Getting Started',   icon: '🌱', description: 'Answered 10 questions' },
  { slug: 'questions_50',  title: 'Dedicated Learner', icon: '💪', description: 'Answered 50 questions' },
  { slug: 'questions_100', title: 'Century Scholar',   icon: '💯', description: 'Answered 100 questions' },
];

export const Badges = () => {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.misc.progress()
      .then(res => setEarnedBadges(res.badges))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const earnedSlugs = new Set(earnedBadges.map(b => b.slug));

  const earned = ALL_BADGES.filter(b => earnedSlugs.has(b.slug));
  const locked = ALL_BADGES.filter(b => !earnedSlugs.has(b.slug));

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-extrabold text-primary mb-4">Your Achievements</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="shrink-0 w-[170px] h-[120px] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-extrabold text-primary mb-4">
        Your Achievements
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {earned.length} / {ALL_BADGES.length} earned
        </span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {/* Earned badges first */}
        {earned.map(b => (
          <div key={b.slug} className="shrink-0 w-[170px] rounded-xl bg-card shadow-card p-4 text-center border border-border">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-3xl mb-3">
              {b.icon}
            </div>
            <div className="font-bold text-sm text-foreground">{b.title}</div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
              {earnedBadges.find(e => e.slug === b.slug)?.earned_at
                ? `Earned ${new Date(earnedBadges.find(e => e.slug === b.slug)!.earned_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}`
                : b.description}
            </div>
          </div>
        ))}

        {/* Locked badges */}
        {locked.map(b => (
          <div key={b.slug} className="shrink-0 w-[170px] rounded-xl bg-card shadow-card p-4 text-center border border-border opacity-45 relative">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl mb-3 grayscale">
              {b.icon}
            </div>
            <div className="font-bold text-sm text-foreground">{b.title}</div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{b.description}</div>
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/70 text-white flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
