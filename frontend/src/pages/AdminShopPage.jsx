import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminApi } from '../api/api'
import useT from '../hooks/useT'
import AdminAvatarTab from '../components/admin/AdminAvatarTab'

export default function AdminShopPage() {
    const { user } = useAuth()
    const nav = useNavigate()
    const t = useT()

    const [tab, setTab] = useState('avatars')

    // Простая защита на фронте. На бэке — отдельная проверка.
    useEffect(() => {
        if (user && !user.isAdmin) {
            nav('/', { replace: true })
        }
    }, [user, nav])

    if (!user?.isAdmin) {
        return <div className="loading">Доступ запрещён</div>
    }

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <h1 className="admin-page__title">Админка магазина</h1>
            </div>

            <div className="admin-page__tabs">
                <button
                    className={`admin-tab ${tab === 'avatars' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('avatars')}
                >
                    Аватарки
                </button>
                <button
                    className={`admin-tab ${tab === 'frames' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('frames')}
                    disabled
                >
                    Рамки (скоро)
                </button>
                <button
                    className={`admin-tab ${tab === 'accents' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('accents')}
                    disabled
                >
                    Цвета (скоро)
                </button>
                <button
                    className={`admin-tab ${tab === 'trees' ? 'admin-tab--active' : ''}`}
                    onClick={() => setTab('trees')}
                    disabled
                >
                    Деревья (скоро)
                </button>
            </div>

            <div className="admin-page__body">
                {tab === 'avatars' && <AdminAvatarTab />}
            </div>
        </div>
    )
}