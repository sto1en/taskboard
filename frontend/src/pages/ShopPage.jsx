// frontend/src/pages/ShopPage.jsx

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { shopApi } from '../api/api'
import { fetchShop } from '../store/slices/shopSlice'
import useT from '../hooks/useT'
import { useAuth } from '../context/AuthContext'
import { formatPrice, resolveUrl } from '../utils/format'
import { prepareShopList } from '../utils/shopSort'
import AvatarCard from '../components/shop/AvatarCard'
import FrameCard from '../components/shop/FrameCard'
import TreeSkinCard from '../components/shop/TreeSkinCard'
import AccentCard from '../components/shop/AccentCard'
import BackgroundCard from '../components/shop/BackgroundCard'
import CategoryChips from '../components/shop/CategoryChips'
import SortToggle from '../components/shop/SortToggle'
import ShopEmptyState from '../components/shop/ShopEmptyState'
import ShopPagination from '../components/shop/ShopPagination'
import TreeThumb from '../components/shop/TreeThumb'
import AvatarArt from '../components/layout/AvatarArt'
import WeeklyGiftCard from '../components/shop/WeeklyGiftCard'
import ShopCartDrawer from '../components/shop/ShopCartDrawer'
import { cartTotal, readCart, toCartItem, writeCart } from '../utils/shopCart'

const PAGE_SIZE = 24

// Сортировка по умолчанию — «популярность + новые». Сбрасывается при каждом
// открытии магазина (это состояние живёт только в компоненте).
const DEFAULT_SORT = { sortBy: 'popular', sortDir: 'desc' }

// Хелпер: гарантирует массив, даже если с бэка пришёл null / не объект
const asArray = (v) => (Array.isArray(v) ? v : [])

const TABS = ['avatars', 'frames', 'trees', 'accents', 'backgrounds', 'chests']

const RARITY_LABELS = {
    common: 'Обычный',
    uncommon: 'Необычный',
    rare: 'Редкий',
    very_rare: 'Очень редкий',
}

export default function ShopPage() {
    const t = useT()
    const dispatch = useDispatch()
    const { user } = useAuth()
    const [tab, setTab] = useState('avatars')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [avatarCategories, setAvatarCategories] = useState([])
    const [frameCategories, setFrameCategories] = useState([])
    const [accentCategories, setAccentCategories] = useState([])
    const [treeCategories, setTreeCategories] = useState([])

    const [selectedAvatarCats, setSelectedAvatarCats] = useState([])
    const [selectedFrameCats, setSelectedFrameCats] = useState([])
    const [selectedTreeCats, setSelectedTreeCats] = useState([])
    const [selectedAccentCats, setSelectedAccentCats] = useState([])

    // Сервер понимает только «цену» и «популярность». «По типу» и «порядок»
    // разворачиваются на клиенте (см. utils/shopSort.js).
    const [sortBy, setSortBy] = useState(DEFAULT_SORT.sortBy)
    const [sortDir, setSortDir] = useState(DEFAULT_SORT.sortDir)

    const [page, setPage] = useState(0)

    // Сундуки — отдельный серверный ответ: ключи, прогресс и каталог.
    const [chests, setChests] = useState(null)
    const [chestsLoading, setChestsLoading] = useState(false)
    const [openingChest, setOpeningChest] = useState(null)
    const [chestResult, setChestResult] = useState(null)
    const [revealed, setRevealed] = useState(false)
    const [buyingKey, setBuyingKey] = useState(false)
    // Полный (нефильтрованный) каталог: по itemId берём картинку/название/цену
    // именно предмета магазина, даже если на вкладке активны фильтры.
    const [chestCatalog, setChestCatalog] = useState(null)
    const [chestAction, setChestAction] = useState(null)
    const chestBusyRef = useRef(false)

    // Подарок недели — отдельный лёгкий запрос, не часть каталога.
    const [weeklyGift, setWeeklyGift] = useState(null)
    const [claimingGift, setClaimingGift] = useState(false)

    // Корзина: набор позиций в localStorage + выдвижная панель.
    const [cart, setCart] = useState(() => readCart(user?.id))
    const [cartOpen, setCartOpen] = useState(false)
    const [checkingOut, setCheckingOut] = useState(false)
    const [cartError, setCartError] = useState(null)
    const [cartSuccess, setCartSuccess] = useState(null)

    // Смена аккаунта — своя корзина.
    useEffect(() => {
        setCart(readCart(user?.id))
        setCartSuccess(null)
        setCartError(null)
    }, [user?.id])

    useEffect(() => {
        let alive = true
        shopApi.weeklyGift()
            .then(({ data }) => { if (alive) setWeeklyGift(data) })
            .catch(() => {})
        return () => { alive = false }
    }, [])

    useEffect(() => {
        Promise.all([
            shopApi.avatarCategories().then(({ data }) => data).catch(() => []),
            shopApi.frameCategories().then(({ data }) => data).catch(() => []),
            shopApi.accentCategories().then(({ data }) => data).catch(() => []),
            shopApi.treeCategories().then(({ data }) => data).catch(() => []),
        ]).then(([ac, fc, acc, tc]) => {
            setAvatarCategories(asArray(ac))
            setFrameCategories(asArray(fc))
            setAccentCategories(asArray(acc))
            setTreeCategories(asArray(tc))
        })
    }, [])

    // Категории деревьев = типы. Приходят из отдельного публичного эндпоинта,
    // а id для фильтрации берём из самих предметов (categories[].id).
    const load = () => {
        setLoading(true)
        setError(null)

        const params = {}
        // Сервер умеет популярность и цену; «по типу»/«порядку» — клиентские,
        // но сортировку цены всё равно отдаём на бэк (там же стабильный порядок).
        if (sortBy === 'price') {
            params.sortBy = 'price'
            params.sortDir = sortDir
        } else if (sortBy === 'popular') {
            params.sortBy = 'popular'
            params.sortDir = 'desc'
        }
        if (selectedAvatarCats.length > 0) params.avatarCategoryIds = selectedAvatarCats
        if (selectedFrameCats.length > 0) params.frameCategoryIds = selectedFrameCats
        if (selectedAccentCats.length > 0) params.accentCategoryIds = selectedAccentCats

        shopApi.get(params)
            .then(({ data }) => {
                setData(data)
            })
            .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sortBy,
        sortDir,
        selectedAvatarCats.join(','),
        selectedFrameCats.join(','),
        selectedAccentCats.join(','),
    ])

    // Смена вкладки/фильтра/сортировки — всегда с первой страницы.
    useEffect(() => {
        setPage(0)
    }, [
        tab,
        sortBy,
        sortDir,
        selectedAvatarCats.join(','),
        selectedFrameCats.join(','),
        selectedTreeCats.join(','),
        selectedAccentCats.join(','),
    ])

    const wrap = async (fn) => {
        try {
            await fn()
            load()
            // Покупка/экипировка меняет и канонический стейт магазина
            // (баланс листьев, активные аватар/рамка/скин) для Sidebar и TopBar.
            dispatch(fetchShop())
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    const claimWeeklyGift = async () => {
        if (claimingGift || !weeklyGift?.canClaim) return
        setClaimingGift(true)
        try {
            const { data } = await shopApi.claimWeeklyGift()
            setWeeklyGift(data)
            // Предмет появился в инвентаре — обновляем каталог и сайдбар.
            load()
            dispatch(fetchShop())
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось получить подарок')
        } finally {
            setClaimingGift(false)
        }
    }

    // ---------- Корзина ----------
    const cartIndex = useMemo(
        () => new Set(cart.map(it => `${it.type}:${it.id}`)),
        [cart],
    )

    const inCart = (type, id) => cartIndex.has(`${type}:${id}`)

    const persistCart = (next) => {
        setCart(next)
        writeCart(user?.id, next)
    }

    const toggleCart = (item, type) => {
        setCartSuccess(null)
        setCartError(null)
        const key = `${type}:${item.id}`
        const next = cartIndex.has(key)
            ? cart.filter(it => `${it.type}:${it.id}` !== key)
            : [...cart, toCartItem(item, type)]
        persistCart(next)
    }

    const removeFromCart = (item) => {
        persistCart(cart.filter(it => !(it.type === item.type && String(it.id) === String(item.id))))
    }

    const clearCart = () => {
        setCartSuccess(null)
        setCartError(null)
        persistCart([])
    }

    // Купленное больше не предлагаем: если предмет появился в инвентаре
    // (купили в другой вкладке или он выдан за ачивку) — убираем из корзины.
    useEffect(() => {
        if (!data) return
        const owned = {
            avatar: new Set(asArray(data.avatars).filter(i => i.owned).map(i => String(i.id))),
            frame: new Set(asArray(data.frames).filter(i => i.owned).map(i => String(i.id))),
            tree: new Set(asArray(data.treeSkins).filter(i => i.owned).map(i => String(i.id))),
            accent: new Set(asArray(data.accents).filter(i => i.owned).map(i => String(i.id))),
            background: new Set(asArray(data.backgrounds).filter(i => i.owned).map(i => String(i.id))),
        }
        setCart(prev => {
            const next = prev.filter(it => !owned[it.type]?.has(String(it.id)))
            if (next.length === prev.length) return prev
            writeCart(user?.id, next)
            return next
        })
    }, [data, user?.id])

    const checkoutCart = async () => {
        if (checkingOut || cart.length === 0) return
        setCheckingOut(true)
        setCartError(null)
        setCartSuccess(null)
        try {
            const { data: result } = await shopApi.checkoutCart(
                cart.map(it => ({ type: it.type, id: it.id })),
            )
            persistCart([])
            if (result?.shop) setData(result.shop)
            setCartSuccess(t.cartCheckoutDone(result?.count ?? 0, formatPrice(result?.total ?? 0)))
            dispatch(fetchShop())
            // Каталог мог измениться (флаги owned/active) — тихо обновляем.
            load()
        } catch (err) {
            setCartError(err.response?.data?.message || 'Не удалось оформить покупку')
        } finally {
            setCheckingOut(false)
        }
    }

    // ---------- Сундуки ----------
    const loadChests = () => {
        setChestsLoading(true)
        shopApi.chests()
            .then(({ data }) => setChests(data))
            .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки сундуков'))
            .finally(() => setChestsLoading(false))
    }

    useEffect(() => {
        if (tab !== 'chests') return
        loadChests()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab])

    // Каталог без фильтров — источник истины для экрана награды.
    useEffect(() => {
        if (tab !== 'chests') return
        let alive = true
        shopApi.get()
            .then(({ data }) => { if (alive) setChestCatalog(data) })
            .catch(() => {})
        return () => { alive = false }
    }, [tab])

    // Анимация открытия: 1.3 с «крутим» сундук, затем показываем лут.
    useEffect(() => {
        if (!chestResult) return
        const id = setTimeout(() => setRevealed(true), 1300)
        return () => clearTimeout(id)
    }, [chestResult])

    const openChest = async (chest) => {
        if (openingChest) return
        setOpeningChest(chest.code)
        setChestResult(null)
        setRevealed(false)
        try {
            const { data } = await shopApi.openChest(chest.code)
            setChestResult(data)
            // После открытия обновляем витрину, баланс и сами сундуки.
            load()
            loadChests()
            dispatch(fetchShop())
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось открыть сундук')
            setOpeningChest(null)
        }
    }

    const closeChestResult = () => {
        setChestResult(null)
        setRevealed(false)
        setOpeningChest(null)
    }

    // Награда-предмет: ищем её в полном каталоге магазина по itemId+типу.
    // DTO сундука — только фолбэк, если предмет уже удалён из магазина.
    const chestReward = useMemo(() => {
        if (!chestResult || chestResult.rewardType !== 'item') return null

        const source = chestCatalog || data
        const lists = {
            avatar: asArray(source?.avatars),
            frame: asArray(source?.frames),
            tree: asArray(source?.treeSkins),
            accent: asArray(source?.accents),
            background: asArray(source?.backgrounds),
        }
        const matches = (item) => String(item.id) === String(chestResult.itemId)

        let type = chestResult.itemType && lists[chestResult.itemType] ? chestResult.itemType : null
        let item = type ? lists[type].find(matches) || null : null

        if (!item) {
            for (const key of Object.keys(lists)) {
                const found = lists[key].find(matches)
                if (found) {
                    item = found
                    type = key
                    break
                }
            }
        }

        return { item, type: type || chestResult.itemType || null }
    }, [chestResult, chestCatalog, data])

    const refreshAfterChest = () => {
        load()
        loadChests()
        dispatch(fetchShop())
    }

    // «Забрать» и «Получить листья» ничего не выдают: предмет уже выдан
    // (или листья за дубликат уже начислены) сервером при открытии сундука.
    const claimChestReward = () => {
        if (chestBusyRef.current) return
        chestBusyRef.current = true
        setChestAction('claim')
        closeChestResult()
        refreshAfterChest()
        setChestAction(null)
        chestBusyRef.current = false
    }

    const equipChestReward = async () => {
        if (chestBusyRef.current) return
        const type = chestReward?.type
        const id = chestResult?.itemId
        const equip = {
            avatar: shopApi.equipAvatar,
            frame: shopApi.equipFrame,
            tree: shopApi.equipTreeSkin,
            accent: shopApi.equipAccent,
            background: shopApi.equipBackground,
        }[type]

        if (!equip || id == null) {
            alert('Не удалось определить предмет')
            return
        }

        chestBusyRef.current = true
        setChestAction('equip')
        try {
            await equip(id)
            closeChestResult()
            refreshAfterChest()
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось надеть предмет')
        } finally {
            chestBusyRef.current = false
            setChestAction(null)
        }
    }

    const buyKey = async () => {
        if (buyingKey) return
        setBuyingKey(true)
        try {
            const { data } = await shopApi.buyKey()
            setChests(data)
            dispatch(fetchShop())
        } catch (err) {
            alert(err.response?.data?.message || 'Не удалось купить ключ')
        } finally {
            setBuyingKey(false)
        }
    }

    const resetActiveFilter = () => {
        if (tab === 'avatars') setSelectedAvatarCats([])
        else if (tab === 'frames') setSelectedFrameCats([])
        else if (tab === 'trees') setSelectedTreeCats([])
        else if (tab === 'accents') setSelectedAccentCats([])
    }

    const currentCategories = useMemo(() => {
        if (tab === 'avatars') return avatarCategories
        if (tab === 'frames') return frameCategories
        if (tab === 'trees') return treeCategories
        if (tab === 'accents') return accentCategories
        return []
    }, [tab, avatarCategories, frameCategories, treeCategories, accentCategories])

    const currentSelected = useMemo(() => {
        if (tab === 'avatars') return selectedAvatarCats
        if (tab === 'frames') return selectedFrameCats
        if (tab === 'trees') return selectedTreeCats
        if (tab === 'accents') return selectedAccentCats
        return []
    }, [tab, selectedAvatarCats, selectedFrameCats, selectedTreeCats, selectedAccentCats])

    const toggleCategory = (id) => {
        if (tab === 'avatars') {
            setSelectedAvatarCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        } else if (tab === 'frames') {
            setSelectedFrameCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        } else if (tab === 'trees') {
            setSelectedTreeCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        } else if (tab === 'accents') {
            setSelectedAccentCats(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )
        }
    }

    // Вытащим массивы один раз
    const avatars   = asArray(data?.avatars)
    const frames    = asArray(data?.frames)
    const treeSkins = asArray(data?.treeSkins)
    const accents   = asArray(data?.accents)
    const backgrounds = asArray(data?.backgrounds)

    // Фильтр деревьев по типу (сервер дерево-категории не фильтрует:
    // /shop отдаёт все, поэтому фильтруем здесь — это дешевле запроса).
    const filteredTrees = useMemo(() => {
        if (selectedTreeCats.length === 0) return treeSkins
        return treeSkins.filter(s =>
            (s.categories || []).some(c => selectedTreeCats.includes(c.id))
        )
    }, [treeSkins, selectedTreeCats])

    const rawList = useMemo(() => {
        if (tab === 'avatars') return avatars
        if (tab === 'frames') return frames
        if (tab === 'trees') return filteredTrees
        if (tab === 'accents') return accents
        if (tab === 'backgrounds') return backgrounds
        return []
    }, [tab, avatars, frames, filteredTrees, accents, backgrounds])

    // Подготовка списка: сортировка + размножение карточек по типам.
    // «Прочее» передаём на языке интерфейса — от него зависит буквенный блок.
    const rows = useMemo(
        () => prepareShopList(rawList, sortBy, sortDir, t.shopMiscType),
        [rawList, sortBy, sortDir, t.shopMiscType],
    )

    const start = page * PAGE_SIZE
    const pageRows = rows.slice(start, start + PAGE_SIZE)

    const activeAvatar = avatars.find(a => a.active) || null
    const activeFrame = frames.find(f => f.active) || null
    const userDisplayName = user?.profile?.displayName || user?.username

    const hasFilter = currentSelected.length > 0

    const emptyMessage = (() => {
        if (tab === 'avatars') return 'Нет аватарок в этой категории'
        if (tab === 'frames') return 'Нет рамок в этой категории'
        if (tab === 'trees') return 'Нет деревьев в этой категории'
        if (tab === 'backgrounds') return 'Фоны скоро появятся'
        return 'Нет акцентов в этой категории'
    })()

    const cartType = { avatars: 'avatar', frames: 'frame', trees: 'tree', accents: 'accent', backgrounds: 'background' }[tab]

    const renderRow = ({ item, key }) => {
        const cartProps = cartType
            ? {
                onAddToCart: () => toggleCart(item, cartType),
                inCart: inCart(cartType, item.id),
            }
            : {}

        if (tab === 'avatars') {
            return (
                <AvatarCard
                    key={key}
                    item={item}
                    userFrame={activeFrame}
                    onBuy={() => wrap(() => shopApi.buyAvatar(item.id))}
                    onEquip={() => wrap(() => shopApi.equipAvatar(item.id))}
                    {...cartProps}
                />
            )
        }
        if (tab === 'frames') {
            return (
                <FrameCard
                    key={key}
                    item={item}
                    userAvatar={activeAvatar}
                    userDisplayName={userDisplayName}
                    userUsername={user?.username}
                    onBuy={() => wrap(() => shopApi.buyFrame(item.id))}
                    onEquip={() => wrap(() => shopApi.equipFrame(item.id))}
                    onUnequip={() => wrap(() => shopApi.unequipFrame())}
                    {...cartProps}
                />
            )
        }
        if (tab === 'trees') {
            return (
                <TreeSkinCard
                    key={key}
                    item={item}
                    onBuy={() => wrap(() => shopApi.buyTreeSkin(item.id))}
                    onEquip={() => wrap(() => shopApi.equipTreeSkin(item.id))}
                    onUnequip={() => wrap(() => shopApi.unequipTreeSkin())}
                    {...cartProps}
                />
            )
        }
        if (tab === 'backgrounds') {
            return (
                <BackgroundCard
                    key={key}
                    item={item}
                    onBuy={() => wrap(() => shopApi.buyBackground(item.id))}
                    onEquip={() => wrap(() => shopApi.equipBackground(item.id))}
                    {...cartProps}
                />
            )
        }
        return (
            <AccentCard
                key={key}
                item={item}
                onBuy={() => wrap(() => shopApi.buyAccent(item.id))}
                onEquip={() => wrap(() => shopApi.equipAccent(item.id))}
                onUnequip={() => wrap(() => shopApi.unequipAccent())}
                {...cartProps}
            />
        )
    }

    const tabCount = (list) => list.length > 0 && (
        <span className="shop__tab-count">{list.length}</span>
    )

    // Поля награды: магазин — источник истины, DTO — фолбэк.
    const chestItem = chestReward?.item || null
    const chestItemType = chestReward?.type || null
    const chestTitle = chestItem?.title || chestResult?.title
    const chestDesc = chestItem?.description || chestResult?.description
    const chestImage = chestItem?.imageUrl || chestResult?.imageUrl
    const chestEmoji = chestItem?.emoji || chestResult?.emoji || '🎁'
    const chestPrice = chestItem?.price ?? chestResult?.price ?? null
    const chestRarityLabel = RARITY_LABELS[chestResult?.rarity] || 'Предмет'
    const duplicateLeaves = chestResult?.duplicateLeaves ?? chestPrice ?? 0
    const chestBusy = Boolean(chestAction)

    // Награда-аватарка: сначала картинка, затем нарисованный SVG по code,
    // затем emoji. Для деревьев — TreeThumb, для остального — картинка/emoji.
    const chestArt = (() => {
        if (chestItemType === 'tree' && chestItem?.code) {
            return <TreeThumb kind={chestItem.code} size={92}/>
        }
        if (chestItemType === 'avatar') {
            return (
                <div className="avatar-frame chest-result__avatar">
                    <AvatarArt
                        avatar={{
                            code: chestItem?.code,
                            imageUrl: chestImage,
                            emoji: chestItem?.emoji || chestEmoji,
                            title: chestTitle,
                        }}
                        emojiSize={52}
                    />
                </div>
            )
        }
        if (chestImage) {
            return (
                <img
                    src={resolveUrl(chestImage)}
                    alt={chestTitle || 'Награда'}
                    className="chest-result__img"
                />
            )
        }
        return <span className="chest-result__emoji">{chestEmoji}</span>
    })()

    return (
        <div className="shop">
            <div className="shop__head">
                <h1 className="shop__title">Магазин</h1>
                <div className="shop__head-right">
                    {data && (
                        <div className="shop__balance" title={t.shopLeaves}>
                            🍃 <b>{formatPrice(data.leaves ?? 0)}</b>
                        </div>
                    )}
                </div>
            </div>

            <WeeklyGiftCard
                gift={weeklyGift}
                claiming={claimingGift}
                onClaim={claimWeeklyGift}
                userAvatar={activeAvatar}
                userDisplayName={userDisplayName}
                userUsername={user?.username}
            />

            <div className="shop__tabs">
                <button className={`shop__tab ${tab === 'avatars' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab(TABS[0])}>
                    Аватарки {tabCount(avatars)}
                </button>
                <button className={`shop__tab ${tab === 'frames' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab(TABS[1])}>
                    Рамки {tabCount(frames)}
                </button>
                <button className={`shop__tab ${tab === 'trees' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab(TABS[2])}>
                    Деревья {tabCount(treeSkins)}
                </button>
                <button className={`shop__tab ${tab === 'accents' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab(TABS[3])}>
                    Акценты {tabCount(accents)}
                </button>
                <button className={`shop__tab ${tab === 'backgrounds' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab(TABS[4])}>
                    Фоны {tabCount(backgrounds)}
                </button>
                <button className={`shop__tab ${tab === 'chests' ? 'shop__tab--active' : ''}`}
                        onClick={() => setTab(TABS[5])}>
                    Сундуки
                </button>
            </div>

            {tab === 'chests' ? (
                <div className="chests">
                    <div className="chests__bar">
                        <div className="chests__keys">
                            <span className="chests__keys-icon">🔑</span>
                            <b>{chests?.keys ?? 0}</b>
                            <span className="chests__keys-label">ключей</span>
                        </div>
                        <div className="chests__progress">
                            <div className="chests__progress-text">
                                {chests?.keyProgress ?? 0} / {chests?.keyGoal ?? 15} задач
                            </div>
                            <div className="chests__progress-track">
                                <span
                                    style={{
                                        width: `${Math.min(100, ((chests?.keyProgress ?? 0) / (chests?.keyGoal || 15)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-ghost chests__buy-key"
                            onClick={buyKey}
                            disabled={buyingKey || (chests?.leaves ?? 0) < (chests?.keyPrice ?? 150)}
                            title="Купить ключ за листья"
                        >
                            🔑 Купить ключ · {chests?.keyPrice ?? 150} 🍃
                        </button>
                    </div>

                    {chestsLoading && <div className="loading">{t.loading}</div>}
                    {!chestsLoading && !chests && (
                        <ShopEmptyState message="Сундуки недоступны" />
                    )}

                    {!chestsLoading && chests && (
                        <div className="chests__grid">
                            {(chests.chests || []).map(chest => (
                                <div key={chest.code} className="chest-card">
                                    <div className="chest-card__icon">{chest.icon || '🎁'}</div>
                                    <div className="chest-card__title">{chest.title}</div>
                                    <div className="chest-card__desc">{chest.description}</div>
                                    <div className="chest-card__footer">
                                        <div className="chest-card__price">
                                            {chest.currency === 'key'
                                                ? <>🔑 {chest.price}</>
                                                : <>🍃 {formatPrice(chest.price)}</>}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary chest-card__btn"
                                            onClick={() => openChest(chest)}
                                            disabled={!chest.available || Boolean(openingChest)}
                                        >
                                            Открыть
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="shop__toolbar">
                        {currentCategories.length > 0 && (
                            <CategoryChips
                                categories={currentCategories}
                                selectedIds={currentSelected}
                                onToggle={toggleCategory}
                                onClearAll={resetActiveFilter}
                                allLabel={t.shopTypeAll}
                            />
                        )}
                        <SortToggle
                            sortBy={sortBy}
                            sortDir={sortDir}
                            onChange={(sb, sd) => {
                                setSortBy(sb)
                                setSortDir(sd)
                            }}
                        />
                    </div>
                </>
            )}

            {tab !== 'chests' && loading && <div className="loading">{t.loading}</div>}
            {error && <div className="error">{error}</div>}

            {tab !== 'chests' && !loading && !data && (
                <ShopEmptyState message="Магазин недоступен" />
            )}

            {tab !== 'chests' && !loading && data && rows.length === 0 && (
                <ShopEmptyState
                    onReset={hasFilter ? resetActiveFilter : null}
                    message={emptyMessage}
                />
            )}

            {tab !== 'chests' && !loading && data && rows.length > 0 && (
                <>
                    <div className="shop__grid">
                        {pageRows.map(renderRow)}
                    </div>
                    <ShopPagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        total={rows.length}
                        onChange={setPage}
                    />
                </>
            )}

            {(openingChest || chestResult) && (
                <div className="chest-modal" onClick={closeChestResult}>
                    <div className="chest-modal__dialog" onClick={e => e.stopPropagation()}>
                        {!revealed || !chestResult ? (
                            <div className="chest-reveal">
                                <div className="chest-reveal__box">🎁</div>
                                <div className="chest-reveal__text">Сундук открывается…</div>
                            </div>
                        ) : (
                            <div className={`chest-result chest-result--${chestResult.rewardType} ${chestResult.rarity ? `chest-result--${chestResult.rarity}` : ''} ${chestResult.owned ? 'chest-result--owned' : ''}`}>
                                {chestResult.rewardType === 'leaves' ? (
                                    <>
                                        <div className="chest-result__rarity">Лесные дары</div>

                                        <div className="chest-result__art">
                                            <span className="chest-result__emoji">{chestResult.emoji || '🍃'}</span>
                                        </div>

                                        <div className="chest-result__title">{chestResult.title}</div>
                                        {chestResult.description && (
                                            <div className="chest-result__desc">{chestResult.description}</div>
                                        )}
                                        <div className="chest-result__amount">+{chestResult.leaves} 🍃</div>

                                        <button
                                            type="button"
                                            className="btn btn-primary chest-result__btn"
                                            onClick={claimChestReward}
                                            disabled={chestBusy}
                                        >
                                            Забрать
                                        </button>
                                    </>
                                ) : chestResult.owned ? (
                                    <>
                                        <span className="chest-result__owned-tag">{t.shopOwned}</span>

                                        <div className="chest-result__art">
                                            {chestArt}
                                        </div>

                                        <div className="chest-result__title">{chestTitle}</div>
                                        <span className="chest-result__rarity-tag">{chestRarityLabel}</span>
                                        {chestDesc && (
                                            <div className="chest-result__desc">{chestDesc}</div>
                                        )}
                                        <div className="chest-result__duplicate">
                                            +{formatPrice(duplicateLeaves)} 🍃
                                        </div>

                                        <div className="chest-result__actions">
                                            <button
                                                type="button"
                                                className="btn btn-primary chest-result__btn"
                                                onClick={equipChestReward}
                                                disabled={chestBusy}
                                            >
                                                {t.shopEquip}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn chest-result__btn chest-result__btn--leaves"
                                                onClick={claimChestReward}
                                                disabled={chestBusy}
                                            >
                                                Получить листья
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="chest-result__rarity">{chestRarityLabel}</div>

                                        <div className="chest-result__art">
                                            {chestArt}
                                        </div>

                                        <div className="chest-result__title">{chestTitle}</div>
                                        {chestDesc && (
                                            <div className="chest-result__desc">{chestDesc}</div>
                                        )}
                                        {chestPrice != null && (
                                            <div className="chest-result__price">🍃 {formatPrice(chestPrice)}</div>
                                        )}

                                        <div className="chest-result__actions">
                                            <button
                                                type="button"
                                                className="btn btn-primary chest-result__btn"
                                                onClick={claimChestReward}
                                                disabled={chestBusy}
                                            >
                                                Забрать
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost chest-result__btn"
                                                onClick={equipChestReward}
                                                disabled={chestBusy}
                                            >
                                                {t.shopEquip}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                type="button"
                className={`shop-cart-fab ${cart.length > 0 ? 'shop-cart-fab--active' : ''}`}
                onClick={() => setCartOpen(true)}
                title={t.cartOpen}
                aria-label={t.cartOpen}
            >
                <span className="shop-cart-fab__icon" aria-hidden="true">🛒</span>
                {cart.length > 0 && (
                    <>
                        <span className="shop-cart-fab__count">{cart.length}</span>
                        <span className="shop-cart-fab__sum">🍃 {formatPrice(cartTotal(cart))}</span>
                    </>
                )}
            </button>

            <ShopCartDrawer
                open={cartOpen}
                items={cart}
                leaves={data?.leaves ?? 0}
                busy={checkingOut}
                error={cartError}
                success={cartSuccess}
                onClose={() => setCartOpen(false)}
                onRemove={removeFromCart}
                onClear={clearCart}
                onCheckout={checkoutCart}
            />
        </div>
    )
}
