import { createContext, useContext, useState, useCallback } from 'react'
import HotkeysHelpModal from '../components/common/HotkeysHelpModal'

const HotkeysContext = createContext(null)

export function HotkeysProvider({ children }) {
    const [helpOpen, setHelpOpen] = useState(false)

    const openHelp = useCallback(() => setHelpOpen(true), [])
    const closeHelp = useCallback(() => setHelpOpen(false), [])

    return (
        <HotkeysContext.Provider value={{ openHelp, closeHelp, helpOpen }}>
            {children}
            <HotkeysHelpModal open={helpOpen} onClose={closeHelp} />
        </HotkeysContext.Provider>
    )
}

export function useHotkeysContext() {
    const ctx = useContext(HotkeysContext)
    if (!ctx) throw new Error('useHotkeysContext must be used within HotkeysProvider')
    return ctx
}