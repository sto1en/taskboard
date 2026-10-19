import { useContext } from 'react'
import StoreContext from './StoreContext'

/**
 * Доступ к MobX-стору из компонентов.
 * Компонент должен быть обёрнут в observer(), чтобы реагировать на изменения.
 */
export function useUiStore() {
    const store = useContext(StoreContext)
    if (!store) throw new Error('useUiStore must be used within StoreProvider')
    return store
}

export default useUiStore
