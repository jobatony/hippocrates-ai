// frontend/src/api.ts
// Central API client for the Hippocrates Django backend

import type { Question } from './store/useStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
