import { UiStore } from './UiStore'

/**
 * Единый экземпляр MobX-стора на всё приложение.
 * Создаётся один раз на уровне модуля — аналог singleton-хранилища.
 * Вынесен в отдельный модуль (.js), чтобы StoreContext.jsx экспортировал
 * только компоненты (требование Fast Refresh).
 */
export const uiStore = new UiStore()

export default uiStore
