import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { teacherApi, Student, ClassGroupInfo } from "@/lib/teacherApi";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle, initialsOf, relativeTime, accuracyColor, levelName, moduleLabel } from "@/components/teacher/tokens";
import { SkeletonBlock, ErrorState, EmptyState } from "@/components/teacher/StatusViews";
const PAGE_SIZE = 20;
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [groups, setGroups] = useState<ClassGroupInfo[]>([]);
  const [classFilter, setClassFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const load = (cg?: string) => {
    setLoading(true);
    setError(null);
    teacherApi.students(cg)
      .then((r) => setStudents(r.students))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    teacherApi.classGroups().then((r) => setGroups(r.class_groups)).catch(() => setGroups([]));
  }, []);
  useEffect(() => {
    load(classFilter || undefined);
    setPage(1);
  }, [classFilter]);
  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) =>
      s.display_name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)
    );
  }, [students, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const toggleActive = async (s: Student) => {
    try {
      if (s.is_active) await teacherApi.deactivateStudent(s.id);
      else await teacherApi.activateStudent(s.id);
      toast.success(s.is_active ? "Student deactivated" : "Student activated");
      load(classFilter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
    setMenuFor(null);
  };
  const saveNote = async (s: Student) => {
    if (!noteText.trim()) return;
    try {
      await teacherApi.addStudentNote(s.id, noteText.trim());
      toast.success("Note saved");
      setNoteText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save note");
    }
  };
  return (
    <TeacherShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: 0 }}>Students</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, width: 240, fontFamily: "inherit", outline: "none" }}
          />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
            <option value="">All Classes</option>
            {groups.map((g) => <option key={g.class_group} value={g.class_group}>{g.class_group}</option>)}
          </select>
        </div>
      </div>
      {error ? <ErrorState message={error} onRetry={() => load(classFilter || undefined)} /> :
        loading ? <SkeletonBlock height={400} /> :
        filtered.length === 0 ? (
          <EmptyState
            title="No students registered yet"
            description="Share a class code to get started."
            action={<Link to="/teacher/codes" style={{ padding: "10px 16px", background: T.primary, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Create Class Code →</Link>}
          />
        ) : (
          <>
            <div style={{ ...cardStyle, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.bg, color: T.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {["", "Student", "Class", "Curriculum", "Level", "XP", "Accuracy", "Last Active", "Status", ""].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((s, idx) => {
                    const isOpen = expanded === s.id;
                    const rowBg = idx % 2 === 1 ? "rgba(0,0,0,0.02)" : "#fff";
                    return (
                      <Fragment key={s.id}>
                        <tr
                          onClick={() => setExpanded(isOpen ? null : s.id)}
                          style={{ background: rowBg, cursor: "pointer", borderTop: `1px solid ${T.border}` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryLight)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                        >
                          <td style={{ padding: "10px 12px", width: 28 }}>
                            {isOpen ? <ChevronDown size={14} color={T.textSecondary} /> : <ChevronRight size={14} color={T.textSecondary} />}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 999, background: T.primaryLight, color: T.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {initialsOf(s.display_name || s.username)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: T.textPrimary }}>{s.display_name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>@{s.username}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", color: T.textSecondary }}>{s.class_group ?? "—"}</td>
                          <td style={{ padding: "10px 12px" }}>
                            {s.curriculum ? (
                              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.curriculum === "CBE" ? T.purpleLight : T.goldLight, color: s.curriculum === "CBE" ? T.purple : T.gold }}>{s.curriculum}</span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: T.primaryLight, color: T.primary }}>
                              L{s.level} {levelName(s.level)}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: T.textPrimary }}>{s.xp_total.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: s.overall_accuracy != null ? accuracyColor(s.overall_accuracy) : T.textMuted }}>
                            {s.overall_accuracy != null ? `${s.overall_accuracy}%` : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", color: s.last_login_at ? T.textSecondary : T.red, fontSize: 12 }}>
                            {relativeTime(s.last_login_at)}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: s.is_active ? T.greenLight : T.redLight, color: s.is_active ? T.green : T.red }}>
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setMenuFor(menuFor === s.id ? null : s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, padding: 4 }}>
                              <MoreVertical size={16} />
                            </button>
                            {menuFor === s.id && (
                              <div style={{ position: "absolute", right: 8, top: 36, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: T.shadow, zIndex: 20, minWidth: 140 }}>
                                <button onClick={() => toggleActive(s)} style={menuItem}>{s.is_active ? "Deactivate" : "Activate"}</button>
                                <button onClick={() => { setExpanded(s.id); setMenuFor(null); }} style={menuItem}>Add Note</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr style={{ background: T.bg }}>
                            <td colSpan={10} style={{ padding: 20 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Module Performance</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {["grammar", "comprehension", "pastpapers", "vocabulary"].map((slug) => {
                                      const m = s.modules?.[slug];
                                      const pct = m?.accuracy ?? 0;
                                      return (
                                        <div key={slug} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", gap: 12, alignItems: "center" }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{moduleLabel(slug)}</div>
                                          <div style={{ height: 6, background: "#fff", borderRadius: 999, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: m ? accuracyColor(pct) : T.border }} />
                                          </div>
                                          <div style={{ fontSize: 11, color: T.textMuted, textAlign: "right" }}>{m ? `${m.attempts} · ${pct}%` : "—"}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Add Note</div>
                                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} style={{ width: "100%", padding: 10, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} placeholder="Teacher note..." />
                                  <button onClick={() => saveNote(s)} style={{ marginTop: 8, padding: "8px 14px", background: T.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save Note</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, color: T.textSecondary, fontSize: 13 }}>
              <div>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pagerBtn(page === 1)}>Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pagerBtn(page === totalPages)}>Next</button>
              </div>
            </div>
          </>
        )}
    </TeacherShell>
  );
}
const menuItem: React.CSSProperties = {
  display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
  background: "none", border: "none", fontSize: 12, color: T.textPrimary,
  cursor: "pointer", fontFamily: "inherit",
};
const pagerBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "6px 14px", border: `1px solid ${T.border}`, background: "#fff",
  borderRadius: 6, fontSize: 12, fontWeight: 600, color: T.textPrimary,
  cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
  fontFamily: "inherit",
});
