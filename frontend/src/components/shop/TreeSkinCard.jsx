// frontend/src/components/shop/TreeSkinCard.jsx

/**
 * Карточка скина дерева.
 *
 * В превью — ленивая миниатюра настоящего дерева (TreeThumb): SVG грузится
 * только когда карточка попала в вьюпорт, поэтому сетка не тормозит.
 * По клику на миниатюру открывается большое превью (TreePreviewPopup).
 *
 * Бейдж «Куплено» живёт в общем ряду бейджей (см. .shop-card__badges),
 * чтобы не накладываться на «Новинку».
 */

import { useState } from 'react'
import ShopPrice from './ShopPrice'
import TreePreviewPopup from './TreePreviewPopup'
import TreeThumb from './TreeThumb'
import useT from '../../hooks/useT'

const NEW_DAYS = 7

function isNew(createdAt) {
    if (!createdAt) return false
    // createdAt приходит как "2026-10-12T14:00:00" без таймзоны — браузер
    // трактует это как локальное время, что для «Новинки за 7 дней» приемлемо.
    const created = new Date(createdAt).getTime()
    return Number.isFinite(created) && (Date.now() - created) < NEW_DAYS * 24 * 60 * 60 * 1000
}

export default function TreeSkinCard({ item, onBuy, onEquip, onUnequip }) {
    const t = useT()
    const owned = item.owned
    const active = item.active
    const free = !item.price || item.price === 0
    const [previewOpen, setPreviewOpen] = useState(false)

    const showNew = isNew(item.createdAt)

    return (
        <div
            className={`shop-card shop-card--tree ${active ? 'shop-card--active' : ''}`}
            data-tree={item.code}
        >
            {(showNew || owned || item.rewardOnly) && (
                <div className="shop-card__badges shop-card__badges--right">
                    {owned && (
                        <span className="shop-badge shop-badge--owned">{t.shopOwned}</span>
                    )}
                    {item.rewardOnly && (
                        <span className="shop-badge shop-badge--reward">{t.shopRewardOnly}</span>
                    )}
                    {showNew && <span className="shop-badge shop-badge--new">Новинка</span>}
                </div>
            )}

            <div className="shop-card__preview shop-card__preview--tree">
                <button
                    type="button"
                    className="tree-thumb"
                    onClick={() => setPreviewOpen(true)}
                    title={`${t.shopPreview}: ${item.title}`}
                    aria-label={`${t.shopPreview}: ${item.title}`}
                >
                    <TreeThumb kind={item.code}/>
                    <span className="tree-thumb__hint">{t.shopPreview}</span>
                </button>
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title">{item.title}</div>
                <div className="shop-card__desc">{item.description}</div>

                {item.categories && item.categories.length > 0 && (
                    <div className="shop-card__categories">
                        {item.categories.map(c => (
                            <span key={c.id} className="shop-card__category">
                                {c.title}
                            </span>
                        ))}
                    </div>
                )}

                <div className="shop-card__footer">
                    {!owned && item.rewardOnly && (
                        <span
                            className="shop-card__price shop-card__price--gift"
                            title={t.shopNotForSale}
                        >
                            🎁 {t.shopRewardOnly}
                        </span>
                    )}
                    {!owned && !item.rewardOnly && (
                        <>
                            <ShopPrice item={item}/>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                {free ? t.shopGet : t.shopBuy}
                            </button>
                        </>
                    )}
                    {owned && !active && (
                        <>
                            <ShopPrice item={item} owned/>
                            <button className="btn btn-primary shop-card__btn" onClick={onEquip}>
                                {t.shopEquip}
                            </button>
                        </>
                    )}
                    {owned && active && (
                        <>
                            <ShopPrice item={item} owned/>
                            <button className="btn btn-ghost shop-card__btn" onClick={onUnequip}>
                                {t.shopUnequip}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {previewOpen && (
                <TreePreviewPopup item={item} onClose={() => setPreviewOpen(false)}/>
            )}
        </div>
    )
}
