import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api/api'
import AdminCategoriesEditor from './AdminCategoriesEditor'
import AdminTreesList from './AdminTreesList'

export default function AdminTreeTab() {
    const [categories, setCategories] = useState([])
    const [trees, setTrees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [c, t] = await Promise.all([
                adminApi.listTreeCategories(),
                adminApi.listTrees(),
            ])
            setCategories(c.data)
            setTrees(t.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    // В CategoryDto с бэка нет счётчика элементов, а админу полезно видеть,
    // сколько деревьев в каждом типе. Считаем на клиенте по уже загруженным данным.
    const categoriesWithCounts = useMemo(() => categories.map((cat) => ({
        ...cat,
        treeCount: trees.filter((tree) =>
            (tree.categories || []).some((c) => c.id === cat.id),
        ).length,
    })), [categories, trees])

    return (
        <div className="admin-avatar-tab">
            {error && <div className="profile-msg profile-msg--error">{error}</div>}
            {loading && <div className="loading">Загрузка...</div>}

            {!loading && (
                <>
                    <AdminCategoriesEditor
                        title="Типы деревьев"
                        categories={categoriesWithCounts}
                        countKey="treeCount"
                        onCreate={(dto) => adminApi.createTreeCategory(dto)}
                        onUpdate={(id, dto) => adminApi.updateTreeCategory(id, dto)}
                        onDelete={(id) => adminApi.deleteTreeCategory(id)}
                        onReload={load}
                    />

                    <AdminTreesList
                        trees={trees}
                        categories={categories}
                        onReload={load}
                    />
                </>
            )}
        </div>
    )
}
