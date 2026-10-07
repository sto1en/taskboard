import { useEffect, useState } from 'react'
import { shopApi } from '../api/api'
import useT from '../hooks/useT'
import AvatarCard from '../components/Shop/AvatarCard'
import FrameCard from '../components/Shop/FrameCard'
import TreeSkinCard from '../components/Shop/TreeSkinCard'

export default function ShopPage() {
    const t = useT()
    const [tab, setTab] = useState('avatars')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = () => {
        setLoading(true)
        shopApi.get()
            .then(({ data }) => setData(data))
            .catch(err => setError(err.response?.data?.message || 'Ошибка загрузки'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const wrap = async (fn) => {
        try {
            const { data } = await fn()
            setData(data)
            window.dispatchEvent(new Event('shop:refresh'))
            window.dispatchEvent(new Event('user:refresh'))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

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
            </div>

            {loading && <div className="loading">{t.loading}</div>}
            {error && <div className="error">{error}</div>}

            {!loading && data && tab === 'avatars' && (
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
            )}

            {!loading && data && tab === 'frames' && (
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
        </div>
    )
}