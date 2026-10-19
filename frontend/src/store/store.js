import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import shopReducer from './slices/shopSlice'
import sidebarReducer from './slices/sidebarSlice'
import tasksReducer from './slices/tasksSlice'
import statsReducer from './slices/statsSlice'

/**
 * Корневой Redux-стор (RTK).
 *
 * Зона ответственности Redux в TaskBoard — глобальный / серверный стейт:
 * данные, источником истины для которых является backend (auth, shop,
 * sidebar-пины, задачи календаря, статистика). Такие данные нужны
 * нескольким неродственным экранам и требуют инвалидации после мутаций.
 *
 * Локальная UI-логика (collapsed, открытые панели тулбара, запрос на
 * создание сущности по хоткею) живёт в MobX — см. store/UiStore.js.
 */
export const store = configureStore({
    reducer: {
        auth: authReducer,
        shop: shopReducer,
        sidebar: sidebarReducer,
        tasks: tasksReducer,
        stats: statsReducer,
    },
    devTools: import.meta.env.DEV,
})

export default store
