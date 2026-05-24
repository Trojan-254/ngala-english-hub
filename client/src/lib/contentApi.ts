export type QuestionType = "mcq" | "short_answer" | "essay";
export type Difficulty = 1 | 2 | 3;
export type Curriculum = "both" | "844" | "CBE";
export interface Topic {
  id: number;
  module_id: number;
  title: string;
  description: string;
  curriculum: Curriculum;
  difficulty: Difficulty;
  sort_order: number;
  question_count?: number;
}
export interface Question {
  id: number;
  topic_id: number;
  topic_title: string;
  module_slug: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  xp_reward: number;
  difficulty: Difficulty;
  source: string | null;
  curriculum: Curriculum;
  max_marks: number | null;
}
export interface Passage {
  id: number;
  topic_id: number;
  topic_title: string;
  title: string;
  content: string;
  word_count: number;
  difficulty: Difficulty;
  source: string | null;
  curriculum: Curriculum;
  question_count: number;
}
export interface PassageQuestion {
  id: number;
  passage_id: number;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  xp_reward: number;
  sort_order: number;
  max_marks: number | null;
}
export interface PastPaper {
  id: number;
  title: string;
  year: number;
  paper_number: 1 | 2;
  subject: string;
  description: string | null;
  duration_minutes: number;
  question_count: number;
  mcq_count: number;
  open_count: number;
  is_active: number;
}
export interface VocabWord {
  id: number;
  word: string;
  definition: string;
  part_of_speech: string;
  example_sentence: string;
  synonym: string | null;
  antonym: string | null;
  difficulty: Difficulty;
  topic_tag: string;
  curriculum: Curriculum;
}
export interface MarkingQueueItem {
  attempt_id: number;
  open_answer: string;
  marking_status: string;
  marks_awarded: number | null;
  max_marks: number | null;
  teacher_feedback: string | null;
  created_at: string;
  student_name: string;
  class_group: string;
  question_text: string;
  model_answer: string | null;
  question_max_marks: number | null;
  paper_title: string | null;
}
function authHeaders(): HeadersInit {
  const sid = localStorage.getItem("sessionId") ?? "";
  return { "x-session-id": sid, "Content-Type": "application/json" };
}
async function request<T>(path: string, method: string = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`/api/content${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
async function rawRequest<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}
function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries as [string, string][]).toString();
}
export const contentApi = {
  // Topics (student-facing endpoints, accessible with session header)
  getGrammarTopics: () => rawRequest<{ topics: Topic[] }>("/api/grammar/topics"),
  getComprehensionTopics: () => rawRequest<{ topics: Topic[] }>("/api/comprehension/topics"),
  // Grammar / Questions
  getQuestions: (topic_id?: number, module_slug?: string) =>
    request<{ questions: Question[] }>(`/questions${qs({ topic_id: topic_id?.toString(), module_slug })}`),
  createQuestion: (payload: Omit<Question, "id" | "topic_title" | "module_slug">) =>
    request<{ id: number; message: string }>("/questions", "POST", payload),
  updateQuestion: (id: number, payload: Partial<Question>) =>
    request<{ message: string }>(`/questions/${id}`, "PUT", payload),
  deleteQuestion: (id: number) =>
    request<{ message: string }>(`/questions/${id}`, "DELETE"),
  // Passages
  getPassages: (topic_id?: number) =>
    request<{ passages: Passage[] }>(`/passages${qs({ topic_id: topic_id?.toString() })}`),
  createPassage: (payload: { topic_id: number; title: string; content: string; difficulty: number; source?: string; curriculum: string }) =>
    request<{ id: number; word_count: number; message: string }>("/passages", "POST", payload),
  updatePassage: (id: number, payload: Partial<Passage>) =>
    request<{ message: string }>(`/passages/${id}`, "PUT", payload),
  deletePassage: (id: number) =>
    request<{ message: string }>(`/passages/${id}`, "DELETE"),
  getPassageQuestions: (passageId: number) =>
    request<{ questions: PassageQuestion[] }>(`/passages/${passageId}/questions`),
  addPassageQuestion: (passageId: number, payload: Omit<PassageQuestion, "id" | "passage_id">) =>
    request<{ id: number; message: string }>(`/passages/${passageId}/questions`, "POST", payload),
  deletePassageQuestion: (passageId: number, questionId: number) =>
    request<{ message: string }>(`/passages/${passageId}/questions/${questionId}`, "DELETE"),
  // Past Papers
  getPapers: () =>
    request<{ papers: PastPaper[] }>("/past-papers"),
  createPaper: (payload: { title: string; year: number; paper_number: number; description?: string; duration_minutes?: number }) =>
    request<{ id: number; message: string }>("/past-papers", "POST", payload),
  deletePaper: (id: number) =>
    request<{ message: string }>(`/past-papers/${id}`, "DELETE"),
  addPaperQuestion: (paperId: number, payload: Omit<Question, "id" | "topic_id" | "topic_title" | "module_slug">) =>
    request<{ id: number; message: string }>(`/past-papers/${paperId}/questions`, "POST", payload),
  // Vocabulary
  getVocabulary: (topic_id?: number) =>
    request<{ words: VocabWord[] }>(`/vocabulary${qs({ topic_id: topic_id?.toString() })}`),
  createWord: (payload: Omit<VocabWord, "id">) =>
    request<{ id: number; message: string }>("/vocabulary", "POST", payload),
  updateWord: (id: number, payload: Partial<VocabWord>) =>
    request<{ message: string }>(`/vocabulary/${id}`, "PUT", payload),
  deleteWord: (id: number) =>
    request<{ message: string }>(`/vocabulary/${id}`, "DELETE"),
  // Marking queue
  getMarkingQueue: (status?: string) =>
    request<{ queue: MarkingQueueItem[] }>(`/marking-queue${qs({ status })}`),
  markAnswer: (attemptId: number, marks_awarded: number, feedback?: string) =>
    request<{ message: string; xp_awarded: number }>(`/marking-queue/${attemptId}/mark`, "POST", { marks_awarded, feedback }),
  // Get comprehension topics
  getComprehensionTopics: () =>
    request<{ topics: { id: number; title: string; curriculum: string }[] }>(
      '/passages/topics', 'GET'
    ),
  // Topics
  getTopics: (module_slug?: string) =>
    request<{ topics: Topic[] }>(`/topics${qs({ module_slug })}`),
  createTopic: (payload: { module_slug: string; title: string; description?: string; curriculum: string; difficulty: number }) =>
    request<{ id: number; message: string }>('/topics', 'POST', payload),
  updateTopic: (id: number, payload: Partial<Topic>) =>
    request<{ message: string }>(`/topics/${id}`, 'PUT', payload),
  deleteTopic: (id: number) =>
    request<{ message: string }>(`/topics/${id}`, 'DELETE'),
};
