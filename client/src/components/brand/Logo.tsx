import { cn } from "@/lib/utils";

/**
 * Ngala brand mark: a four-point spark (Listen, Speak, Read, Write)
 * rising from an open book. Echoes the founding school's motto,
 * "Elimu ni mwanga" (education is light).
 */
export const NgalaMark = ({
  className,
  variant = "default",
  animated = false,
}: {
  className?: string;
  variant?: "default" | "inverse";
  animated?: boolean;
}) => {
  const tile = variant === "inverse" ? "#FFFFFF" : "#0B4F6C";
  const pageA = variant === "inverse" ? "#0B4F6C" : "#FFFFFF";
  const pageB = variant === "inverse" ? "#3E7F99" : "#DCEBF0";
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Ngala">
      <rect width="64" height="64" rx="18" fill={tile} />
      <g transform="translate(0 3.5)">
        <path d="M31 50.5C25.6 46.4 19 44.6 11 45.2V29.4C19 28.7 25.6 30.4 31 34.4Z" fill={pageA} />
        <path d="M33 50.5C38.4 46.4 45 44.6 53 45.2V29.4C45 28.7 38.4 30.4 33 34.4Z" fill={pageB} />
        <path
          className={cn(animated && "spark-twinkle")}
          style={{ transformBox: "fill-box" }}
          d="M32 6.5C33.3 15.6 35.4 17.7 44.5 19C35.4 20.3 33.3 22.4 32 31.5C30.7 22.4 28.6 20.3 19.5 19C28.6 17.7 30.7 15.6 32 6.5Z"
          fill="#F4A932"
        />
      </g>
    </svg>
  );
};

export const NgalaLogo = ({
  className,
  variant = "default",
  animated = false,
}: {
  className?: string;
  variant?: "default" | "inverse";
  animated?: boolean;
}) => (
  <span className={cn("inline-flex items-center gap-2.5", className)}>
    <NgalaMark className="h-10 w-10 shrink-0" variant={variant} animated={animated} />
    <span className="flex flex-col leading-none">
      <span
        className={cn(
          "font-display text-[26px] font-extrabold tracking-[-0.02em]",
          variant === "inverse" ? "text-white" : "text-ink",
        )}
      >
        ngala
      </span>
      <span
        className={cn(
          "mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em]",
          variant === "inverse" ? "text-secondary" : "text-primary",
        )}
      >
        English Hub
      </span>
    </span>
  </span>
);

export default NgalaLogo;
