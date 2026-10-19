import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { shopApi } from '../../api/api'

/**
 * shopSlice — владелец серверного стейта магазина.
 *
 * Почему Redux, а не MobX: data — это ответ backend (UserShopDto:
 * leaves, avatars, frames, treeSkins, accents). Факт принадлежит серверу,
 * нужен нескольким неродственным экранам (Sidebar, TopBar, ProfilePage,
 * ShopPage) и требует инвалидации после мутаций. По границе из этапа D
 * такой стейт живёт в Redux; MobX хранит только эфемерную UI-логику.
 *
 * Канонический ответ: shopApi.get() без параметров. ShopPage запрашивает
 * /shop с фильтрами и сортировкой и держит свой локальный useState —
 * фильтрованный ответ не пишется сюда, иначе leaves/activeAvatar в TopBar
 * начинали бы зависеть от выбранных в магазине фильтров.
 */

// ---------------------------------------------------------------
// Thunk: весь обмен с backend живёт здесь, компоненты только диспатчат
// ---------------------------------------------------------------

export const fetchShop = createAsyncThunk(
    'shop/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await shopApi.get()
            return data
        } catch (err) {
            return rejectWithValue(err.response?.status ?? null)
        }
    },
    {
        // Дедупликация: инвалидация прилетает на каждую мутацию
        // (/tasks, /boards, /projects), но параллельные /shop не нужны.
        condition: (_, { getState }) => !getState().shop.loading,
    },
)

// ---------------------------------------------------------------
// Slice
// ---------------------------------------------------------------

const initialState = {
    /** ответ shopApi.get() без параметров (UserShopDto) */
    data: null,
    /** быстрый доступ к балансу листьев — используется TopBar */
    leaves: 0,
    loading: false,
    error: null,
}

/** Единая проекция ответа backend в состояние слайса */
const applyShop = (state, data) => {
    state.data = data ?? null
    state.leaves = data?.leaves ?? 0
    state.loading = false
    state.error = null
}

const shopSlice = createSlice({
    name: 'shop',
    initialState,
    reducers: {
        /**
         * Явная инвалидация: канонический ответ помечается устаревшим.
         * Вызывается вместо старого window.dispatchEvent('shop:refresh').
         */
        invalidate(state) {
            state.data = null
            state.leaves = 0
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShop.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchShop.fulfilled, (state, action) => {
                applyShop(state, action.payload)
            })
            .addCase(fetchShop.rejected, (state, action) => {
                state.loading = false
                // 401/403 обрабатываются в api.js/authSlice; здесь просто
                // не роняем UI магазина — данные остаются прежними.
                state.error = action.payload
            })
    },
})

export const { invalidate } = shopSlice.actions

// ---------------------------------------------------------------
// Селекторы
// ---------------------------------------------------------------

export const selectShop = (state) => state.shop.data
export const selectLeaves = (state) => state.shop.leaves
export const selectShopLoading = (state) => state.shop.loading
export const selectShopError = (state) => state.shop.error

// Derived-селекторы: заменяют shop?.avatars?.find(a => a.active) в компонентах.

export const selectActiveAvatar = (state) =>
    state.shop.data?.avatars?.find((a) => a.active) || null

export const selectActiveFrame = (state) =>
    state.shop.data?.frames?.find((f) => f.active) || null

export const selectActiveTreeSkin = (state) =>
    state.shop.data?.treeSkins?.find((s) => s.active) || null

export default shopSlice.reducer
