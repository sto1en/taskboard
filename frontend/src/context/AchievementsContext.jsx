import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import AchievementToast from '../components/Achievement/AchievementToast'
import { setAchievementsHandler } from '../api/api'

const AchievementsContext = createContext(null)

export function AchievementsProvider({ children }) {
    const [queue, setQueue] = useState([])
    const seenRef = useRef(new Set())

    const pushAchievements = useCallback((achievements) => {
        if (!achievements || achievements.length === 0) return
        const fresh = []
        for (const a of achievements) {
            if (!a || !a.code) continue
            if (seenRef.current.has(a.code)) continue
            seenRef.current.add(a.code)
            fresh.push({ ...a, id: a.id ?? a.code })
        }
        if (fresh.length === 0) return
        setQueue(prev => [...prev, ...fresh])
    }, [])

    // Регистрируем handler для api.js
    useEffect(() => {
        setAchievementsHandler(pushAchievements)
        return () => setAchievementsHandler(null)
    }, [pushAchievements])

    const dismiss = useCallback((id) => {
        setQueue(prev => prev.filter(a => a.id !== id))
    }, [])

    return (
        <AchievementsContext.Provider value={{ pushAchievements }}>
            {children}
            <AchievementToast queue={queue} onDismiss={dismiss} />
        </AchievementsContext.Provider>
    )
}

export function useAchievements() {
    const ctx = useContext(AchievementsContext)
    if (!ctx) throw new Error('useAchievements must be used within AchievementsProvider')
    return ctx
}