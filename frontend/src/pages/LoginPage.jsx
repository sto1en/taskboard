import { Link } from 'react-router-dom'

export default function LoginPage() {
    const onSubmit = (e) => {
        e.preventDefault()
        console.log('login submit')
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__logo">TaskBoard</h1>
                <p className="auth__subtitle">Войдите в свой аккаунт</p>

                <form onSubmit={onSubmit}>
                    <div className="auth__field">
                        <label className="auth__label">Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            autoFocus
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Пароль</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth__submit">
                        Войти
                    </button>
                </form>

                <p className="auth__footer">
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    )
}