import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8082/api',
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    const lang = localStorage.getItem('lang') || 'ru'
    config.headers['Accept-Language'] = lang
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            if (window.location.pathname !== '/login') window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
}

export const boardsApi = {
    list: () => api.get('/boards'),
    get: (id) => api.get(`/boards/${id}`),
    create: (data) => api.post('/boards', data),
    update: (id, data) => api.patch(`/boards/${id}`, data),
    delete: (id) => api.delete(`/boards/${id}`),
    move: (id, { position }) => api.patch(`/boards/${id}`, { position }),
}

export const boardMembersApi = {
    list:   (boardId) => api.get(`/boards/${boardId}/members`),
    add:    (boardId, data) => api.post(`/boards/${boardId}/members`, data),
    update: (boardId, userId, data) => api.patch(`/boards/${boardId}/members/${userId}`, data),
    remove: (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`),
}

export const projectsApi = {
    listByBoard: (boardId) => api.get(`/boards/${boardId}/projects`),
    get: (id) => api.get(`/projects/${id}`),
    create: (boardId, data) => api.post(`/boards/${boardId}/projects`, data),
    update: (id, data) => api.patch(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    move: (id, { position }) => api.patch(`/projects/${id}`, { position }),
}

export const projectFiltersApi = {
    get:   (projectId) => api.get(`/projects/${projectId}/filters`),
    save:  (projectId, data) => api.put(`/projects/${projectId}/filters`, data),
    clear: (projectId) => api.delete(`/projects/${projectId}/filters`),
}

export const tasksApi = {
    listByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
    kanban: (projectId) => api.get(`/projects/${projectId}/kanban`),
    get: (id) => api.get(`/tasks/${id}`),
    history: (id) => api.get(`/tasks/${id}/history`),
    create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
    update: (id, data) => api.patch(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    attach: (taskId, attachmentId) =>
        api.post(`/tasks/${taskId}/attachments`, { attachmentId }),
    detach: (taskId, attachmentId) =>
        api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
    move: (id, { statusId, position }) =>
        api.patch(`/tasks/${id}`, { statusId, position }),
    setParent: (id, parentId) => api.patch(`/tasks/${id}`, { parentId }),
    clearParent: (id) => api.patch(`/tasks/${id}`, { clearParent: true }),
    rescheduleCandidates: () => api.get('/tasks/reschedule-candidates'),
    snoozeReschedule: (id, hours = 24) =>
        api.patch(`/tasks/${id}/snooze-reschedule`, null, { params: { hours } }),
    moveDate: (id, date) => api.patch(`/tasks/${id}/move-date`, null, { params: { date } }),

    messages: {
        list:   (taskId) => api.get(`/tasks/${taskId}/messages`),
        create: (taskId, data) => api.post(`/tasks/${taskId}/messages`, data),
        update: (taskId, messageId, data) => api.patch(`/tasks/${taskId}/messages/${messageId}`, data),
        delete: (taskId, messageId) => api.delete(`/tasks/${taskId}/messages/${messageId}`),
    },
}

export const recurrenceApi = {
    get:     (taskId) => api.get(`/tasks/${taskId}/recurrence`),
    save:    (taskId, data) => api.post(`/tasks/${taskId}/recurrence`, data),
    delete:  (taskId) => api.delete(`/tasks/${taskId}/recurrence`),
    preview: (data) => api.post('/tasks/recurrence/preview', data),
}

export const tagsApi = {
    listByBoard: (boardId) => api.get(`/boards/${boardId}/tags`),
    search: (boardId, q) => api.get(`/boards/${boardId}/tags/search`, { params: { q } }),
    create: (boardId, data) => api.post(`/boards/${boardId}/tags`, data),
    update: (id, data) => api.patch(`/tags/${id}`, data),
    delete: (id) => api.delete(`/tags/${id}`),
}

export const statusesApi = {
    list: (boardId, scope) =>
        api.get(`/boards/${boardId}/statuses`, { params: scope ? { scope } : {} }),
    create: (boardId, data) => api.post(`/boards/${boardId}/statuses`, data),
    update: (boardId, statusId, data) =>
        api.patch(`/boards/${boardId}/statuses/${statusId}`, data),
    delete: (boardId, statusId) =>
        api.delete(`/boards/${boardId}/statuses/${statusId}`),
}

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

export const usersApi = {
    me: () => api.get('/users/me'),
    search: (q) => api.get('/users/search', { params: { q } }),
    updateProfile: (data) => api.patch('/users/me/profile', data),
    updateAppearance: (data) => api.patch('/users/me/appearance', data),
    updateLocale: (data) => api.patch('/users/me/locale', data),
    updateWorkspace: (data) => api.patch('/users/me/workspace', data),
    updateDisplay: (data) => api.patch('/users/me/display', data),
    updateNotification: (data) => api.patch('/users/me/notification', data),
}

/* Алиас для обратной совместимости */
export const userApi = usersApi

export const searchApi = {
    global: (q) => api.get('/search', { params: { q } }),
    suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
    filter: (params) => api.get('/search/filter', { params }),
    inProject: (projectId, q) =>
        api.get(`/search/projects/${projectId}`, { params: { q } }),
}

export const statsApi = {
    get: (period) => api.get('/stats', { params: { period } }),
    overview: (period) => api.get('/stats/overview', { params: { period } }),
    dailyLoad: (from, to) => api.get('/stats/daily-load', { params: { from, to } }),
}

export const calendarApi = {
    get: (from, to) => api.get('/calendar', { params: { from, to } }),
}

export const achievementsApi = {
    list: () => api.get('/achievements'),
}

export const shopApi = {
    get: () => api.get('/shop'),
    buyAvatar: (id) => api.post(`/shop/avatars/${id}/buy`),
    equipAvatar: (id) => api.post(`/shop/avatars/${id}/equip`),
    buyFrame: (id) => api.post(`/shop/frames/${id}/buy`),
    equipFrame: (id) => api.post(`/shop/frames/${id}/equip`),
    unequipFrame: () => api.post('/shop/frames/unequip'),
    buyTreeSkin: (id) => api.post(`/shop/tree-skins/${id}/buy`),
    equipTreeSkin: (id) => api.post(`/shop/tree-skins/${id}/equip`),
    unequipTreeSkin: () => api.post('/shop/tree-skins/unequip'),
    buyAccent: (id) => api.post(`/shop/accents/${id}/buy`),
    equipAccent: (id) => api.post(`/shop/accents/${id}/equip`),
    unequipAccent: () => api.post('/shop/accents/unequip'),
}

export default api