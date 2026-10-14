import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { shopApi } from '../api/api'

// Пресеты — эти акценты определены в index.css через [data-accent="..."],
// их НЕ надо переопределять инлайн
const PRESET_ACCENTS = new Set([
    'blue', 'indigo', 'violet', 'purple', 'pink', 'magenta', 'red', 'coral',
    'orange', 'amber', 'yellow', 'lime', 'green', 'mint', 'teal', 'cyan',
    'sky', 'navy', 'maroon', 'olive', 'brown', 'gray', 'slate',
    'sunset', 'ocean', 'forest', 'neon', 'gold',
])

export default function ThemeApplier({ children }) {
    const { user } = useAuth()

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
    // 2. Акцент: preset → data-accent, custom → inline vars
    // ============================================================
    useEffect(() => {
        const root = document.documentElement
        const accent = user?.appearance?.accentCode || 'blue'

        // Пресет — ставим data-accent, сбрасываем инлайн-переменные
        if (PRESET_ACCENTS.has(accent)) {
            root.setAttribute('data-accent', accent)
            root.style.removeProperty('--accent')
            root.style.removeProperty('--accent-gradient')
            root.style.removeProperty('--accent-gradient-round')
            return
        }

        // Кастом — тянем hex из магазина
        root.setAttribute('data-accent', accent)

        let cancelled = false
        shopApi.get()
            .then(({ data }) => {
                if (cancelled) return
                const item = (data?.accents || []).find(a => a.code === accent)
                if (!item || !item.hexColor) return

                const hex1 = item.hexColor
                const hex2 = item.hexColorSecondary || hex1

                const gradient = item.isGradient
                    ? `linear-gradient(135deg, ${hex1} 0%, ${hex2} 100%)`
                    : `linear-gradient(${hex1}, ${hex1})`

                root.style.setProperty('--accent', hex1)
                root.style.setProperty('--accent-gradient', gradient)
                root.style.setProperty('--accent-gradient-round', gradient)
            })
            .catch(err => console.error('[ThemeApplier] accent load failed', err))

        return () => { cancelled = true }
    }, [user?.appearance?.accentCode])

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