import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authApi, userApi } from '../../api/api'

const TOKEN_KEY = 'token'

/**
 * Токен читается/пишется только здесь — единственный владелец.
 * api.js (axios interceptor) читает localStorage напрямую, чтобы не зависеть
 * от порядка инициализации стора; это осознанный компромисс, разобранный
 * в отчёте по этапу D (см. раздел «Границы ответственности»).
 */
const readToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY)
    } catch {
        return null
    }
}

const writeToken = (token) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
    } catch {
        /* приватный режим браузера — молча игнорируем */
    }
}

// ---------------------------------------------------------------
// Thunks: весь обмен с backend живёт в Redux, компоненты только диспатчат
// ---------------------------------------------------------------

export const fetchMe = createAsyncThunk(
    'auth/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await userApi.me()
            return data
        } catch (err) {
            return rejectWithValue(err.response?.status ?? null)
        }
    },
    {
        // Дедупликация: не запускаем повторно, если профиль уже загружен.
        // ВАЖНО: нельзя проверять state.auth.loading — при наличии токена он
        // инициализируется как true и остаётся true до завершения ЭТОГО запроса.
        // Условие по loading создавало взаимную блокировку: fetchMe никогда не
        // выполнялся (его же condition его и блокировал), профиль не грузился.
        // meError не даёт зациклиться на постоянной ошибке (500/403): без него
        // ProtectedRoute перезапускал бы запрос после каждого рендера.
        condition: (_, { getState }) =>
            !getState().auth.user && !getState().auth.meError,
    },
)

export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
    try {
        const { data } = await authApi.login({ username, password })
        writeToken(data.token)
        return data
    } catch (err) {
        // Отдаём объект в форме axios-ошибки ({ response: { data } }), чтобы
        // существующие компоненты читали err.response?.data?.message как раньше.
        return rejectWithValue({ response: { data: err.response?.data ?? { message: 'Ошибка входа' } } })
    }
})

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
    try {
        const { data } = await authApi.register(payload)
        writeToken(data.token)
        return data
    } catch (err) {
        return rejectWithValue({ response: { data: err.response?.data ?? { message: 'Ошибка регистрации' } } })
    }
})

// ---------------------------------------------------------------
// Slice
// ---------------------------------------------------------------

const initialState = {
    token: readToken(),
    user: null,
    /** true, пока идёт первичная проверка токена (fetchMe) */
    loading: Boolean(readToken()),
    /** последняя ошибка авторизации — для форм логина/регистрации */
    error: null,
    /** статус неудачной загрузки профиля: защита от повторного цикла fetchMe */
    meError: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /** Локальное обновление полей user (workspace, appearance, locale...) */
        updateUser(state, action) {
            if (state.user) state.user = { ...state.user, ...action.payload }
        },
        /** Сброс авторизации: чистим токен и всё, что с ним связано */
        logout(state) {
            writeToken(null)
            state.token = null
            state.user = null
            state.loading = false
            state.error = null
            state.meError = null
        },
    },
    extraReducers: (builder) => {
        builder
            // --- fetchMe ---
            .addCase(fetchMe.pending, (state) => {
                state.loading = true
                state.meError = null
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.user = action.payload
                state.loading = false
                state.error = null
                state.meError = null
            })
            .addCase(fetchMe.rejected, (state, action) => {
                state.loading = false
                state.meError = action.payload ?? 0
                // 401 — токен протух, чистим. 403 — запрет доступа к профилю,
                // это не повод выкидывать из аккаунта (и не повод зацикливать
                // повторные запросы). Прочие ошибки тоже оставляем как есть.
                if (action.payload === 401) {
                    writeToken(null)
                    state.token = null
                }
                state.user = null
            })
            // --- login ---
            .addCase(login.pending, (state) => {
                state.error = null
            })
            .addCase(login.fulfilled, (state, action) => {
                state.token = action.payload.token
                state.error = null
                state.meError = null
            })
            .addCase(login.rejected, (state, action) => {
                state.error = action.payload
            })
            // --- register ---
            .addCase(register.pending, (state) => {
                state.error = null
            })
            .addCase(register.fulfilled, (state, action) => {
                state.token = action.payload.token
                state.error = null
            })
            .addCase(register.rejected, (state, action) => {
                state.error = action.payload
            })
    },
})

export const { updateUser, logout } = authSlice.actions

export const selectUser = (state) => state.auth.user
export const selectToken = (state) => state.auth.token
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error

export default authSlice.reducer
