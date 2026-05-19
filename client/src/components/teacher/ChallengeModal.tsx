import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { teacherApi, ClassGroupInfo } from "@/lib/teacherApi";
import { T, moduleLabel } from "./tokens";
export interface ChallengePrefill {
  module_slug: string;
  topic_id?: number;
  topic_label?: string;
}
interface Props {
  open: boolean;
  onClose: () => void;
  prefill: ChallengePrefill | null;
}
export default function ChallengeModal({ open, onClose, prefill }: Props) {
  const [title, setTitle] = useState("");
  const [classGroup, setClassGroup] = useState<string>("");
  const [groups, setGroups] = useState<ClassGroupInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTitle(prefill?.topic_label ? `Drill: ${prefill.topic_label}` : "Class Challenge");
    setClassGroup("");
    teacherApi.classGroups().then((r) => setGroups(r.class_groups)).catch(() => setGroups([]));
  }, [open, prefill]);
  if (!open || !prefill) return null;
  const submit = async () => {
    setSubmitting(true);
    try {
      await teacherApi.triggerChallenge({
        module_slug: prefill.module_slug,
        topic_id: prefill.topic_id,
        title,
        class_group: classGroup || undefined,
      });
      toast.success(`Challenge sent to ${classGroup || "all students"}`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send challenge");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: 440, maxWidth: "90vw",
          padding: 24, boxShadow: T.shadow,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>Trigger Class Challenge</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary }}>
            <X size={18} />
          </button>
        </div>
        <Field label="Module">
          <div style={{ padding: "10px 12px", background: T.primaryLight, color: T.primary, borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
            {moduleLabel(prefill.module_slug)}
          </div>
        </Field>
        {prefill.topic_label && (
          <Field label="Topic">
            <div style={{ padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.textPrimary }}>
              {prefill.topic_label}
            </div>
          </Field>
        )}
        <Field label="Challenge Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Class Group (optional)">
          <select value={classGroup} onChange={(e) => setClassGroup(e.target.value)} style={inputStyle}>
            <option value="">All classes</option>
            {groups.map((g) => (
              <option key={g.class_group} value={g.class_group}>{g.class_group}</option>
            ))}
          </select>
        </Field>
        <button
          onClick={submit}
          disabled={submitting || !title}
          style={{
            marginTop: 16, width: "100%", padding: "12px 16px",
            background: T.primary, color: "#fff", border: "none", borderRadius: 8,
            fontWeight: 600, fontSize: 14, cursor: submitting ? "wait" : "pointer",
            opacity: submitting || !title ? 0.6 : 1, fontFamily: "inherit",
          }}
        >
          Send to All Students →
        </button>
      </div>
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: T.textPrimary,
  background: "#fff", outline: "none",
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
