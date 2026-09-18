import { Link } from 'react-router-dom'

export default function RegisterPage() {
    const onSubmit = (e) => {
        e.preventDefault()
        console.log('register submit')
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__logo">TaskBoard</h1>
                <p className="auth__subtitle">Создайте аккаунт</p>

                <form onSubmit={onSubmit}>
                    <div className="auth__field">
                        <label className="auth__label">Имя</label>
                        <input
                            className="input"
                            placeholder="Ваше имя"
                            autoFocus
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label">Пароль</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="минимум 6 символов"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth__submit">
                        Зарегистрироваться
                    </button>
                </form>

                <p className="auth__footer">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    )
}