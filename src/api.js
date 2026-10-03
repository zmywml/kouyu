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
export const loginTeacher = token => request('/api/auth/teacher', {method: 'POST', body: JSON.stringify({token})});
export const logoutTeacher = () => request('/api/auth/session', {method: 'DELETE'});
