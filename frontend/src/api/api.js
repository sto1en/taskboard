import axios from 'axios'

// ============================================================
// Глобальный обработчик ачивок — регистрируется из контекста
// ============================================================
let achievementsHandler = null

export function setAchievementsHandler(fn) {
    achievementsHandler = fn
}

function fireAchievements(list) {
    if (!achievementsHandler) return
    if (!Array.isArray(list) || list.length === 0) return
    try {
        achievementsHandler(list)
    } catch (e) {
        console.error('[achievements] handler error', e)
    }
}

// ============================================================
// Axios instance
// ============================================================
// В dev-режиме запросы идут на относительный /api и Vite проксирует их на backend
// (см. vite.config.js). В прод-сборке тот же путь отдаёт nginx/реверс-прокси,
// поэтому абсолютный адрес бэкенда в коде не нужен.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
    (response) => {
        const data = response?.data
        const url = response?.config?.url || ''
        const method = (response?.config?.method || '').toLowerCase()

        // 1. Новые ачивки → toast
        if (data && Array.isArray(data.newlyUnlockedAchievements) && data.newlyUnlockedAchievements.length > 0) {
            fireAchievements(data.newlyUnlockedAchievements)
        }

        // 2. Любая мутация по задачам/доскам/проектам → обновить баланс листьев.
        // Мост axios -> Redux: сам стор здесь не импортируется (иначе цикл
        // store <-> api), событие слушает hooks/useShopSync.js в AppLayout.
        if (method === 'post' || method === 'patch' || method === 'delete') {
            if (url.includes('/tasks') ||
                url.includes('/boards') ||
                url.includes('/projects')) {
                window.dispatchEvent(new Event('shop:invalidate'))
            }
        }

        return response
    },
    (error) => {
        const status = error.response?.status
        // Только 401 означает «сессии нет / токен протух». 403 — это запрет
        // доступа (чужая доска, админская ручка и т.п.), и разлогинивать из-за
        // него нельзя: иначе любой фоновый запрос или переход «Назад» на
        // страницу без прав выбрасывал пользователя из аккаунта.
        if (status === 401) {
            localStorage.removeItem('token')
            // Мост axios -> Redux: authSlice сбрасывает состояние по этому событию
            // (см. context/AuthContext.jsx). api.js намеренно не импортирует store,
            // чтобы не создать циклическую зависимость store <-> api.
            // Переход на /login делает ProtectedRoute по пустому токену —
            // без full-reload, чтобы не ломать историю браузера.
            window.dispatchEvent(new Event('auth:unauthorized'))
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
    move: (id, { position }) => api.patch(`/boards/${id}`, { position }),
}

export const boardMembersApi = {
    list:   (boardId) => api.get(`/boards/${boardId}/members`),
    add:    (boardId, data) => api.post(`/boards/${boardId}/members`, data),
    update: (boardId, userId, data) => api.patch(`/boards/${boardId}/members/${userId}`, data),
    remove: (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`),
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
    move: (id, { position }) => api.patch(`/projects/${id}`, { position }),
}

export const projectFiltersApi = {
    get:   (projectId) => api.get(`/projects/${projectId}/filters`),
    save:  (projectId, data) => api.put(`/projects/${projectId}/filters`, data),
    clear: (projectId) => api.delete(`/projects/${projectId}/filters`),
}

// ============================================================
// Tasks
// ============================================================
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
// Users
// ============================================================
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

export const userApi = usersApi

// ============================================================
// Search
// ============================================================
export const searchApi = {
    global: (q) => api.get('/search', { params: { q } }),
    suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
    filter: (params) => api.get('/search/filter', { params }),
    inProject: (projectId, q) =>
        api.get(`/search/projects/${projectId}`, { params: { q } }),
}

// ============================================================
// Leaderboard
// ============================================================
export const leaderboardApi = {
    get: () => api.get('/leaderboard'),
}

// ============================================================
// Пользовательские группы (списки людей для кооп-приглашений)
// ============================================================
export const userGroupsApi = {
    list: () => api.get('/user-groups'),
    create: (name) => api.post('/user-groups', { name }),
    rename: (id, name) => api.patch(`/user-groups/${id}`, { name }),
    remove: (id) => api.delete(`/user-groups/${id}`),
    addMember: (id, userId) => api.post(`/user-groups/${id}/members`, { userId }),
    removeMember: (id, userId) => api.delete(`/user-groups/${id}/members/${userId}`),

    invitations: () => api.get('/user-groups/invitations'),
    acceptInvite: (id) => api.post(`/user-groups/invitations/${id}/accept`),
    declineInvite: (id) => api.post(`/user-groups/invitations/${id}/decline`),

    inviteToProject: (id, projectId) =>
        api.post(`/user-groups/${id}/projects/${projectId}/invite`),
    projectInvitations: () => api.get('/user-groups/project-invitations'),
    declineProjectInvite: (token) =>
        api.delete(`/user-groups/project-invitations/${token}`),
}

// ============================================================
// Task templates
// ============================================================
export const taskTemplatesApi = {
    list: () => api.get('/task-templates'),
    get: (id) => api.get(`/task-templates/${id}`),
    create: (data) => api.post('/task-templates', data),
    update: (id, data) => api.put(`/task-templates/${id}`, data),
    remove: (id) => api.delete(`/task-templates/${id}`),
    apply: (id, data) => api.post(`/task-templates/${id}/apply`, data),
}

// ============================================================
// Guides (week / month scenarios)
// ============================================================
export const guidesApi = {
    list: () => api.get('/guides'),
    get: (id) => api.get(`/guides/${id}`),
    create: (data) => api.post('/guides', data),
    update: (id, data) => api.put(`/guides/${id}`, data),
    remove: (id) => api.delete(`/guides/${id}`),
    duplicate: (id) => api.post(`/guides/${id}/duplicate`),
    apply: (id, data) => api.post(`/guides/${id}/apply`, data),
    showcase: () => api.get('/guides/showcase'),
    saveShowcase: (guideIds) => api.put('/guides/showcase', { guideIds }),
}

// ============================================================
// Stats
// ============================================================
export const statsApi = {
    get: (period) => api.get('/stats', { params: { period } }),
    overview: (period) => api.get('/stats/overview', { params: { period } }),
    dailyGoal: () => api.get('/stats/daily-goal'),
    claimDailyGoal: () => api.post('/stats/daily-goal/claim'),
    dailyLoad: (from, to, coop) =>
        api.get('/stats/daily-load', {
            params: { from, to, ...(coop === undefined ? {} : { coop }) },
        }),
}

// ============================================================
// Calendar
// ============================================================
export const calendarApi = {
    get: (from, to, projectId) =>
        api.get('/calendar', {
            params: { from, to, ...(projectId == null ? {} : { projectId }) },
        }),
}

// ============================================================
// Achievements
// ============================================================
export const achievementsApi = {
    list: () => api.get('/achievements'),
}

// ============================================================
// Social profile (Steam-style wall)
// ============================================================
export const socialApi = {
    profile: (id) => api.get(`/social/profiles/${id}`),
    updateBackground: (backgroundCode) =>
        api.put('/social/me/background', { backgroundCode }),
    updateShowcase: (achievementCodes) =>
        api.put('/social/me/showcase', { achievementCodes }),
    friends: () => api.get('/social/friends'),
    addFriend: (id) => api.post(`/social/friends/${id}`),
    acceptFriend: (id) => api.post(`/social/friends/${id}/accept`),
    removeFriend: (id) => api.delete(`/social/friends/${id}`),
    wall: (id) => api.get(`/social/profiles/${id}/wall`),
    addWallPost: (id, body) => api.post(`/social/profiles/${id}/wall`, { body }),
    deleteWallPost: (id, postId) =>
        api.delete(`/social/profiles/${id}/wall/${postId}`),
}

// ============================================================
// Shop
// ============================================================
export const shopApi = {
    get: (params = {}) => api.get('/shop', { params }),
    treeCategories: () => api.get('/shop/tree-categories'),
    // Справочники для чипов магазина — публичные (админские ручки отдают 403
    // не-админам, а api.js на 403 выкидывает из аккаунта).
    avatarCategories: () => api.get('/shop/avatar-categories'),
    frameCategories: () => api.get('/shop/frame-categories'),
    accentCategories: () => api.get('/shop/accent-categories'),
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
    // Фоны профиля
    buyBackground: (id) => api.post(`/shop/backgrounds/${id}/buy`),
    equipBackground: (id) => api.post(`/shop/backgrounds/${id}/equip`),
    // Сундуки
    chests: () => api.get('/shop/chests'),
    openChest: (code) => api.post(`/shop/chests/${code}/open`),
    buyKey: () => api.post('/shop/chests/keys/buy'),
    // Подарок недели
    weeklyGift: () => api.get('/shop/weekly-gift'),
    claimWeeklyGift: () => api.post('/shop/weekly-gift/claim'),
    // Корзина: одна транзакция на сервере (всё или ничего)
    checkoutCart: (items) => api.post('/shop/cart/checkout', { items }),
}

// ============================================================
// Admin
// ============================================================
export const adminApi = {
    // Аватарки — категории
    listAvatarCategories: () => api.get('/admin/shop/avatar-categories'),
    createAvatarCategory: (data) => api.post('/admin/shop/avatar-categories', data),
    updateAvatarCategory: (id, data) => api.patch(`/admin/shop/avatar-categories/${id}`, data),
    deleteAvatarCategory: (id) => api.delete(`/admin/shop/avatar-categories/${id}`),

    // Аватарки — элементы
    listAvatars: () => api.get('/admin/shop/avatars'),
    createAvatar: (formData) =>
        api.post('/admin/shop/avatars', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateAvatar: (id, formData) =>
        api.patch(`/admin/shop/avatars/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteAvatar: (id) => api.delete(`/admin/shop/avatars/${id}`),

    // Рамки — категории
    listFrameCategories: () => api.get('/admin/shop/frame-categories'),
    createFrameCategory: (data) => api.post('/admin/shop/frame-categories', data),
    updateFrameCategory: (id, data) => api.patch(`/admin/shop/frame-categories/${id}`, data),
    deleteFrameCategory: (id) => api.delete(`/admin/shop/frame-categories/${id}`),

    // Рамки — элементы
    listFrames: () => api.get('/admin/shop/frames'),
    createFrame: (formData) =>
        api.post('/admin/shop/frames', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateFrame: (id, formData) =>
        api.patch(`/admin/shop/frames/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteFrame: (id) => api.delete(`/admin/shop/frames/${id}`),

    // Акценты — категории
    listAccentCategories: () => api.get('/admin/shop/accent-categories'),
    createAccentCategory: (data) => api.post('/admin/shop/accent-categories', data),
    updateAccentCategory: (id, data) => api.patch(`/admin/shop/accent-categories/${id}`, data),
    deleteAccentCategory: (id) => api.delete(`/admin/shop/accent-categories/${id}`),

    // Акценты — элементы
    listAccents: () => api.get('/admin/shop/accents'),
    createAccent: (formData) =>
        api.post('/admin/shop/accents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateAccent: (id, formData) =>
        api.patch(`/admin/shop/accents/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteAccent: (id) => api.delete(`/admin/shop/accents/${id}`),

    // Фоны профиля
    listBackgrounds: () => api.get('/admin/shop/backgrounds'),
    createBackground: (formData) =>
        api.post('/admin/shop/backgrounds', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateBackground: (id, formData) =>
        api.patch(`/admin/shop/backgrounds/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteBackground: (id) => api.delete(`/admin/shop/backgrounds/${id}`),

    // Деревья — категории
    listTreeCategories: () => api.get('/admin/shop/tree-categories'),
    createTreeCategory: (data) => api.post('/admin/shop/tree-categories', data),
    updateTreeCategory: (id, data) => api.patch(`/admin/shop/tree-categories/${id}`, data),
    deleteTreeCategory: (id) => api.delete(`/admin/shop/tree-categories/${id}`),

    // Деревья — элементы
    listTrees: () => api.get('/admin/shop/trees'),
    createTree: (data) => api.post('/admin/shop/trees', data),
    updateTree: (id, data) => api.patch(`/admin/shop/trees/${id}`, data),
    deleteTree: (id) => api.delete(`/admin/shop/trees/${id}`),

    // Подарок недели
    listWeeklyRewards: () => api.get('/admin/shop/weekly-rewards'),
    saveWeeklyReward: (data) => api.post('/admin/shop/weekly-rewards', data),
    deleteWeeklyReward: (id) => api.delete(`/admin/shop/weekly-rewards/${id}`),
}

// ============================================================
// Групповые проекты
// ============================================================
export const groupApi = {
    list: () => api.get('/group/projects'),
    create: (data) => api.post('/group/projects', data),
    get: (id) => api.get(`/group/projects/${id}`),
    update: (id, data) => api.patch(`/group/projects/${id}`, data),
    remove: (id) => api.delete(`/group/projects/${id}`),

    members: (id) => api.get(`/group/projects/${id}/members`),
    invite: (id) => api.post(`/group/projects/${id}/invite`),
    removeMember: (id, userId) => api.delete(`/group/projects/${id}/members/${userId}`),

    previewInvite: (token) => api.get(`/group/invites/${token}`),
    join: (token) => api.post(`/group/join/${token}`),
}

export default api