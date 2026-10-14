import { useEffect, useMemo, useState } from 'react'
import { shopApi, adminApi } from '../api/api'
import useT from '../hooks/useT'
import AvatarCard from '../components/Shop/AvatarCard'
import FrameCard from '../components/Shop/FrameCard'
import TreeSkinCard from '../components/Shop/TreeSkinCard'
import AccentCard from '../components/Shop/AccentCard'
import CategoryChips from '../components/Shop/CategoryChips'
import SortToggle from '../components/Shop/SortToggle'
import ShopEmptyState from '../components/Shop/ShopEmptyState'

export default function ShopPage() {
    const t = useT()
    const [tab, setTab] = useState('avatars')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [avatarCategories, setAvatarCategories] = useState([])
    const [frameCategories, setFrameCategories] = useState([])
    const [accentCategories, setAccentCategories] = useState([])

    const [selectedAvatarCats, setSelectedAvatarCats] = useState([])
    const [selectedFrameCats, setSelectedFrameCats] = useState([])
    const [selectedAccentCats, setSelectedAccentCats] = useState([])

    const [sortBy, setSortBy] = useState('default')
    const [sortDir, setSortDir] = useState('asc')

    useEffect(() => {
        Promise.all([
            adminApi.listAvatarCategories().then(({ data }) => data).catch(() => []),
            adminApi.listFrameCategories().then(({ data }) => data).catch(() => []),
            adminApi.listAccentCategories().then(({ data }) => data).catch(() => []),
        ]).then(([ac, fc, acc]) => {
            setAvatarCategories(ac)
            setFrameCategories(fc)
            setAccentCategories(acc)
        })
    }, [])

    const load = () => {
        setLoading(true)
        setError(null)

        const params = {}
        if (sortBy !== 'default') {
            params.sortBy = sortBy
            params.sortDir = sortDir
        }
        if (selectedAvatarCats.length > 0) params.avatarCategoryIds = selectedAvatarCats
        if (selectedFrameCats.length > 0) params.frameCategoryIds = selectedFrameCats
        if (selectedAccentCats.length > 0) params.accentCategoryIds = selectedAccentCats

        shopApi.get(params)
            .then(({ data }) => setData(data))
            .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line
    }, [
        sortBy,
        sortDir,
        selectedAvatarCats.join(','),
        selectedFrameCats.join(','),
        selectedAccentCats.join(','),
    ])

    const wrap = async (fn) => {
        try {
            await fn()
            load()
            window.dispatchEvent(new Event('shop:refresh'))
            window.dispatchEvent(new Event('user:refresh'))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const resetActiveFilter = () => {
        if (tab === 'avatars') setSelectedAvatarCats([])
        else if (tab === 'frames') setSelectedFrameCats([])
        else if (tab === 'accents') setSelectedAccentCats([])
    }

    const currentCategories = useMemo(() => {
        if (tab === 'avatars') return avatarCategories
        if (tab === 'frames') return frameCategories
        if (tab === 'accents') return accentCategories
        return []
    }, [tab, avatarCategories, frameCategories, accentCategories])

    const currentSelected = useMemo(() => {
        if (tab === 'avatars') return selectedAvatarCats
        if (tab === 'frames') return selectedFrameCats
        if (tab === 'accents') return selectedAccentCats
        return []
    }, [tab, selectedAvatarCats, selectedFrameCats, selectedAccentCats])

    const toggleCategory = (id) => {
        if (tab === 'avatars') {
            setSelectedAvatarCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        } else if (tab === 'frames') {
            setSelectedFrameCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        } else if (tab === 'accents') {
            setSelectedAccentCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        }
    }

    const showFilters = tab === 'avatars' || tab === 'frames' || tab === 'accents'
    const hasFilter = currentSelected.length > 0

    return (
        <div className="shop">
            <div className="shop__head">
                <h1 className="shop__title">Магазин</h1>
                {data && (
                    <div className="shop__balance" title="Листья">
                        🍃 <b>{data.leaves}</b>
                    </div>
                )}
            </div>

            <div className="shop__tabs">
                <button className={`shop__tab ${tab === 'avatars' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('avatars')}>Аватарки</button>
                <button className={`shop__tab ${tab === 'frames' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('frames')}>Рамки</button>
                <button className={`shop__tab ${tab === 'trees' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('trees')}>Деревья</button>
                <button className={`shop__tab ${tab === 'accents' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('accents')}>Акценты</button>
            </div>

            {showFilters && (
                <div className="shop__toolbar">
                    <CategoryChips
                        categories={currentCategories}
                        selectedIds={currentSelected}
                        onToggle={toggleCategory}
                        onClearAll={resetActiveFilter}
                        allLabel="Все"
                    />
                    <SortToggle
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onChange={(sb, sd) => {
                            setSortBy(sb)
                            setSortDir(sd)
                        }}
                    />
                </div>
            )}

            {loading && <div className="loading">{t.loading}</div>}
            {error && <div className="error">{error}</div>}

            {!loading && data && tab === 'avatars' && (
                data.avatars.length === 0 ? (
                    <ShopEmptyState
                        onReset={hasFilter ? resetActiveFilter : null}
                        message="Нет аватарок в этой категории"
                    />
                ) : (
                    <div className="shop__grid">
                        {data.avatars.map(a => (
                            <AvatarCard
                                key={a.id}
                                item={a}
                                onBuy={() => wrap(() => shopApi.buyAvatar(a.id))}
                                onEquip={() => wrap(() => shopApi.equipAvatar(a.id))}
                            />
                        ))}
                    </div>
                )
            )}

            {!loading && data && tab === 'frames' && (
                data.frames.length === 0 ? (
                    <ShopEmptyState
                        onReset={hasFilter ? resetActiveFilter : null}
                        message="Нет рамок в этой категории"
                    />
                ) : (
                    <div className="shop__grid">
                        {data.frames.map(f => (
                            <FrameCard
                                key={f.id}
                                item={f}
                                onBuy={() => wrap(() => shopApi.buyFrame(f.id))}
                                onEquip={() => wrap(() => shopApi.equipFrame(f.id))}
                                onUnequip={() => wrap(() => shopApi.unequipFrame())}
                            />
                        ))}
                    </div>
                )
            )}

            {!loading && data && tab === 'trees' && (
                <div className="shop__grid">
                    {data.treeSkins.map(s => (
                        <TreeSkinCard
                            key={s.id}
                            item={s}
                            onBuy={() => wrap(() => shopApi.buyTreeSkin(s.id))}
                            onEquip={() => wrap(() => shopApi.equipTreeSkin(s.id))}
                            onUnequip={() => wrap(() => shopApi.unequipTreeSkin())}
                        />
                    ))}
                </div>
            )}

            {!loading && data && tab === 'accents' && (
                data.accents.length === 0 ? (
                    <ShopEmptyState
                        onReset={hasFilter ? resetActiveFilter : null}
                        message="Нет акцентов в этой категории"
                    />
                ) : (
                    <div className="shop__grid">
                        {(data.accents || []).map(a => (
                            <AccentCard
                                key={a.id}
                                item={a}
                                onBuy={() => wrap(() => shopApi.buyAccent(a.id))}
                                onEquip={() => wrap(() => shopApi.equipAccent(a.id))}
                                onUnequip={() => wrap(() => shopApi.unequipAccent())}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    )
}