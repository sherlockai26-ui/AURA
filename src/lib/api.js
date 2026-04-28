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

export async function apiCreateStory({ content, image_url, visibility = 'public', privacy = 'global' }) {
  return request('/api/stories', {
    method: 'POST',
    body: JSON.stringify({ content, image_url, visibility, privacy }),
  });
}

export async function apiSaveStory(storyId) {
  return request(`/api/stories/${storyId}/save`, { method: 'POST' });
}

export async function apiUnsaveStory(storyId) {
  return request(`/api/stories/${storyId}/save`, { method: 'DELETE' });
}

export async function apiGetSavedStories(page = 1) {
  return request(`/api/stories/saved?page=${page}`);
}

// ── Users ─────────────────────────────────────────────────────────────

export async function apiGetPublicUser(userId) {
  return request(`/api/users/${userId}`);
}

export async function apiGetPublicUserPosts(userId) {
  return request(`/api/users/${userId}/posts`);
}

export async function apiGetPublicUserFriends(userId) {
  return request(`/api/users/${userId}/friends`);
}

export async function apiGetPublicUserPhotos(userId) {
  return request(`/api/users/${userId}/photos`);
}

export async function apiSearchUsers(query) {
  return request(`/api/users/search?q=${encodeURIComponent(query)}`);
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

// ── Flash Videos ──────────────────────────────────────────────────────

export async function fetchVideos(page = 1, limit = 10) {
  return request(`/api/videos?page=${page}&limit=${limit}`);
}

export async function likeVideo(videoId) {
  return request(`/api/videos/${videoId}/like`, { method: 'POST' });
}

export async function fetchVideoComments(videoId, page = 1) {
  return request(`/api/videos/${videoId}/comments?page=${page}`);
}

export async function postVideoComment(videoId, content) {
  return request(`/api/videos/${videoId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function uploadVideo(formData) {
  return request('/api/videos/upload', { method: 'POST', body: formData });
}

export async function deleteVideo(videoId) {
  return request(`/api/videos/${videoId}`, { method: 'DELETE' });
}

export async function deleteVideoComment(commentId) {
  return request(`/api/videos/comments/${commentId}`, { method: 'DELETE' });
}

export async function updateVideoPrivacy(videoId, privacy) {
  return request(`/api/videos/${videoId}/privacy`, {
    method: 'PUT',
    body: JSON.stringify({ privacy }),
  });
}

export async function fetchVideoLikes(videoId, page = 1) {
  return request(`/api/videos/${videoId}/likes?page=${page}`);
}

export async function likeVideoComment(commentId) {
  return request(`/api/videos/comments/${commentId}/like`, { method: 'POST' });
}

// ── Friends ───────────────────────────────────────────────────────────

export async function apiFetchFriends() {
  return request('/api/friends');
}

export async function apiFetchFriendRequests() {
  return request('/api/friends/requests');
}

export async function apiSendFriendRequest(toUserId) {
  return request('/api/friends/request', { method: 'POST', body: JSON.stringify({ toUserId }) });
}

export async function apiRequestConnection(toUserId, message) {
  return request('/api/friends/request', { method: 'POST', body: JSON.stringify({ toUserId, message }) });
}

export async function apiAcceptFriendRequest(requestId) {
  return request('/api/friends/accept', { method: 'POST', body: JSON.stringify({ requestId }) });
}

export async function apiDeclineFriendRequest(requestId) {
  return request('/api/friends/decline', { method: 'POST', body: JSON.stringify({ requestId }) });
}

export async function apiRemoveFriend(userId) {
  return request(`/api/friends/${userId}`, { method: 'DELETE' });
}

// ── Confidants ────────────────────────────────────────────────────────

export async function apiFetchConfidants() {
  return request('/api/confidants');
}

export async function apiAddConfidant(confidantUserId) {
  return request('/api/confidants', { method: 'POST', body: JSON.stringify({ confidantUserId }) });
}

export async function apiRemoveConfidant(userId) {
  return request(`/api/confidants/${userId}`, { method: 'DELETE' });
}

// ── Health ────────────────────────────────────────────────────────────

export async function apiHealth() {
  return request('/api/health');
}

// ── Teams 2pa2 ────────────────────────────────────────────────────────

export async function getMyTeams() {
  return request('/api/teams');
}

export async function createTeam2pa2(friendId) {
  return request('/api/teams/create', { method: 'POST', body: JSON.stringify({ friendId }) });
}

export async function searchFemaleTeams() {
  return request('/api/teams/search', { method: 'POST' });
}

export async function connectTeams(teamId, femaleTeamId) {
  return request(`/api/teams/${teamId}/connect`, { method: 'POST', body: JSON.stringify({ femaleTeamId }) });
}

export async function confirmPairs(teamId, pairs) {
  return request(`/api/teams/${teamId}/confirm`, { method: 'POST', body: JSON.stringify({ pairs }) });
}
