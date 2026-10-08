async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {'content-type': 'application/json', ...(options.headers || {})},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `request_failed_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const loadCloudState = (view = 'student') => request(`/api/bootstrap?view=${encodeURIComponent(view)}`);
export const syncEvent = action => request('/api/events', {method: 'POST', body: JSON.stringify(action)});
export const loginAccount = (username, password) => request('/api/auth/login', {method: 'POST', body: JSON.stringify({username, password})});
export const logoutAccount = () => request('/api/auth/session', {method: 'DELETE'});

export async function uploadAudio(id, blob, {lesson, text, duration}) {
  const params = new URLSearchParams({lesson, text, duration: String(duration)});
  const response = await fetch(`/api/audio/${encodeURIComponent(id)}?${params}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {'content-type': blob.type || 'audio/webm'},
    body: blob,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `audio_upload_failed_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}
