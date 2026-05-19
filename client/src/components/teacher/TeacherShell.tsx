import { ReactNode } from "react";
import TeacherSidebar from "./TeacherSidebar";
import { T } from "./tokens";
export default function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, sans-serif", color: T.textPrimary }}>
      <TeacherSidebar />
      <main style={{ marginLeft: 220, padding: "32px 36px 60px", maxWidth: 1400 }}>
        {children}
      </main>
    </div>
  );
}
