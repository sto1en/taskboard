import { useEffect, useState } from 'react'
import { adminApi } from '../../api/api'
import AdminCategoriesEditor from './AdminCategoriesEditor'
import AdminFramesList from './AdminFramesList'

export default function AdminFrameTab() {
    const [categories, setCategories] = useState([])
    const [frames, setFrames] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [c, f] = await Promise.all([
                adminApi.listFrameCategories(),
                adminApi.listFrames(),
            ])
            setCategories(c.data)
            setFrames(f.data)
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
                <>
                    <AdminCategoriesEditor
                        title="Типы рамок"
                        categories={categories}
                        countKey={null}
                        onCreate={(dto) => adminApi.createFrameCategory(dto)}
                        onUpdate={(id, dto) => adminApi.updateFrameCategory(id, dto)}
                        onDelete={(id) => adminApi.deleteFrameCategory(id)}
                        onReload={load}
                    />

                    <AdminFramesList
                        frames={frames}
                        categories={categories}
                        onReload={load}
                    />
                </>
            )}
        </div>
    )
}