import { FormEvent, useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { teacherApi, ClassCode } from "@/lib/teacherApi";
import TeacherShell from "@/components/teacher/TeacherShell";
import { T, cardStyle } from "@/components/teacher/tokens";
import { SkeletonBlock, ErrorState, EmptyState } from "@/components/teacher/StatusViews";
export default function CodesPage() {
  const [codes, setCodes] = useState<ClassCode[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [curriculum, setCurriculum] = useState<"8-4-4" | "CBE">("CBE");
  const [expiresDays, setExpiresDays] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const load = () => {
    setLoading(true); setError(null);
    teacherApi.getCodes()
      .then((r) => setCodes(r.codes))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await teacherApi.createCode({ code: code.toUpperCase(), class_group: classGroup, curriculum, expires_days: expiresDays });
      toast.success("Class code created");
      setCode(""); setClassGroup(""); setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setSubmitting(false);
    }
  };
  const copy = async (c: ClassCode) => {
    await navigator.clipboard.writeText(c.code);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId((cur) => (cur === c.id ? null : cur)), 2000);
  };
  const remove = async (id: number) => {
    try {
      await teacherApi.deleteCode(id);
      toast.success("Code deactivated");
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to deactivate");
    }
  };
  return (
    <TeacherShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: T.textPrimary }}>Class Codes</h1>
        <button onClick={() => setShowForm((v) => !v)} style={{ padding: "10px 16px", background: T.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {showForm ? "Cancel" : "Create New Code +"}
        </button>
      </div>
      <div
        style={{
          maxHeight: showForm ? 360 : 0,
          opacity: showForm ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 250ms ease, opacity 200ms ease, margin 200ms ease",
          marginBottom: showForm ? 20 : 0,
        }}
      >
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end" style={{ ...cardStyle, padding: 20 }}>
          <Field label="Code"><input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 10))} placeholder="e.g. F3L-2026" style={inputStyle} /></Field>
          <Field label="Class Group"><input required value={classGroup} onChange={(e) => setClassGroup(e.target.value)} placeholder="e.g. Form 3L" style={inputStyle} /></Field>
          <Field label="Curriculum">
            <select value={curriculum} onChange={(e) => setCurriculum(e.target.value as "8-4-4" | "CBE")} style={inputStyle}>
              <option value="CBE">CBE</option>
              <option value="8-4-4">8-4-4</option>
            </select>
          </Field>
          <Field label="Expires In">
            <select value={expiresDays} onChange={(e) => setExpiresDays(Number(e.target.value))} style={inputStyle}>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>End of term (180 days)</option>
            </select>
          </Field>
          <button type="submit" disabled={submitting} style={{ padding: "10px 16px", background: T.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? "wait" : "pointer", fontFamily: "inherit", height: 40 }}>
            Create →
          </button>
        </form>
      </div>
      {error ? <ErrorState message={error} onRetry={load} /> :
       loading ? <SkeletonBlock height={300} /> :
       !codes || codes.length === 0 ? (
         <EmptyState title="No codes yet" description="Create your first class code to let students register." />
       ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {codes.map((c) => {
            const expiresAt = new Date(c.expires_at);
            const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
            const expiringSoon = daysLeft <= 7 && daysLeft >= 0;
            return (
              <div key={c.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] items-center gap-4" style={{ ...cardStyle, padding: 20 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.primary, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: 1 }}>{c.code}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{c.class_group} · {c.curriculum}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: T.textSecondary }}>{c.students_registered} student{c.students_registered === 1 ? "" : "s"} joined</div>
                  <div style={{ fontSize: 12, color: expiringSoon ? T.gold : T.textMuted, marginTop: 4, fontWeight: expiringSoon ? 600 : 400 }}>
                    Expires {expiresAt.toLocaleDateString()}{expiringSoon ? " · Expires soon" : ""}
                  </div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.is_active ? T.greenLight : T.redLight, color: c.is_active ? T.green : T.red }}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => copy(c)} style={iconBtn}>
                    {copiedId === c.id ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                  </button>
                  {confirmDelete === c.id ? (
                    <>
                      <button onClick={() => remove(c.id)} style={{ ...iconBtn, borderColor: T.red, color: T.red }}>Confirm?</button>
                      <button onClick={() => setConfirmDelete(null)} style={iconBtn}>No</button>
                    </>
                  ) : (
                    c.is_active ? <button onClick={() => setConfirmDelete(c.id)} style={iconBtn}>Deactivate</button> : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
       )}
    </TeacherShell>
  );
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: T.textPrimary,
  background: "#fff", outline: "none", boxSizing: "border-box", height: 40,
};
const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 12px", border: `1px solid ${T.border}`, background: "#fff",
  borderRadius: 6, fontSize: 12, fontWeight: 600, color: T.textPrimary,
  cursor: "pointer", fontFamily: "inherit",
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
