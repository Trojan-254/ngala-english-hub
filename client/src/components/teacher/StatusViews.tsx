import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { T, cardStyle } from "./tokens";
export function SkeletonBlock({ height = 80, width = "100%", style }: { height?: number | string; width?: number | string; style?: React.CSSProperties }) {
  return (
    <div
      className="animate-pulse"
      style={{ height, width, background: "#E5EAF0", borderRadius: 8, ...style }}
    />
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ ...cardStyle, borderColor: T.red, borderLeft: `4px solid ${T.red}`, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <AlertCircle size={28} color={T.red} />
      <div style={{ fontWeight: 600, color: T.textPrimary }}>Something went wrong</div>
      <div style={{ color: T.textSecondary, fontSize: 13, textAlign: "center" }}>{message}</div>
      <button
        onClick={onRetry}
        style={{
          marginTop: 4, padding: "8px 16px", background: T.primary, color: "#fff",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div style={{ ...cardStyle, padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{title}</div>
      <div style={{ marginTop: 8, color: T.textSecondary, fontSize: 13, maxWidth: 440, margin: "8px auto 0" }}>
        {description}
      </div>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
