import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { statsApi } from '../../api/api'
import { logout as authLogout } from './authSlice'

/**
 * statsSlice — владелец серверного стейта агрегированной статистики,
 * нужного боковой панели: количество выполненных за сегодня задач для
 * дерева (statsApi.get('day') → done).
 *
 * Почему Redux, а не MobX: doneTasks — это факт с сервера (агрегат по
 * задачам пользователя), он меняется после мутаций задач и раньше
 * обновлялся кастомным событием 'tree:refresh'. По границе этапа D такой
 * стейт живёт в Redux; MobX хранит только эфемерную UI-логику
 * (например, локальную видимость дерева — это останется на D5).
 *
 * Сейчас слайс владеет единственным срезом 'day'. Полная страница
 * статистики (StatsPage) запрашивает свои периоды сама и сюда не пишет.
 */

// ---------------------------------------------------------------
// Thunk
// ---------------------------------------------------------------

/**
 * Загружает дневную сводку. Аргумент — период ('day' по умолчанию),
 * чтобы слайс не был жёстко привязан к одному значению.
 */
export const fetchStats = createAsyncThunk(
    'stats/fetch',
    async (period = 'day', { rejectWithValue }) => {
        try {
            const { data } = await statsApi.get(period)
            return { period, data }
        } catch (err) {
            return rejectWithValue(err.response?.status ?? null)
        }
    },
    {
        // Дедупликация: инвалидация прилетает на каждую мутацию задачи,
        // параллельные /stats не нужны.
        condition: (_, { getState }) => !getState().stats.loading,
    },
)

// ---------------------------------------------------------------
// Slice
// ---------------------------------------------------------------

const initialState = {
    /** сколько задач выполнено сегодня (data.done ответа /stats?period=day) */
    doneToday: 0,
    /**
     * Монотонная версия инвалидации. Компоненты, которым нужно перезагрузить
     * дневную сводку после мутации задачи, поднимают её вместо старого
     * события 'tree:refresh'.
     */
    revision: 0,
    loading: false,
    error: null,
}

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        /**
         * Явная инвалидация: дневная сводка помечается устаревшей, revision
         * растёт. Вызывается вместо старого window.dispatchEvent('tree:refresh').
         */
        invalidate(state) {
            state.revision += 1
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStats.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchStats.fulfilled, (state, action) => {
                if (action.payload.period === 'day') {
                    state.doneToday = action.payload.data?.done ?? 0
                }
                state.loading = false
                state.error = null
            })
            .addCase(fetchStats.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(authLogout, (state) => {
                state.doneToday = 0
                state.error = null
            })
    },
})

export const { invalidate } = statsSlice.actions

/**
 * Комбинированная инвалидация: поднимает revision и перезагружает дневную
 * сводку. Заменяет старый window.dispatchEvent('tree:refresh').
 */
export const invalidateStats = () => (dispatch) => {
    dispatch(invalidate())
    dispatch(fetchStats('day'))
}

// ---------------------------------------------------------------
// Селекторы
// ---------------------------------------------------------------

export const selectDoneToday = (state) => state.stats.doneToday
export const selectStatsRevision = (state) => state.stats.revision
export const selectStatsLoading = (state) => state.stats.loading
export const selectStatsError = (state) => state.stats.error

export default statsSlice.reducer
