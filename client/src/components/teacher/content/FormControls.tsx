import { CheckSquare, FileText, PenLine } from "lucide-react";
import { T } from "../tokens";
import { QuestionType, Difficulty, Curriculum } from "@/lib/contentApi";
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  color: T.textPrimary,
  background: T.surface,
  outline: "none",
  boxSizing: "border-box",
};
export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: T.textPrimary,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
export const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: T.textMuted,
  marginTop: 4,
};
export function PrimaryButton({ children, onClick, type = "button", disabled }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: T.primary, color: "#fff", border: "none",
        padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        fontFamily: "inherit",
      }}
    >{children}</button>
  );
}
export function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent", color: T.textPrimary,
        border: `1px solid ${T.border}`, padding: "10px 16px",
        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit",
      }}
    >{children}</button>
  );
}
export function QuestionTypeSelector({ value, onChange }: { value: QuestionType; onChange: (v: QuestionType) => void }) {
  const types: { v: QuestionType; label: string; desc: string; Icon: typeof CheckSquare }[] = [
    { v: "mcq", label: "Multiple Choice (MCQ)", desc: "Auto-marked instantly.", Icon: CheckSquare },
    { v: "short_answer", label: "Short Answer", desc: "1-3 sentences. Teacher marks.", Icon: PenLine },
    { v: "essay", label: "Essay / Long Answer", desc: "Paragraph response. Teacher marks.", Icon: FileText },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {types.map(({ v, label, desc, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              textAlign: "left", padding: 14, borderRadius: 10, cursor: "pointer",
              border: `1px solid ${active ? T.primary : T.border}`,
              background: active ? T.primaryLight : T.surface,
              fontFamily: "inherit",
            }}
          >
            <Icon size={18} color={active ? T.primary : T.textSecondary} />
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8, color: T.textPrimary }}>{label}</div>
            <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>{desc}</div>
          </button>
        );
      })}
    </div>
  );
}
export function DifficultySelector({ value, onChange }: { value: Difficulty; onChange: (v: Difficulty) => void }) {
  const items: { v: Difficulty; label: string; color: string; bg: string }[] = [
    { v: 1, label: "Easy", color: T.green, bg: T.greenLight },
    { v: 2, label: "Medium", color: T.gold, bg: T.goldLight },
    { v: 3, label: "Hard", color: T.red, bg: T.redLight },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map(({ v, label, color, bg }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${active ? color : T.border}`,
              background: active ? bg : T.surface,
              color: active ? color : T.textSecondary,
              fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >{label}</button>
        );
      })}
    </div>
  );
}
export function CurriculumSelector({ value, onChange }: { value: Curriculum; onChange: (v: Curriculum) => void }) {
  const items: { v: Curriculum; label: string }[] = [
    { v: "both", label: "Both" },
    { v: "844", label: "8-4-4" },
    { v: "CBE", label: "CBE" },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map(({ v, label }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${active ? T.primary : T.border}`,
              background: active ? T.primaryLight : T.surface,
              color: active ? T.primary : T.textSecondary,
              fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >{label}</button>
        );
      })}
    </div>
  );
}
export interface MCQFields {
  options: string[];
  correct_answer: string;
  explanation: string;
  xp_reward: number;
}
export function MCQForm({ value, onChange }: { value: MCQFields; onChange: (v: MCQFields) => void }) {
  const letters = ["A", "B", "C", "D"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {letters.map((l, i) => (
        <div key={l}>
          <label style={labelStyle}>Option {l}</label>
          <input
            style={inputStyle}
            value={value.options[i] ?? ""}
            onChange={(e) => {
              const next = [...value.options];
              next[i] = e.target.value;
              onChange({ ...value, options: next });
            }}
            required
          />
        </div>
      ))}
      <div>
        <label style={labelStyle}>Correct Answer</label>
        <select
          style={inputStyle}
          value={value.correct_answer}
          onChange={(e) => onChange({ ...value, correct_answer: e.target.value })}
          required
        >
          <option value="">Select correct option</option>
          {letters.map((l) => <option key={l} value={l}>Option {l}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Explanation — shown to students after answering</label>
        <textarea
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          value={value.explanation}
          onChange={(e) => onChange({ ...value, explanation: e.target.value })}
          required
        />
      </div>
      <div>
        <label style={labelStyle}>XP Reward</label>
        <input
          type="number"
          style={inputStyle}
          value={value.xp_reward}
          onChange={(e) => onChange({ ...value, xp_reward: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
export interface OpenFields {
  model_answer: string;
  max_marks: number;
  xp_reward: number;
}
export function OpenEndedForm({ value, onChange }: { value: OpenFields; onChange: (v: OpenFields) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={labelStyle}>Model answer or marking guide — seen only by teacher when marking</label>
        <textarea
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          value={value.model_answer}
          onChange={(e) => onChange({ ...value, model_answer: e.target.value })}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Max Marks</label>
          <input
            type="number"
            min={1}
            max={20}
            style={inputStyle}
            value={value.max_marks}
            onChange={(e) => onChange({ ...value, max_marks: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>XP Reward</label>
          <input
            type="number"
            style={inputStyle}
            value={value.xp_reward}
            onChange={(e) => onChange({ ...value, xp_reward: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
export function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 999,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
      color, background: bg,
    }}>{children}</span>
  );
}
export function difficultyPill(d: Difficulty) {
  if (d === 1) return <Pill color={T.green} bg={T.greenLight}>Easy</Pill>;
  if (d === 2) return <Pill color={T.gold} bg={T.goldLight}>Medium</Pill>;
  return <Pill color={T.red} bg={T.redLight}>Hard</Pill>;
}
export function typePill(t: QuestionType) {
  if (t === "mcq") return <Pill color={T.primary} bg={T.primaryLight}>MCQ</Pill>;
  if (t === "short_answer") return <Pill color={T.gold} bg={T.goldLight}>Short</Pill>;
  return <Pill color={T.purple} bg={T.purpleLight}>Essay</Pill>;
}
export function InlineDeleteButton({ onConfirm, label = "Delete" }: { onConfirm: () => void; label?: string }) {
  return <InlineConfirm onConfirm={onConfirm} label={label} />;
}
import { useState } from "react";
import { Trash2 } from "lucide-react";
function InlineConfirm({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        title={label}
        style={{
          background: "transparent", border: `1px solid ${T.border}`,
          color: T.red, padding: "6px 8px", borderRadius: 6, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12,
          fontFamily: "inherit",
        }}
      >
        <Trash2 size={14} />
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 12 }}>
      <span style={{ color: T.red, fontWeight: 600 }}>Confirm?</span>
      <button
        type="button"
        onClick={() => { onConfirm(); setArmed(false); }}
        style={{
          background: T.red, color: "#fff", border: "none",
          padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
          fontWeight: 600, fontFamily: "inherit",
        }}
      >Yes</button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        style={{
          background: "transparent", color: T.textSecondary, border: `1px solid ${T.border}`,
          padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
          fontFamily: "inherit",
        }}
      >No</button>
    </span>
  );
}
