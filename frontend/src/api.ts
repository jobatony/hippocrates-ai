// frontend/src/api.ts
// Central API client for the Hippocrates Django backend

const BASE_URL = 'http://localhost:8000/api';

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

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/materials/
 * Returns a list of all uploaded materials (no blocks embedded).
 */
export async function fetchMaterials(): Promise<ApiMaterial[]> {
  const res = await fetch(`${BASE_URL}/materials/`);
  if (!res.ok) throw new Error(`Failed to fetch materials: ${res.statusText}`);
  return res.json();
}

/**
 * GET /api/materials/<id>/
 * Returns a material and its complete flat block array.
 */
export async function fetchMaterialDetail(id: string): Promise<ApiMaterialDetail> {
  const res = await fetch(`${BASE_URL}/materials/${id}/`);
  if (!res.ok) throw new Error(`Failed to fetch material: ${res.statusText}`);
  return res.json();
}

/**
 * POST /api/materials/
 * Uploads a .docx file, triggers parsing, returns the created material.
 */
export async function uploadMaterial(
  title: string, 
  file: File
): Promise<ApiUploadResponse> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/materials/`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type here — the browser sets it with the boundary
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Upload failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * DELETE /api/materials/<id>/
 * Deletes a material and all its blocks.
 */
export async function deleteMaterial(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/materials/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}
