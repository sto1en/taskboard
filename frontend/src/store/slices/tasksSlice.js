import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { tasksApi } from '../../api/api'
import { logout as authLogout } from './authSlice'

/**
 * tasksSlice — владелец серверного стейта задач, который реально
 * разделяется между компонентами: список задач-кандидатов на перенос
 * (GET /tasks/reschedule-candidates). Этот список читает баннер
 * RescheduleBanner, живущий поверх всего layout, и он же обновлялся
 * кастомным событием 'tasks:refresh' после мутаций задач.
 *
 * Почему здесь НЕТ календарного среза:
 *   calendarApi.get(from, to) зависит от диапазона дат и фильтра
 *   кооперации, то есть от UI-параметров конкретного экрана. Его
 *   единственный потребитель — CalendarPage, которая и владеет текущим
 *   месяцем. Класть такой параметризованный ответ в глобальный стор
 *   (с ключом по from/to) означало бы кэш, которым никто не делится, плюс
 *   риск показать чужой месяц. Поэтому календарная проекция остаётся
 *   локальным useState в CalendarPage, а событие 'tasks:refresh' для неё
 *   превращается в обычный сигнал «перезагрузи себя» через тот же мост.
 *   В Redux вынесен только разделяемый серверный факт — кандидаты на
 *   перенос.
 *
 * Почему Redux, а не MobX: кандидаты — это ответ backend, он нужен
 * неродственному с точкой мутации баннеру и требует инвалидации после
 * мутаций задач. По границе этапа D — Redux.
 */

// ---------------------------------------------------------------
// Thunk
// ---------------------------------------------------------------

export const fetchRescheduleCandidates = createAsyncThunk(
    'tasks/fetchRescheduleCandidates',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await tasksApi.rescheduleCandidates()
            return data ?? []
        } catch (err) {
            return rejectWithValue(err.response?.status ?? null)
        }
    },
    {
        // Дедупликация: инвалидация прилетает на каждую мутацию задачи,
        // параллельные запросы кандидатов не нужны.
        condition: (_, { getState }) => !getState().tasks.loading,
    },
)

// ---------------------------------------------------------------
// Slice
// ---------------------------------------------------------------

const initialState = {
    /** список задач, предлагаемых к переносу (GET /tasks/reschedule-candidates) */
    rescheduleCandidates: [],
    /**
     * Монотонная версия инвалидации. Увеличивается на каждую мутацию задач.
     * CalendarPage держит свои параметризованные (диапазон + фильтр)
     * данные локально и перезагружает их при смене revision — вместо
     * старого прослушивания события 'tasks:refresh'.
     */
    revision: 0,
    loading: false,
    error: null,
}

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        /**
         * Явная инвалидация: список кандидатов помечается устаревшим, а
         * revision растёт — подписчики (CalendarPage) понимают, что их
         * параметризованный срез надо перезагрузить. Вызывается вместо
         * старого window.dispatchEvent('tasks:refresh').
         */
        invalidate(state) {
            state.revision += 1
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRescheduleCandidates.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchRescheduleCandidates.fulfilled, (state, action) => {
                state.rescheduleCandidates = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(fetchRescheduleCandidates.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(authLogout, (state) => {
                state.rescheduleCandidates = []
                state.error = null
            })
    },
})

export const { invalidate } = tasksSlice.actions

/**
 * Комбинированная инвалидация: поднимает revision (CalendarPage) и
 * перезагружает кандидатов на перенос (RescheduleBanner). Заменяет
 * старый window.dispatchEvent('tasks:refresh').
 */
export const invalidateTasks = () => (dispatch) => {
    dispatch(invalidate())
    dispatch(fetchRescheduleCandidates())
}

// ---------------------------------------------------------------
// Селекторы
// ---------------------------------------------------------------

export const selectRescheduleCandidates = (state) => state.tasks.rescheduleCandidates
export const selectTasksRevision = (state) => state.tasks.revision
export const selectTasksLoading = (state) => state.tasks.loading
export const selectTasksError = (state) => state.tasks.error

export default tasksSlice.reducer
