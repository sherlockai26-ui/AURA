// Centralized API client. JWT stored in localStorage key 'aura-token'.
// VITE_API_URL must be set (defaults to /api via Docker nginx proxy).
// If the backend is unreachable, functions throw — callers must handle the error.

const BASE = import.meta.env.VITE_API_URL ?? '/api';

function getToken() {
  try { return localStorage.getItem('aura-token'); } catch { return null; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem('aura-token', token);
    else localStorage.removeItem('aura-token');
  } catch {}
}

export function clearToken() { setToken(null); }

// Use hasBackend() only to disable genuinely-pending features (SMS, payments, video).
// For regular API features, just call the function and handle the thrown error.
export function hasBackend() { return true; }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    res = await fetch(apiUrl(path), { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Error ${res.status}`), { status: res.status, data });
  return data;
}

function apiUrl(path) {
  const base = String(BASE || '').replace(/\/$/, '');
  if (!base) return path;
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    return `${base}${path.slice(4)}`;
  }
  return `${base}${path}`;
}

// ── Auth ──────────────────────────────────────────────────────────────

export async function apiRegister({ email, handle, password, display_name, mode }) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, handle, password, display_name, mode }),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiLogin({ identifier, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiMe() {
  return request('/api/me');
}

export async function apiDeleteMe() {
  return request('/api/me', { method: 'DELETE' });
}

// ── Profile ───────────────────────────────────────────────────────────

export async function apiUpdateProfile({ display_name, bio }) {
  return request('/api/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ display_name, bio }),
  });
}

export async function apiUploadAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  return request('/api/uploads/avatar', { method: 'POST', body: form });
}

export async function apiUploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  return request('/api/uploads/image', { method: 'POST', body: form });
}

// ── Posts ─────────────────────────────────────────────────────────────

export async function apiGetPosts(options = {}) {
  const cursor = typeof options === 'string' ? options : options.cursor;
  const scope = typeof options === 'object' ? options.scope : undefined;
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (scope) params.set('scope', scope);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/posts${query}`);
}

export async function apiCreatePost({ content, image_url }) {
  return request('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ content, image_url }),
  });
}

export async function apiDeletePost(postId) {
  return request(`/api/posts/${postId}`, { method: 'DELETE' });
}

export async function apiToggleLike(postId) {
  return request(`/api/posts/${postId}/like`, { method: 'POST' });
}

export async function apiGetComments(postId) {
  return request(`/api/posts/${postId}/comments`);
}

export async function apiAddComment(postId, content) {
  return request(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ── Stories ───────────────────────────────────────────────────────────

export async function apiGetStories(scope = 'all') {
  const path = scope === 'circle'
    ? '/api/stories/circle'
    : scope === 'following'
    ? '/api/stories/following'
    : '/api/stories';
  return request(path);
}

export async function apiCreateStory({ content, image_url, visibility = 'public' }) {
  return request('/api/stories', {
    method: 'POST',
    body: JSON.stringify({ content, image_url, visibility }),
  });
}

// ── Users ─────────────────────────────────────────────────────────────

export async function apiGetPublicUser(userId) {
  return request(`/api/users/${userId}`);
}

export async function apiGetPublicUserPosts(userId) {
  return request(`/api/users/${userId}/posts`);
}

// ── Chat ──────────────────────────────────────────────────────────────

export async function apiGetConversations() {
  return request('/api/chat/conversations');
}

export async function apiStartConversation(other_handle) {
  return request('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ other_handle }),
  });
}

export async function apiGetMessages(conversationId) {
  return request(`/api/chat/conversations/${conversationId}/messages`);
}

export async function apiSendMessage(conversationId, content) {
  return request(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ── Notifications ─────────────────────────────────────────────────────

export async function apiGetNotifications() {
  return request('/api/notifications');
}

export async function apiMarkNotificationRead(notificationId) {
  return request(`/api/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function apiMarkAllNotificationsRead() {
  return request('/api/notifications/read-all', { method: 'POST' });
}

// ── Sparks ────────────────────────────────────────────────────────────

export async function apiGetSparks() {
  return request('/api/sparks');
}

export async function apiTransferSparks({ to_handle, amount, reason }) {
  return request('/api/sparks/transfer', {
    method: 'POST',
    body: JSON.stringify({ to_handle, amount, reason }),
  });
}

// ── Match ─────────────────────────────────────────────────────────────

export async function apiMatchCandidates() {
  return request('/api/match/candidates');
}

export async function apiMatchLike(targetUserId) {
  return request(`/api/match/like/${targetUserId}`, { method: 'POST' });
}

export async function apiMatchPass(targetUserId) {
  return request(`/api/match/pass/${targetUserId}`, { method: 'POST' });
}

export async function apiMatchList() {
  return request('/api/match/matches');
}

// ── Tasks ─────────────────────────────────────────────────────────────

export async function apiGetTasks() {
  return request('/api/tasks');
}

export async function apiClaimTask(taskKey) {
  return request(`/api/tasks/${taskKey}/claim`, { method: 'POST' });
}

// ── Health ────────────────────────────────────────────────────────────

export async function apiHealth() {
  return request('/api/health');
}
