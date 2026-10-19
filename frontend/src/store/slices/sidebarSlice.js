import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { boardsApi, projectsApi } from '../../api/api'
import { logout as authLogout } from './authSlice'

/**
 * sidebarSlice — владелец серверного стейта «пиннутых» досок и проектов.
 *
 * Почему Redux, а не MobX и не локальный useState: данные приходят от
 * backend (GET /boards + GET /boards/{id}/projects) и нужны сразу двум
 * неродственным местам — самой боковой панели (Sidebar) и хоткеям
 * g1/g2/g3 (AppLayout.openPinned). Раньше обе точки независимо делали
 * по 4 запроса и синхронизировались кастомным событием 'sidebar:refresh'.
 * Теперь источник истины один — этот слайс.
 *
 * Хранится только отфильтрованная «пиннутая» проекция (как и раньше в
 * Sidebar): доски, у которых isPinned, либо у которых есть пиннутые
 * проекты; для каждой такой доски — её пиннутые проекты. Сортировка:
 * position, затем id. Полный список досок живёт на страницах (/boards и
 * /boards/:id) в их локальном стейте и сюда не пишется.
 */

// ---------------------------------------------------------------
// Thunk: единый источник пиннутых сущностей
// ---------------------------------------------------------------

export const fetchPinned = createAsyncThunk(
    'sidebar/fetchPinned',
    async (_, { rejectWithValue }) => {
        try {
            const { data: allBoards } = await boardsApi.list()

            const projectsArrays = await Promise.all(
                allBoards.map((b) =>
                    projectsApi
                        .listByBoard(b.id)
                        .then(({ data }) => [b.id, data])
                        .catch(() => [b.id, []]),
                ),
            )
            const mapProjects = Object.fromEntries(projectsArrays)

            const boards = allBoards
                .filter((b) => {
                    const projs = mapProjects[b.id] || []
                    return b.isPinned || projs.some((p) => p.isPinned)
                })
                .sort((a, b) => {
                    const pa = a.position ?? 0
                    const pb = b.position ?? 0
                    if (pa !== pb) return pa - pb
                    return (a.id || 0) - (b.id || 0)
                })

            const projectsByBoard = {}
            for (const b of boards) {
                projectsByBoard[b.id] = (mapProjects[b.id] || [])
                    .filter((p) => p.isPinned)
                    .sort((a, b2) => {
                        const pa = a.position ?? 0
                        const pb = b2.position ?? 0
                        if (pa !== pb) return pa - pb
                        return (a.id || 0) - (b2.id || 0)
                    })
            }

            return { boards, projectsByBoard }
        } catch (err) {
            return rejectWithValue(err.response?.status ?? null)
        }
    },
    {
        // Дедупликация: инвалидация прилетает на каждую мутацию
        // /boards и /projects, параллельные серии запросов не нужны.
        condition: (_, { getState }) => !getState().sidebar.loading,
    },
)

// ---------------------------------------------------------------
// Slice
// ---------------------------------------------------------------

const initialState = {
    /** только пиннутые доски (отфильтровано и отсортировано) */
    boards: [],
    /** { [boardId]: пиннутые проекты этой доски } */
    projectsByBoard: {},
    loading: false,
    error: null,
}

const applyPinned = (state, payload) => {
    state.boards = payload?.boards ?? []
    state.projectsByBoard = payload?.projectsByBoard ?? {}
    state.loading = false
    state.error = null
}

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        /**
         * Явная инвалидация: пиннутая проекция помечается устаревшей.
         * Вызывается вместо старого window.dispatchEvent('sidebar:refresh').
         * Также используется при logout, чтобы пины не «протекали» между
         * пользователями.
         */
        invalidate(state) {
            state.boards = []
            state.projectsByBoard = {}
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPinned.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchPinned.fulfilled, (state, action) => {
                applyPinned(state, action.payload)
            })
            .addCase(fetchPinned.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // При выходе пины предыдущего пользователя не должны «протекать»
            // в сессию следующего — чистим проекцию.
            .addCase(authLogout, (state) => {
                state.boards = []
                state.projectsByBoard = {}
                state.error = null
            })
    },
})

export const { invalidate } = sidebarSlice.actions

// ---------------------------------------------------------------
// Селекторы
// ---------------------------------------------------------------

export const selectPinnedBoards = (state) => state.sidebar.boards
export const selectPinnedProjectsByBoard = (state) => state.sidebar.projectsByBoard
export const selectSidebarLoading = (state) => state.sidebar.loading
export const selectSidebarError = (state) => state.sidebar.error

/**
 * Производный плоский список закрепов в том же порядке, в каком раньше
 * строился массив pins в AppLayout.openPinned: если у доски есть пиннутые
 * проекты — идут они (каждый как отдельный закреп), иначе — сама доска.
 *
 * Используется хоткеями g1/g2/g3: openPinned(index) больше не делает
 * собственных 4 запросов, а читает готовый список.
 */
export const selectSidebarPins = (state) => {
    const pins = []
    for (const b of state.sidebar.boards) {
        const projs = state.sidebar.projectsByBoard[b.id] || []
        if (projs.length > 0) {
            for (const p of projs) {
                pins.push({ type: 'project', boardId: b.id, projectId: p.id })
            }
        } else {
            pins.push({ type: 'board', boardId: b.id })
        }
    }
    return pins
}

export default sidebarSlice.reducer
