import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const nav = useNavigate()
    const { login } = useAuth()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const onSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await login(username, password)
            // После логина всегда — на календарь
            nav('/calendar', { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный логин или пароль')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__logo">TaskBoard</h1>
                <p className="auth__subtitle">Войдите в свой аккаунт</p>

                <form onSubmit={onSubmit}>
                    <div className="auth__field">
                        <label className="auth__label">Логин</label>
                        <input
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="andrew"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Пароль</label>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="auth__error">{error}</div>}

                    <button type="submit" className="btn btn-primary auth__submit" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="auth__footer">
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    )
}