// frontend/src/api.ts
// Central API client for the Hippocrates Django backend

import type { Question } from './store/useStore';

const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${API_HOST}:8000/api`;

// ─── Auth Token Helpers ───────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
}

/** Authenticated fetch — auto-refreshes token on 401 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  const makeRequest = (tkn: string | null) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
      },
    });

  let res = await makeRequest(token);

  // Token expired — try refreshing once
  if (res.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      res = await makeRequest(token);
    } else {
      // Refresh also failed — force logout
      window.location.href = '/login';
    }
  }

  return res;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_email_verified: boolean;
  created_at: string;
  tags: { id: string; name: string }[];
  question_count: number;
  reading_progress: number;
}

export async function register(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password2: string;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
}

export async function verifyEmail(email: string, code: string): Promise<{ access: string; refresh: string }> {
  const res = await fetch(`${BASE_URL}/auth/verify-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Verification failed');
  }
  return res.json();
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/resend-verification/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Could not resend code');
  }
}

export async function login(email: string, password: string): Promise<{ access: string; refresh: string; user: AuthUser }> {
  const res = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function logout(refreshToken: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/auth/logout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok && res.status !== 205) {
    throw new Error('Logout failed');
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/forgot-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Request failed');
  }
}

export async function resetPassword(data: {
  email: string;
  code: string;
  password: string;
  password2: string;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Reset failed');
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await authFetch(`${BASE_URL}/auth/me/`);
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiMaterial {
  id: string;
  title: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  created_at: string;
  tags: { id: string; name: string }[];
  question_count: number;
  reading_progress: number;
}

export interface ApiBlock {
  id: string;
  parent_id: string | null;
  order: number;
  block_type: 'heading_1' | 'heading_2' | 'heading_3' | 'paragraph' | 'list_item';
  text: string;
}

export interface ApiMaterialDetail extends ApiMaterial {
  blocks: ApiBlock[];
  last_block_id: string | null;
}

export interface ApiUploadResponse {
  id: string;
  title: string;
  status: string;
  blocks_created: number;
}

// ─── Materials API ────────────────────────────────────────────────────────────

export async function fetchMaterials(): Promise<ApiMaterial[]> {
  const res = await authFetch(`${BASE_URL}/materials/`);
  if (!res.ok) throw new Error(`Failed to fetch materials: ${res.statusText}`);
  return res.json();
}

export async function fetchMaterialDetail(id: string): Promise<ApiMaterialDetail> {
  const res = await authFetch(`${BASE_URL}/materials/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch material: ${res.statusText}`);
  return res.json();
}

export async function uploadMaterial(title: string, file: File): Promise<ApiUploadResponse> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);

  const res = await authFetch(`${BASE_URL}/materials/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Upload failed: ${res.statusText}`);
  }

  return res.json();
}

export async function deleteMaterial(id: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/materials/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}

export async function renameMaterial(id: string, title: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/materials/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Rename failed: ${res.statusText}`);
}

// ─── Question API ─────────────────────────────────────────────────────────────

export async function generateQuestion(
  blockId: string,
  selectedText: string,
  questionType: string,
  materialId: string
): Promise<Question> {
  const res = await authFetch(`${BASE_URL}/questions/generate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      block_id: blockId,
      selected_text: selectedText,
      question_type: questionType,
      material_id: materialId,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to generate question');
  }

  const data = await res.json();
  return { ...data, type: data.question_type };
}

export async function fetchQuestions(materialId: string): Promise<Question[]> {
  const res = await authFetch(`${BASE_URL}/questions/?material_id=${materialId}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = await res.json();
  return data.map((q: any) => ({ ...q, type: q.question_type }));
}

export async function approveQuestion(id: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });
  if (!res.ok) throw new Error('Failed to approve question');
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete question');
}

export async function updateQuestionPayload(id: string, payload: any): Promise<Question> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw new Error('Failed to update question');
  const data = await res.json();
  return { ...data, type: data.question_type };
}

export async function regenerateQuestion(id: string, extraInstruction: string): Promise<Question> {
  const res = await authFetch(`${BASE_URL}/questions/${id}/regenerate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extra_instruction: extraInstruction }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to regenerate question');
  }

  const data = await res.json();
  return { ...data, type: data.question_type };
}

export async function logAttempt(
  questionId: string,
  isCorrect: boolean,
  userAnswer: object = {}
): Promise<void> {
  await authFetch(`${BASE_URL}/questions/attempts/log/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      is_correct: isCorrect,
      user_answer: userAnswer,
    }),
  }).catch(() => {
    console.warn('Failed to log attempt to backend');
  });
}

// ─── Tags & Search & Progress ────────────────────────────────────────────────

export interface ApiTag {
  id: string;
  name: string;
  material_count: number;
  created_at: string;
}

export async function fetchTags(): Promise<ApiTag[]> {
  const res = await authFetch(`${BASE_URL}/tags/`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function createTag(name: string): Promise<ApiTag> {
  const res = await authFetch(`${BASE_URL}/tags/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create tag');
  return res.json();
}

export async function addTagToMaterial(materialId: string, tagIdOrName: { tag_id?: string; tag_name?: string }): Promise<ApiTag> {
  const res = await authFetch(`${BASE_URL}/materials/${materialId}/tags/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagIdOrName),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to add tag');
  }
  return res.json();
}

export async function renameTag(id: string, name: string): Promise<ApiTag> {
  const res = await authFetch(`${BASE_URL}/tags/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename tag');
  return res.json();
}

export async function deleteTag(id: string): Promise<{ affected_materials: { id: string; title: string }[] }> {
  const res = await authFetch(`${BASE_URL}/tags/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tag');
  return res.json();
}

export async function removeTagFromMaterial(materialId: string, tagId: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/materials/${materialId}/tags/${tagId}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove tag');
}

export async function saveReadingProgress(materialId: string, percent: number, lastBlockId: string | null): Promise<void> {
  await authFetch(`${BASE_URL}/materials/${materialId}/progress/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ percent, last_block_id: lastBlockId }),
  }).catch(() => console.warn('Failed to save reading progress'));
}

export async function searchMaterials(query: string): Promise<any[]> {
  const res = await authFetch(`${BASE_URL}/materials/search/?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DayActivity {
  date: string;
  reviewed: number;
  created: number;
  review_streak_met: boolean;
  creation_streak_met: boolean;
  streak_met: boolean;
}

export interface DashboardStats {
  reviewed_today: number;
  review_streak_minimum: number;
  review_streak_met: boolean;

  created_today: number;
  creation_streak_minimum: number;
  creation_streak_met: boolean;

  current_review_streak: number;
  current_creation_streak: number;
  longest_review_streak: number;
  longest_creation_streak: number;

  monthly_activity: DayActivity[];
  due_count: number;
  cards_mastered_today: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await authFetch(`${BASE_URL}/questions/dashboard/stats/`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// ─── Quiz Session ─────────────────────────────────────────────────────────────

export interface QuizCard {
  id: string;
  question_type: 'mcq' | 'true_false' | 'fill_in' | 'applies';
  material_id: string;
  block_id?: string | null;
  material_title: string;
  topic: string;
  payload: any;
  streak: number;
  review_count: number;
  scheduled_date: string;
  mastery_dots: number;
  mastery_required: number;
  availableAt: number;
}

export interface QuizSession {
  session_total: number;
  completed: number;
  queue: QuizCard[];
  has_more?: boolean;
}

export async function fetchQuizSession(excludeIds?: string[]): Promise<QuizSession> {
  const query = excludeIds && excludeIds.length > 0
    ? `?exclude_ids=${encodeURIComponent(excludeIds.join(','))}`
    : '';
  const res = await authFetch(`${BASE_URL}/questions/session/${query}`);
  if (!res.ok) throw new Error('Failed to load quiz session');
  return res.json();
}

export interface AnswerResponse {
  streak: number;
  mastered: boolean;
  next_scheduled: string | null;
  available_at: number;
}

export async function submitCardAnswer(
  cardId: string,
  correct: boolean
): Promise<AnswerResponse> {
  const res = await authFetch(`${BASE_URL}/questions/session/${cardId}/answer/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correct }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

