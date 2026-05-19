export interface Overview {
  total_students: number;
  class_groups: number;
  weekly_accuracy: number;
  weekly_attempts: number;
  most_attempted_module: string | null;
  active_today: number;
}
export interface Student {
  id: number;
  username: string;
  display_name: string;
  class_group: string | null;
  curriculum: string | null;
  xp_total: number;
  level: number;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  total_attempts: number;
  correct_answers: number | null;
  overall_accuracy: number | null;
  modules: Record<string, { attempts: number; accuracy: number }>;
}
export interface WeakTopic {
  topic: string;
  module: string;
  module_slug: string;
  total_attempts: number;
  correct: number;
  accuracy_pct: number;
  students_attempted: number;
}
export interface ModuleStat {
  module_slug: string;
  total_attempts: number;
  correct: number;
  accuracy_pct: number;
  unique_students: number;
  avg_response_sec: number;
}
export interface ClassCode {
  id: number;
  code: string;
  class_group: string;
  curriculum: string;
  is_active: number;
  expires_at: string;
  students_registered: number;
  created_at: string;
}
export interface LeaderboardEntry {
  id: number;
  display_name: string;
  class_group: string;
  level: number;
  xp_total: number;
  weekly_xp: number;
}
export interface ClassGroupInfo {
  class_group: string;
  curriculum: string;
  student_count: number;
}
function authHeaders(): HeadersInit {
  const sid = localStorage.getItem("sessionId") ?? "";
  return { "x-session-id": sid, "Content-Type": "application/json" };
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries as [string, string][]).toString();
}
export const teacherApi = {
  overview: () => request<Overview>("/teacher/overview"),
  students: (class_group?: string) =>
    request<{ students: Student[] }>(`/teacher/students${qs({ class_group })}`),
  weakTopics: (class_group?: string) =>
    request<{ weak_topics: WeakTopic[] }>(`/teacher/weak-topics${qs({ class_group })}`),
  moduleStats: (class_group?: string) =>
    request<{ module_stats: ModuleStat[] }>(`/teacher/module-stats${qs({ class_group })}`),
  classGroups: () =>
    request<{ class_groups: ClassGroupInfo[] }>("/teacher/class-groups"),
  leaderboard: (class_group?: string) =>
    request<{ leaderboard: LeaderboardEntry[] }>(`/teacher/leaderboard${qs({ class_group })}`),
  createCode: (payload: { code: string; class_group: string; curriculum: string; expires_days: number }) =>
    request<{ id: number; code: string; message: string }>("/teacher/codes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteCode: (id: number) =>
    request<{ message: string }>(`/teacher/codes/${id}`, { method: "DELETE" }),
  getCodes: () => request<{ codes: ClassCode[] }>("/teacher/codes"),
  deactivateStudent: (id: number) =>
    request<{ message: string }>(`/teacher/students/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: false }), }),
  activateStudent: (id: number) =>
    request<{ message: string }>(`/teacher/students/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: true }), }),
  addStudentNote: (id: number, note: string) =>
    request<{ message: string }>(`/teacher/students/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  triggerChallenge: (payload: { module_slug: string; topic_id?: number; title: string; class_group?: string }) =>
    request<{ challenge_id: number; message: string }>("/teacher/challenge", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
