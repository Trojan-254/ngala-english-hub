import { useEffect, useState } from 'react';
import { useConfetti } from '@/hooks/useConfetti';

interface Badge {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

interface Props {
  badges: Badge[];
  onDismiss: () => void;
}

export function BadgeNotification({ badges, onDismiss }: Props) {
  const { fireBadge } = useConfetti();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (badges.length === 0) return;
    setVisible(true);
    fireBadge();
  }, [badges]);

  const handleNext = () => {
    if (current + 1 < badges.length) {
      setCurrent(current + 1);
      fireBadge();
    } else {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }
  };

  if (!visible || badges.length === 0) return null;

  const badge = badges[current];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 animate-fade-in"
      onClick={handleNext}
    >
      <div
        className="bg-card rounded-2xl border-2 border-secondary p-10 text-center max-w-sm w-full"
        style={{ boxShadow: '0 4px 24px rgba(244,169,50,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{badge.icon}</div>
        <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
          Achievement Unlocked
        </div>
        <div className="text-2xl font-extrabold text-foreground">{badge.title}</div>
        <div className="text-sm text-muted-foreground mt-2">{badge.description}</div>
        {badges.length > 1 && (
          <div className="text-xs text-muted-foreground mt-4">
            {current + 1} of {badges.length} new badges
          </div>
        )}
        <button
          onClick={handleNext}
          className="mt-6 w-full py-3 rounded-lg bg-secondary text-primary font-bold text-sm hover:brightness-105 transition"
        >
          {current + 1 < badges.length ? 'Next Badge →' : 'Claim Rewards →'}
        </button>
      </div>
    </div>
  );
}
