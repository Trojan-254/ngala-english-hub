import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, TrendingDown, Key, Trophy, LogOut, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { T, initialsOf } from "./tokens";
const nav = [
  { to: "/teacher", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/teacher/students", icon: Users, label: "Students" },
  { to: "/teacher/weak-topics", icon: TrendingDown, label: "Weak Topics" },
  { to: "/teacher/content", icon: BookOpen, label: "Content" },
  { to: "/teacher/codes", icon: Key, label: "Class Codes" },
  { to: "/teacher/leaderboard", icon: Trophy, label: "Leaderboard" },
];
export default function TeacherSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  const currentYear = new Date().getFullYear();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 220,
        height: "100vh",
        background: T.primary,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        zIndex: 30,
      }}
    >
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: -0.3 }}>Ngala</div>
        <div style={{ color: T.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
          Teacher Portal
        </div>
      </div>
      {user && (
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 999, background: T.gold,
                color: T.primary, fontWeight: 800, fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              {initialsOf(user.display_name || user.username)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.display_name || user.username}
              </div>
              <div style={{ display: "inline-block", marginTop: 2, padding: "1px 8px", background: "rgba(244,169,50,0.18)", color: T.gold, fontSize: 10, fontWeight: 700, borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Teacher
              </div>
            </div>
          </div>
        </div>
      )}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px",
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              color: "#fff", textDecoration: "none",
              borderRadius: 6,
              borderLeft: `3px solid ${isActive ? T.gold : "transparent"}`,
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              transition: "background 120ms ease",
            })}
          >
            <Icon size={16} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        style={{
          margin: "8px 12px 20px",
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 6,
          background: "transparent", color: "#fff",
          border: "1px solid rgba(255,255,255,0.15)",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <LogOut size={16} />
        Logout
      </button>

      <div className="px-6 py-5 text-[11px] text-white/40">
        Powered by Katana Ngala Senior School @{currentYear}
      </div>
    </aside>
  );
}
