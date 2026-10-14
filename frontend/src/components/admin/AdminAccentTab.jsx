import { useEffect, useState } from 'react'
import { adminApi } from '../../api/api'
import AdminCategoriesEditor from './AdminCategoriesEditor'
import AdminAccentsList from './AdminAccentsList'

export default function AdminAccentTab() {
    const [categories, setCategories] = useState([])
    const [accents, setAccents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [c, a] = await Promise.all([
                adminApi.listAccentCategories(),
                adminApi.listAccents(),
            ])
            setCategories(c.data)
            setAccents(a.data)
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
                        title="Типы акцентов"
                        categories={categories}
                        countKey={null}
                        onCreate={(dto) => adminApi.createAccentCategory(dto)}
                        onUpdate={(id, dto) => adminApi.updateAccentCategory(id, dto)}
                        onDelete={(id) => adminApi.deleteAccentCategory(id)}
                        onReload={load}
                    />

                    <AdminAccentsList
                        accents={accents}
                        categories={categories}
                        onReload={load}
                    />
                </>
            )}
        </div>
    )
}