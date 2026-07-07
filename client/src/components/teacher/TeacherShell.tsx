import { ReactNode } from "react";
import TeacherSidebar from "./TeacherSidebar";
import { T } from "./tokens";
export default function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, sans-serif", color: T.textPrimary }}>
      <TeacherSidebar />
      <main className="lg:ml-[220px] pt-20 pb-16 px-4 lg:pt-8 lg:px-9" style={{ maxWidth: 1400 }}>
        {children}
      </main>
    </div>
  );
}
