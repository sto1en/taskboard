import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
    const { user, logout } = useAuth()

    return (
        <div className="info-page">
            <h1 className="info-page__title">Settings</h1>

            <section className="info-page__section">
                <h2>Аккаунт</h2>
                <div className="settings-list">
                    <Link to="/profile" className="settings-item">
                        <div>
                            <div className="settings-item__title">Профиль</div>
                            <div className="settings-item__desc">Имя, аватар, описание</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile" className="settings-item" onClick={() => {}}>
                        <div>
                            <div className="settings-item__title">Безопасность</div>
                            <div className="settings-item__desc">Email и пароль</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile" className="settings-item">
                        <div>
                            <div className="settings-item__title">Внешний вид</div>
                            <div className="settings-item__desc">Тема, акцент, плотность</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile" className="settings-item">
                        <div>
                            <div className="settings-item__title">Уведомления</div>
                            <div className="settings-item__desc">Email, дедлайны, дайджест</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile" className="settings-item">
                        <div>
                            <div className="settings-item__title">Рабочее пространство</div>
                            <div className="settings-item__desc">Доска по умолчанию, пагинация</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>

                    <Link to="/profile" className="settings-item">
                        <div>
                            <div className="settings-item__title">Отображение</div>
                            <div className="settings-item__desc">Сортировка и вид проектов</div>
                        </div>
                        <span className="settings-item__arrow">→</span>
                    </Link>
                </div>
            </section>

            <section className="info-page__section">
                <h2>Сессия</h2>
                <p className="info-page__hint">
                    Вы вошли как <b>{user?.username}</b>
                </p>
                <button className="btn btn-ghost settings-logout" onClick={logout}>
                    Выйти из аккаунта
                </button>
            </section>

            <p className="info-page__back">
                <Link to="/boards">← Вернуться к доскам</Link>
            </p>
        </div>
    )
}