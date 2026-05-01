import { useEffect, useRef, useState } from "react";

interface Props {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export const CountUp = ({ end, duration = 800, suffix = "", decimals = 0 }: Props) => {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min((t - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <>{display}{suffix}</>;
};
