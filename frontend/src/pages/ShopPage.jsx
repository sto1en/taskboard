// frontend/src/pages/ShopPage.jsx

import { useEffect, useMemo, useState } from 'react'
import { shopApi, adminApi } from '../api/api'
import useT from '../hooks/useT'
import { useAuth } from '../context/AuthContext'
import AvatarCard from '../components/Shop/AvatarCard'
import FrameCard from '../components/Shop/FrameCard'
import TreeSkinCard from '../components/Shop/TreeSkinCard'
import AccentCard from '../components/Shop/AccentCard'
import CategoryChips from '../components/Shop/CategoryChips'
import SortToggle from '../components/Shop/SortToggle'
import ShopEmptyState from '../components/Shop/ShopEmptyState'
import ShopPagination from '../components/Shop/ShopPagination'

const PAGE_SIZE = 24

// Хелпер: гарантирует массив, даже если с бэка пришёл null / не объект
const asArray = (v) => (Array.isArray(v) ? v : [])

export default function ShopPage() {
    const t = useT()
    const { user } = useAuth()
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

    const [pageAvatars, setPageAvatars] = useState(0)
    const [pageFrames, setPageFrames] = useState(0)
    const [pageTrees, setPageTrees] = useState(0)
    const [pageAccents, setPageAccents] = useState(0)

    useEffect(() => {
        Promise.all([
            adminApi.listAvatarCategories().then(({ data }) => data).catch(() => []),
            adminApi.listFrameCategories().then(({ data }) => data).catch(() => []),
            adminApi.listAccentCategories().then(({ data }) => data).catch(() => []),
        ]).then(([ac, fc, acc]) => {
            setAvatarCategories(asArray(ac))
            setFrameCategories(asArray(fc))
            setAccentCategories(asArray(acc))
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
            .then(({ data }) => {
                // Диагностика — раскомментируй, если хочешь проверить структуру
                // console.log('[Shop] API response:', data)
                setData(data)
            })
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

    useEffect(() => {
        setPageAvatars(0)
        setPageFrames(0)
        setPageTrees(0)
        setPageAccents(0)
    }, [
        tab,
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

    const paginate = (arr, page) => {
        const list = asArray(arr)
        const start = page * PAGE_SIZE
        return list.slice(start, start + PAGE_SIZE)
    }

    const showFilters = tab === 'avatars' || tab === 'frames' || tab === 'accents'
    const hasFilter = currentSelected.length > 0

    // Вытащим массивы один раз
    const avatars   = asArray(data?.avatars)
    const frames    = asArray(data?.frames)
    const treeSkins = asArray(data?.treeSkins)
    const accents   = asArray(data?.accents)

    const activeAvatar = avatars.find(a => a.active) || null
    const userDisplayName = user?.profile?.displayName || user?.username

    return (
        <div className="shop">
            <div className="shop__head">
                <h1 className="shop__title">Магазин</h1>
                {data && (
                    <div className="shop__balance" title="Листья">
                        🍃 <b>{data.leaves ?? 0}</b>
                    </div>
                )}
            </div>

            <div className="shop__tabs">
                <button className={`shop__tab ${tab === 'avatars' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('avatars')}>
                    Аватарки {avatars.length > 0 && <span className="shop__tab-count">{avatars.length}</span>}
                </button>
                <button className={`shop__tab ${tab === 'frames' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('frames')}>
                    Рамки {frames.length > 0 && <span className="shop__tab-count">{frames.length}</span>}
                </button>
                <button className={`shop__tab ${tab === 'trees' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('trees')}>
                    Деревья {treeSkins.length > 0 && <span className="shop__tab-count">{treeSkins.length}</span>}
                </button>
                <button className={`shop__tab ${tab === 'accents' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab('accents')}>
                    Акценты {accents.length > 0 && <span className="shop__tab-count">{accents.length}</span>}
                </button>
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

            {!loading && !data && (
                <ShopEmptyState message="Магазин недоступен" />
            )}

            {/* ==== AVATARS ==== */}
            {!loading && data && tab === 'avatars' && (
                avatars.length === 0 ? (
                    <ShopEmptyState
                        onReset={hasFilter ? resetActiveFilter : null}
                        message="Нет аватарок в этой категории"
                    />
                ) : (
                    <>
                        <div className="shop__grid">
                            {paginate(avatars, pageAvatars).map(a => (
                                <AvatarCard
                                    key={a.id}
                                    item={a}
                                    onBuy={() => wrap(() => shopApi.buyAvatar(a.id))}
                                    onEquip={() => wrap(() => shopApi.equipAvatar(a.id))}
                                />
                            ))}
                        </div>
                        <ShopPagination
                            page={pageAvatars}
                            pageSize={PAGE_SIZE}
                            total={avatars.length}
                            onChange={setPageAvatars}
                        />
                    </>
                )
            )}

            {/* ==== FRAMES ==== */}
            {!loading && data && tab === 'frames' && (
                frames.length === 0 ? (
                    <ShopEmptyState
                        onReset={hasFilter ? resetActiveFilter : null}
                        message="Нет рамок в этой категории"
                    />
                ) : (
                    <>
                        <div className="shop__grid">
                            {paginate(frames, pageFrames).map(f => (
                                <FrameCard
                                    key={f.id}
                                    item={f}
                                    userAvatar={activeAvatar}
                                    userDisplayName={userDisplayName}
                                    userUsername={user?.username}
                                    onBuy={() => wrap(() => shopApi.buyFrame(f.id))}
                                    onEquip={() => wrap(() => shopApi.equipFrame(f.id))}
                                    onUnequip={() => wrap(() => shopApi.unequipFrame())}
                                />
                            ))}
                        </div>
                        <ShopPagination
                            page={pageFrames}
                            pageSize={PAGE_SIZE}
                            total={frames.length}
                            onChange={setPageFrames}
                        />
                    </>
                )
            )}

            {/* ==== TREES ==== */}
            {!loading && data && tab === 'trees' && (
                treeSkins.length === 0 ? (
                    <ShopEmptyState message="Нет деревьев" />
                ) : (
                    <>
                        <div className="shop__grid">
                            {paginate(treeSkins, pageTrees).map(s => (
                                <TreeSkinCard
                                    key={s.id}
                                    item={s}
                                    onBuy={() => wrap(() => shopApi.buyTreeSkin(s.id))}
                                    onEquip={() => wrap(() => shopApi.equipTreeSkin(s.id))}
                                    onUnequip={() => wrap(() => shopApi.unequipTreeSkin())}
                                />
                            ))}
                        </div>
                        <ShopPagination
                            page={pageTrees}
                            pageSize={PAGE_SIZE}
                            total={treeSkins.length}
                            onChange={setPageTrees}
                        />
                    </>
                )
            )}

            {/* ==== ACCENTS ==== */}
            {!loading && data && tab === 'accents' && (
                accents.length === 0 ? (
                    <ShopEmptyState
                        onReset={hasFilter ? resetActiveFilter : null}
                        message="Нет акцентов в этой категории"
                    />
                ) : (
                    <>
                        <div className="shop__grid">
                            {paginate(accents, pageAccents).map(a => (
                                <AccentCard
                                    key={a.id}
                                    item={a}
                                    onBuy={() => wrap(() => shopApi.buyAccent(a.id))}
                                    onEquip={() => wrap(() => shopApi.equipAccent(a.id))}
                                    onUnequip={() => wrap(() => shopApi.unequipAccent())}
                                />
                            ))}
                        </div>
                        <ShopPagination
                            page={pageAccents}
                            pageSize={PAGE_SIZE}
                            total={accents.length}
                            onChange={setPageAccents}
                        />
                    </>
                )
            )}
        </div>
    )
}