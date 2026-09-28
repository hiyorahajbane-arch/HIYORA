const TOKEN_KEY = 'dariya.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private browsing */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    // A dead token should not leave the app in a half-logged-in state.
    if (res.status === 401 && token) setToken(null)
    throw new ApiError(data?.error || `Erreur ${res.status}`, res.status)
  }
  return data
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),

  health: () => request('/health'),
  courses: () => request('/courses'),
  course: (id) => request(`/courses/${id}`),
  lesson: (id) => request(`/lessons/${id}`),
  exercises: (id) => request(`/lessons/${id}/exercises`),
  answer: (id, exerciseId, answer) => request(`/lessons/${id}/answer`, { method: 'POST', body: { exerciseId, answer } }),
  complete: (id) => request(`/lessons/${id}/complete`, { method: 'POST' }),
  glossary: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v))
    return request(`/glossary${q.toString() ? `?${q}` : ''}`)
  },
  progress: () => request('/progress'),

  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  demo: () => request('/auth/demo'),
  me: () => request('/auth/me'),
  updateMe: (patch) => request('/auth/me', { method: 'PATCH', body: patch }),
}
