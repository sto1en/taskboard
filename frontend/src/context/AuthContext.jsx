import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, userApi } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            setUser(null)
            setLoading(false)
            return
        }
        setLoading(true)
        userApi.me()
            .then(({ data }) => setUser(data))
            .catch(() => {
                localStorage.removeItem('token')
                setToken(null)
                setUser(null)
            })
            .finally(() => setLoading(false))
    }, [token])

    // Слушаем событие user:refresh — перезапрашиваем /users/me
    useEffect(() => {
        if (!token) return
        const reload = () => {
            userApi.me()
                .then(({ data }) => setUser(data))
                .catch(() => {})
        }
        window.addEventListener('user:refresh', reload)
        return () => window.removeEventListener('user:refresh', reload)
    }, [token])

    const login = async (username, password) => {
        const { data } = await authApi.login({ username, password })
        localStorage.setItem('token', data.token)
        setToken(data.token)
        return data
    }

    const register = async (payload) => {
        const { data } = await authApi.register(payload)
        localStorage.setItem('token', data.token)
        setToken(data.token)
        return data
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        window.location.href = '/login'
    }

    const updateUser = (patch) => setUser(prev => prev ? { ...prev, ...patch } : prev)

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}