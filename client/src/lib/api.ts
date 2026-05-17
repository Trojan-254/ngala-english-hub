const BASE_URL = '/api';

function getSessionId(): string | null {
  return localStorage.getItem('sessionId');
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<T> {
    const sessionId = getSessionId();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (sessionId) {
       headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
       throw new Error(data.error || 'Request failed');
    }

    return data;
}

// ======== AUTH ============
export const api = {
  auth: {
    register: (payload: {
      username: string;
      display_name: string;
      password: string;
      class_code: string;
    }) => request<{ sessionId: string; user: User }>('POST', '/auth/register', payload),

    login: (username: string, password: string) =>
      request<{ sessionId: string; user: User }>('POST', '/auth/login', { username, password }),

    logout: () => request<{ message: string }>('POST', '/auth/logout'),

    me: () => request<{ user: User }>('GET', '/auth/me'),
  },

  // ============= GRAMMAR =============== 
  grammar: {
    topics: (curriculum?: string) =>
      request<{ topics: Topic[] }>('GET', `/grammar/topics${curriculum ? `?curriculum=${curriculum}` : ''}`),

    startSession: (topic_id: number, limit?: number) =>
      request<{ session_id: number; topic: Topic; questions: Question[] }>(
        'POST', '/grammar/session/start', { topic_id, limit }
      ),

    submitAnswer: (payload: {
      question_id: number;
      answer: string;
      session_id: number;
      time_taken_ms: number;
    }) => request<AnswerResult>('POST', '/grammar/answer', payload),

    endSession: (session_id: number) =>
      request<SessionResult>('POST', '/grammar/session/end', { session_id }),

    progress: () => request<{ progress: ModuleProgress; topic_breakdown: TopicBreakdown[] }>('GET', '/grammar/progress'),
  },

  // ========== COMPREHENSION ============ 
  comprehension: {
    topics: (curriculum?: string) =>
      request<{ topics: Topic[] }>('GET', `/comprehension/topics${curriculum ? `?curriculum=${curriculum}` : ''}`),

    passages: (topic_id: number) =>
      request<{ passages: Passage[] }>('GET', `/comprehension/passages?topic_id=${topic_id}`),

    startSession: (passage_id: number) =>
      request<{ session_id: number; passage: Passage; questions: Question[]; time_limit_seconds: number }>(
        'POST', '/comprehension/session/start', { passage_id }
      ),

    submitAnswer: (payload: {
      passage_question_id: number;
      answer: string;
      session_id: number;
      time_taken_ms: number;
    }) => request<AnswerResult>('POST', '/comprehension/answer', payload),

    endSession: (session_id: number, time_taken_seconds?: number) =>
      request<SessionResult>('POST', '/comprehension/session/end', { session_id, time_taken_seconds }),

    progress: () => request<{ progress: ModuleProgress; passage_history: unknown[] }>('GET', '/comprehension/progress'),
  },

  // =========== VOCABULARY ============= 
  vocabulary: {
    topics: () =>
      request<{ topics: Topic[] }>('GET', '/vocabulary/topics'),

    startSession: (topic_id: number) =>
      request<{ session_id: number; words: VocabWord[] }>(
        'POST', '/vocabulary/session/start', { topic_id }
      ),

    submitRating: (payload: {
      vocab_id: number;
      rating: 'forgot' | 'hard' | 'got';
      session_id: number;
    }) => request<{ next_review: string }>('POST', '/vocabulary/rate', payload),

    progress: () =>
      request<{ progress: ModuleProgress }>('GET', '/vocabulary/progress'),
  },

  // ================= PAST PAPERS ================== 
  pastpapers: {
    list: () =>
      request<{ papers: PastPaper[] }>('GET', '/pastpapers'),

    startSession: (paper_id: number) =>
      request<{ session_id: number; paper: PastPaper; questions: Question[] }>(
        'POST', '/pastpapers/session/start', { paper_id }
      ),

    submit: (payload: {
      session_id: number;
      answers: Record<number, string>;
      time_taken_seconds: number;
    }) => request<{ score: number; total: number; accuracy: number; grade: string }>(
      'POST', '/pastpapers/session/submit', payload
    ),

    progress: () =>
      request<{ progress: ModuleProgress }>('GET', '/pastpapers/progress'),
  },

  // ============== LEADERBOARD =============== 
  leaderboard: {
    weekly: () =>
      request<{ leaderboard: LeaderboardEntry[] }>('GET', '/leaderboard/weekly'),
  },
}; // <-- Added closing brace for the api object

// ========= SHARED TYPES ==============
export interface User {
  id: number;
  username: string;
  display_name: string;
  role: 'student' | 'teacher';
  class_group: string | null;
  curriculum: string | null;
  xp_total: number;
  level: number;
}

export interface Topic {
  id: number;
  module_id: number;
  title: string;
  description: string;
  curriculum: string;
  difficulty: 1 | 2 | 3;
  sort_order: number;
  is_active: number;
  question_count: number;
  my_accuracy?: number | null;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  difficulty: number;
  xp_reward: number;
}

export interface Passage {
  id: number;
  title: string;
  content: string;
  word_count: number;
  difficulty: 1 | 2 | 3;
  source: string;
  question_count?: number;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  xp_earned: number;
  new_xp: number;
  new_level: number;
  levelled_up: boolean;
}

export interface SessionResult {
  score: number;
  total: number;
  accuracy: number;
  xp_earned: number;
}

export interface ModuleProgress {
  total_attempts: number;
  correct: number;
  accuracy_pct: number;
  xp_from_module: number;
  last_activity: string;
}

export interface TopicBreakdown {
  topic: string;
  attempts: number;
  correct: number;
  accuracy_pct: number;
}

export interface VocabWord {
  id: number;
  word: string;
  definition: string;
  part_of_speech: string;
  example_sentence: string;
  synonym: string;
  antonym: string;
  difficulty: number;
}

export interface PastPaper {
  id: number;
  title: string;
  year: number;
  paper_number: 1 | 2;
  description: string;
  duration_minutes: number;
  question_count: number;
  attempted: boolean;
  score?: number;
  date_attempted?: string;
}

export interface LeaderboardEntry {
  id: number;
  display_name: string;
  weekly_xp: number;
  level: number;
  class_group: string;
}
