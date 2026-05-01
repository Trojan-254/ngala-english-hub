const items = [
  { topic: "Tenses — Simple Past", acc: 42 },
  { topic: "Subject–Verb Concord", acc: 51 },
  { topic: "Articles (a / an / the)", acc: 58 },
];

export const WeakAreas = () => {
  return (
    <section className="sweep-in rounded-2xl bg-amber-soft border-l-4 border-secondary p-6 shadow-card">
      <h3 className="font-extrabold text-foreground flex items-center gap-2">
        <span>⚠️</span> Areas to Focus On
      </h3>
      <p className="text-xs text-muted-foreground mt-1">These topics are slowing your XP — fix them and watch your accuracy climb.</p>

      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li
            key={i.topic}
            className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border/60"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{i.topic}</span>
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                {i.acc}% accuracy
              </span>
            </div>
            <a href="#" className="text-sm font-bold text-primary hover:text-primary-light transition">
              Practice Now →
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};
