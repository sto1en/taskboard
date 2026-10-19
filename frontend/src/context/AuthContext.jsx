import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    login as loginThunk,
    logout as logoutAction,
    register as registerThunk,
    selectAuthLoading,
    selectToken,
    selectUser,
    updateUser as updateUserAction,
} from '../store/slices/authSlice'

/**
 * Фасад над Redux-слайсом auth.
 *
 * Зачем фасад, а не прямые useSelector в компонентах: контракт useAuth
 * уже используется в 20 файлах ({ user, token, loading, login, register,
 * logout, updateUser }). Сохраняем его форму, чтобы миграция состояния в
 * Redux не задевала ни один компонент и оставалась проверяемой по шагам.
 *
 * Сам стейт теперь принадлежит Redux (store/slices/authSlice.js) — React-
 * контекст больше не хранит данные и как провайдер не нужен (Provider
 * подключён в main.jsx); модуль даёт только хук-фасад.
 *
 * ВАЖНО: хук НЕ инициирует загрузку профиля. Раньше здесь был
 * useEffect(() => dispatch(fetchMe())), из-за чего каждый компонент,
 * вызывавший useAuth()/useT(), отправлял свой GET /users/me. Первичная
 * загрузка профиля выполняется ровно один раз в ProtectedRoute (App.jsx).
 */
export function useAuth() {
    const dispatch = useDispatch()
    const user = useSelector(selectUser)
    const token = useSelector(selectToken)
    const loading = useSelector(selectAuthLoading)

    // Реакция на 401 от api.js (интерцептор чистит токен в localStorage).
    // Слушаем кастомное событие 'auth:unauthorized' как мост между axios
    // и стором — сам api.js не знает про Redux, чтобы не создавать
    // циклическую зависимость store <-> api.
    useEffect(() => {
        const onUnauthorized = () => dispatch(logoutAction())
        window.addEventListener('auth:unauthorized', onUnauthorized)
        return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
    }, [dispatch])

    const login = useCallback(
        (username, password) => dispatch(loginThunk({ username, password })).unwrap(),
        [dispatch],
    )

    const register = useCallback(
        (payload) => dispatch(registerThunk(payload)).unwrap(),
        [dispatch],
    )

    const logout = useCallback(() => {
        dispatch(logoutAction())
        window.location.href = '/login'
    }, [dispatch])

    const updateUser = useCallback(
        (patch) => dispatch(updateUserAction(patch)),
        [dispatch],
    )

    return { user, token, loading, login, register, logout, updateUser }
}

export default useAuth
