import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchShop } from '../store/slices/shopSlice'

/**
 * Мост axios -> Redux для магазина.
 *
 * api.js не импортирует store (иначе получился бы цикл store <-> api),
 * поэтому интерцептор по мутациям задач/досок/проектов шлёт кастомное
 * событие 'shop:invalidate': баланс листьев и активные покупки могли
 * измениться на бэкенде. Этот хук — единственный слушатель, он же
 * диспатчит fetchShop().
 *
 * Хук вызывается один раз в AppLayout. Дедупликацию параллельных
 * запросов делает condition в fetchShop.
 *
 * Раньше это была связка window.dispatchEvent('shop:refresh') +
 * локальные подписки в Sidebar/TopBar/ProfilePage.
 */
export function useShopSync() {
    const dispatch = useDispatch()

    useEffect(() => {
        // Первичная загрузка: без неё TopBar/Sidebar показывали 0 листьев
        // после каждого F5, пока какая-нибудь мутация не вызовет инвалидацию.
        dispatch(fetchShop())

        const onInvalidate = () => dispatch(fetchShop())
        window.addEventListener('shop:invalidate', onInvalidate)
        return () => window.removeEventListener('shop:invalidate', onInvalidate)
    }, [dispatch])
}

export default useShopSync
