/** Shared TypeScript types for the frontend. */

export interface User {
  id: string;
  username: string;
  role: "student" | "ta" | "admin";
  created_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  title: string;
  body: string;
  status: "open" | "answered" | "closed" | "analyzing";
  ai_answer_id: string | null;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string | null;
  body: string;
  source: "ai" | "ta" | "student";
  confidence: number | null;
  created_at: string;
  helpful_count: number;
  not_helpful_count: number;
  user_rating: boolean | null;
}

export interface Rating {
  id: string;
  answer_id: string;
  user_id: string;
  helpful: boolean;
  created_at: string;
}
