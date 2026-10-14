import { useEffect, useState } from 'react'
import { adminApi } from '../../api/api'
import AdminAvatarCategories from './AdminAvatarCategories'
import AdminAvatarsList from './AdminAvatarsList'

export default function AdminAvatarTab() {
    const [categories, setCategories] = useState([])
    const [avatars, setAvatars] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [c, a] = await Promise.all([
                adminApi.listAvatarCategories(),
                adminApi.listAvatars(),
            ])
            setCategories(c.data)
            setAvatars(a.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    return (
        <div className="admin-avatar-tab">
            {error && <div className="profile-msg profile-msg--error">{error}</div>}

            <AdminAvatarCategories
                categories={categories}
                onReload={load}
            />

            <AdminAvatarsList
                avatars={avatars}
                categories={categories}
                onReload={load}
            />
        </div>
    )
}