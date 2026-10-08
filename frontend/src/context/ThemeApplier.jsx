import { useEffect } from 'react'
import { useAuth } from './AuthContext'

export default function ThemeApplier({ children }) {
    const { user } = useAuth()

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

        const accent = user?.appearance?.accentCode || 'blue'
        root.setAttribute('data-accent', accent)

        const density = user?.appearance?.density || 'cozy'
        root.setAttribute('data-density', density)
    }, [user?.appearance])

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