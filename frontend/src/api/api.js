import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8082/api',
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// ============================================================
// Auth
// ============================================================
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
}

// ============================================================
// Boards
// ============================================================
export const boardsApi = {
    list: () => api.get('/boards'),
    get: (id) => api.get(`/boards/${id}`),
    create: (data) => api.post('/boards', data),
    update: (id, data) => api.patch(`/boards/${id}`, data),
    delete: (id) => api.delete(`/boards/${id}`),

    // Перемещение доски (drag&drop)
    move: (id, { position }) =>
        api.patch(`/boards/${id}`, { position }),
}

// ============================================================
// Projects
// ============================================================
export const projectsApi = {
    listByBoard: (boardId) => api.get(`/boards/${boardId}/projects`),
    get: (id) => api.get(`/projects/${id}`),
    create: (boardId, data) => api.post(`/boards/${boardId}/projects`, data),
    update: (id, data) => api.patch(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),

    // Перемещение проекта (drag&drop)
    move: (id, { position }) =>
        api.patch(`/projects/${id}`, { position }),
}

// ============================================================
// Tasks
// ============================================================
export const tasksApi = {
    listByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
    kanban: (projectId) => api.get(`/projects/${projectId}/kanban`),
    get: (id) => api.get(`/tasks/${id}`),
    create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
    update: (id, data) => api.patch(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    attach: (taskId, attachmentId) =>
        api.post(`/tasks/${taskId}/attachments`, { attachmentId }),
    detach: (taskId, attachmentId) =>
        api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
    move: (id, { statusId, position }) =>
        api.patch(`/tasks/${id}`, { statusId, position }),
}

// ============================================================
// Tags
// ============================================================
export const tagsApi = {
    listByBoard: (boardId) => api.get(`/boards/${boardId}/tags`),
    search: (boardId, q) => api.get(`/boards/${boardId}/tags/search`, { params: { q } }),
    create: (boardId, data) => api.post(`/boards/${boardId}/tags`, data),
    update: (id, data) => api.patch(`/tags/${id}`, data),
    delete: (id) => api.delete(`/tags/${id}`),
}

// ============================================================
// Statuses
// ============================================================
export const statusesApi = {
    list: (boardId, scope) =>
        api.get(`/boards/${boardId}/statuses`, { params: scope ? { scope } : {} }),
    create: (boardId, data) => api.post(`/boards/${boardId}/statuses`, data),
    update: (boardId, statusId, data) =>
        api.patch(`/boards/${boardId}/statuses/${statusId}`, data),
    delete: (boardId, statusId) =>
        api.delete(`/boards/${boardId}/statuses/${statusId}`),
}

// ============================================================
// Attachments
// ============================================================
export const attachmentsApi = {
    upload: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/attachments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    get: (id) => api.get(`/attachments/${id}`),
    delete: (id) => api.delete(`/attachments/${id}`),
}

// ============================================================
// User
// ============================================================
export const userApi = {
    me: () => api.get('/users/me'),
    updateProfile: (data) => api.patch('/users/me/profile', data),
    updateAppearance: (data) => api.patch('/users/me/appearance', data),
    updateLocale: (data) => api.patch('/users/me/locale', data),
    updateWorkspace: (data) => api.patch('/users/me/workspace', data),
    updateDisplay: (data) => api.patch('/users/me/display', data),
    updateNotification: (data) => api.patch('/users/me/notification', data),
}

// ============================================================
// Search
// ============================================================
export const searchApi = {
    global: (q) => api.get('/search', { params: { q } }),
    inProject: (projectId, q) =>
        api.get(`/search/projects/${projectId}`, { params: { q } }),
}

// ============================================================
// Stats
// ============================================================
export const statsApi = {
    get: (period) => api.get('/stats', { params: { period } }),
}

// ============================================================
// Calendar
// ============================================================
export const calendarApi = {
    get: (from, to) => api.get('/calendar', { params: { from, to } }),
}

export default api