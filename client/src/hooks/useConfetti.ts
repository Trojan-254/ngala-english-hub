import confetti from 'canvas-confetti';

export function useConfetti() {
  const fire = (options?: confetti.Options) => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#0B4F6C', '#F4A932', '#1A9E5C', '#5C3D8F'],
      ...options,
    });
  };

  const fireBadge = () => {
    // Two bursts for badge achievement
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#F4A932', '#FFD700'],
    });
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#F4A932', '#FFD700'],
    });
  };

  const fireSession = (accuracy: number) => {
    if (accuracy >= 80) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#0B4F6C', '#F4A932', '#1A9E5C'],
      });
    } else if (accuracy >= 60) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  return { fire, fireBadge, fireSession };
}
