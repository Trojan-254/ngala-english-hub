import { Check, Crown } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { api, VocabWord } from "@/lib/api";
import { Badges } from "./Badges";

interface StreakDay {
  label: string;
  date: string;
  done: boolean;
  today: boolean;
  future: boolean;
}

interface LeaderEntry {
  rank: number;
  name: string;
  xp: number;
  init: string;
  me: boolean;
}

const rankColor = (r: number) =>
  r === 1 ? "text-secondary"
  : r === 2 ? "text-muted-foreground"
  : r === 3 ? "text-warm-orange"
  : "text-foreground";

// Helper to get current week days starting from Monday
const getCurrentWeekDays = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Adjust to make Monday the first day of week
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDays.push({
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toISOString().split('T')[0],
      isToday: date.toDateString() === today.toDateString(),
    });
  }
  return weekDays;
};

export const RightSidebar = () => {
  const { leaderboard: socketLeaderboard } = useSocket();
  const { user } = useAuth();

  const [streakDays, setStreakDays] = useState<StreakDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [wordOfDay, setWordOfDay] = useState<VocabWord | null>(null);
  const [restLeaderboard, setRestLeaderboard] = useState<LeaderEntry[]>([]);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToList = async () => {
    if (!wordOfDay || adding || added) return;
    setAdding(true);
    try {
      await api.misc.addToWordList(wordOfDay.id);
      setAdded(true);
    } catch (e) {
      // Already in list — still show as added
      setAdded(true);
    } finally {
      setAdding(false);
    }
  };

  // Fetch streak, word of day, and initial leaderboard on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streakRes, wordRes, leaderboardRes] = await Promise.all([
          api.misc.streak(),
          api.misc.wordOfDay(),
          api.misc.weeklyLeaderboard()
        ]);
        
        // Get current week days
        const currentWeek = getCurrentWeekDays();
        
        // Map backend streak days to current week days
        const mappedStreakDays = currentWeek.map(weekDay => {
          // Find if there's a streak day entry for this date
          const streakEntry = streakRes.days.find(
            (day: StreakDay) => day.date === weekDay.date
          );
          
          return {
            label: weekDay.label,
            date: weekDay.date,
            done: streakEntry?.done || false,
            today: weekDay.isToday,
            future: new Date(weekDay.date) > new Date()
          };
        });
        
        setStreakDays(mappedStreakDays);
        setStreak(streakRes.streak);
        setWordOfDay(wordRes.word);
        
        const entries = leaderboardRes.leaderboard.slice(0, 5).map((l, i) => ({
          rank: i + 1,
          name: l.display_name,
          xp: l.weekly_xp,
          init: l.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join(''),
          me: l.display_name === user?.display_name
        }));
        setRestLeaderboard(entries);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [user]);

  // Socket leaderboard overrides REST once live data arrives
  const leaders: LeaderEntry[] = socketLeaderboard.length > 0
    ? socketLeaderboard.slice(0, 5).map((l, i) => ({
        rank: i + 1,
        name: l.display_name,
        xp: l.weekly_xp,
        init: l.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join(''),
        me: l.display_name === user?.display_name
      }))
    : restLeaderboard;

  return (
    <aside className="hidden lg:block w-[300px] shrink-0 space-y-5">

      {/* Streak calendar */}
      <div className="bg-card rounded-2xl shadow-card p-5">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          This Week
        </div>
        <div className="mt-3 flex justify-between">
          {streakDays.length > 0 ? streakDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={[
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                day.done 
                  ? "bg-success text-success-foreground" 
                  : "bg-muted text-muted-foreground",
                day.today && !day.done ? "ring-2 ring-secondary ring-offset-2 ring-offset-card" : "",
                day.today && day.done ? "ring-2 ring-secondary ring-offset-2 ring-offset-card" : "",
              ].join(" ")}>
                {day.done ? <Check className="w-4 h-4" strokeWidth={3} /> : day.label}
              </div>
              {/* <div className="text-[11px] font-semibold text-muted-foreground">
                {day.label}
              </div> */}
            </div>
          )) : (
            // Skeleton while loading
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                <div className="w-3 h-2 bg-muted rounded animate-pulse" />
              </div>
            ))
          )}
        </div>
        <div className="mt-4 text-sm font-extrabold text-foreground">
          {streak > 0
            ? `${streak}-day streak! Keep it going!`
            : streak === 0 && streakDays.length > 0
            ? "Answer a question to start your streak!"
            : "Loading streak..."}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-card rounded-2xl shadow-card p-5">
        <h3 className="font-extrabold text-foreground">This Week's Leaders</h3>
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
                  l.me
                    ? "bg-secondary/10 border-secondary"
                    : "border-transparent hover:bg-muted/60",
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
                    {l.name}
                    {l.me && <span className="ml-1 text-[10px] text-secondary font-bold">YOU</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {l.xp.toLocaleString()} XP
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-[11px] text-muted-foreground">
          Resets Monday
        </div>
      </div>

      {/* Word of the Day */}
      <div className="rounded-2xl shadow-card p-6 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="text-[11px] font-bold tracking-[0.2em] text-secondary uppercase">
          Word of the Day
        </div>

        {wordOfDay ? (
          <>
            <div className="stat-num text-4xl mt-2 capitalize">{wordOfDay.word}</div>
            <div className="text-xs italic text-white/70 mt-1">{wordOfDay.part_of_speech}</div>
            <div className="text-sm mt-3 text-white/90">{wordOfDay.definition}</div>
            <div className="text-xs mt-3 text-white/70 italic border-l-2 border-secondary pl-3">
              "{wordOfDay.example_sentence}"
            </div>
            {wordOfDay.synonym && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <span className="text-[11px] bg-white/10 px-2 py-1 rounded-full">
                  Syn: {wordOfDay.synonym.split(',')[0].trim()}
                </span>
                {wordOfDay.antonym && (
                  <span className="text-[11px] bg-white/10 px-2 py-1 rounded-full">
                    Ant: {wordOfDay.antonym.split(',')[0].trim()}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="h-8 bg-white/10 rounded animate-pulse w-40" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
            <div className="h-4 bg-white/10 rounded animate-pulse" />
          </div>
        )}

        <button
           onClick={handleAddToList}
           disabled={adding || added}
           className="mt-5 w-full py-2.5 rounded-lg bg-white text-primary text-sm font-bold hover:bg-secondary hover:text-primary transition disabled:opacity-60">
          {added ? 'Added to My List ✓' : adding ? 'Adding...' : 'Add to My List →'}
        </button>
      </div>
      {/* Achievements */}
      <Badges compact />
    </aside>
  );
};