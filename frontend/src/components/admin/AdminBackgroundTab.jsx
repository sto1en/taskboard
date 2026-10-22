import { useEffect, useState } from 'react'
import { adminApi } from '../../api/api'
import AdminBackgroundsList from './AdminBackgroundsList'

export default function AdminBackgroundTab() {
    const [backgrounds, setBackgrounds] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await adminApi.listBackgrounds()
            setBackgrounds(Array.isArray(data) ? data : [])
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
            {loading && <div className="loading">Загрузка...</div>}

            {!loading && (
                <AdminBackgroundsList backgrounds={backgrounds} onReload={load}/>
            )}
        </div>
    )
}
