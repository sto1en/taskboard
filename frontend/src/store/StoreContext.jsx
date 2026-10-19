import { createContext } from 'react'
import { uiStore } from './uiStoreInstance'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
    return (
        <StoreContext.Provider value={uiStore}>{children}</StoreContext.Provider>
    )
}

export default StoreContext
