import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAuth } from './AuthContext'
import { selectShop } from '../store/slices/shopSlice'

export default function ThemeApplier({ children }) {
    const { user } = useAuth()
    // Каталог акцентов — серверный стейт из Redux (раньше: отдельный GET /shop)
    const shop = useSelector(selectShop)

    // ============================================================
    // 1. Тема и плотность
    // ============================================================
    useEffect(() => {
        const root = document.documentElement

        const theme = user?.appearance?.theme || 'light'
        let effective = theme
        if (theme === 'system') {
            effective = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
        }
        root.setAttribute('data-theme', effective)

        const density = user?.appearance?.density || 'cozy'
        root.setAttribute('data-density', density)
    }, [user?.appearance])

    // ============================================================
    // 2. Акцент: hex из каталога магазина → инлайн-переменные
    // ============================================================
    useEffect(() => {
        const root = document.documentElement
        const accent = user?.appearance?.accentCode || 'blue'

        // Источник истины — акцент с сервера: админ может поправить hex или
        // сделать акцент редким, и интерфейс обязан это отразить.
        root.setAttribute('data-accent', accent)

        const item = (shop?.accents || []).find(a => a.code === accent)

        // Преcет без записи в каталоге (blue до загрузки магазина) —
        // отдаём управление CSS-переменным из index.css.
        if (!item || !item.hexColor) {
            root.style.removeProperty('--accent')
            root.style.removeProperty('--accent-gradient')
            root.style.removeProperty('--accent-gradient-round')
            root.style.removeProperty('--accent-metal-1')
            root.style.removeProperty('--accent-metal-2')
            root.style.removeProperty('--accent-metal-3')
            root.style.removeProperty('--accent-metal')
            return
        }

        const hex1 = item.hexColor
        const hex2 = item.hexColorSecondary || hex1
        const hex3 = item.hexColorTertiary || hex2

        // Редкий акцент: интерфейс не заливается сплошным цветом, а получает
        // металлическое кольцо/градиент-блеск отдельными переменными.
        if (item.isRare) {
            root.style.setProperty('--accent', hex1)
            root.style.setProperty('--accent-metal-1', hex1)
            root.style.setProperty('--accent-metal-2', hex2)
            root.style.setProperty('--accent-metal-3', hex3)
            root.style.setProperty('--accent-metal',
                `linear-gradient(115deg, ${hex1} 0%, ${hex2} 34%, ${hex3} 58%, ${hex2} 78%, ${hex1} 100%)`)

            const metal = `linear-gradient(135deg, ${hex2} 0%, ${hex3} 45%, ${hex1} 100%)`
            root.style.setProperty('--accent-gradient', metal)
            root.style.setProperty('--accent-gradient-round', metal)
            return
        }

        root.style.removeProperty('--accent-metal-1')
        root.style.removeProperty('--accent-metal-2')
        root.style.removeProperty('--accent-metal-3')
        root.style.removeProperty('--accent-metal')

        const gradient = item.isGradient
            ? `linear-gradient(135deg, ${hex1} 0%, ${hex2} 100%)`
            : `linear-gradient(${hex1}, ${hex1})`

        root.style.setProperty('--accent', hex1)
        root.style.setProperty('--accent-gradient', gradient)
        root.style.setProperty('--accent-gradient-round', gradient)
    }, [user?.appearance?.accentCode, shop])

    // ============================================================
    // 3. Синхронизация "system" темы
    // ============================================================
    useEffect(() => {
        if (user?.appearance?.theme !== 'system') return
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => {
            document.documentElement.setAttribute(
                'data-theme',
                media.matches ? 'dark' : 'light'
            )
        }
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [user?.appearance?.theme])

    return children
}