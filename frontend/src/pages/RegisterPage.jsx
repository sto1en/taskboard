import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
    const nav = useNavigate()
    const { register } = useAuth()
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        displayName: '',
    })
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

    const onSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await register(form)
            nav('/boards')
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка регистрации')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__logo">TaskBoard</h1>
                <p className="auth__subtitle">Создайте аккаунт</p>

                <form onSubmit={onSubmit}>
                    <div className="auth__field">
                        <label className="auth__label">Логин</label>
                        <input
                            className="input"
                            value={form.username}
                            onChange={(e) => update('username', e.target.value)}
                            placeholder="от 3 до 32 символов"
                            minLength={3}
                            maxLength={32}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Имя</label>
                        <input
                            className="input"
                            value={form.displayName}
                            onChange={(e) => update('displayName', e.target.value)}
                            placeholder="Andrew M."
                            required
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Email</label>
                        <input
                            className="input"
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Пароль</label>
                        <input
                            className="input"
                            type="password"
                            value={form.password}
                            onChange={(e) => update('password', e.target.value)}
                            placeholder="минимум 6 символов"
                            minLength={6}
                            required
                        />
                    </div>

                    {error && <div className="auth__error">{error}</div>}

                    <button type="submit" className="btn btn-primary auth__submit" disabled={loading}>
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <p className="auth__footer">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    )
}