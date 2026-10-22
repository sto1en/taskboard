import AvatarArt from '../layout/AvatarArt'
import TreeThumb from '../shop/TreeThumb'
import { accentVars } from '../shop/ShopPreview'

/**
 * Компактное превью предмета магазина для админки подарков недели.
 *
 * Не тянет целые ShopCard: в списке выбора и в «корзине» нужны только
 * иконки, поэтому для каждого типа рисуем ровно то, что его отличает:
 * дерево, аватарку, рамку или цветовой акцент.
 */
export default function GiftItemThumb({ itemType, item, size = 48 }) {
    const box = { width: size, height: size }

    if (!item) {
        return <div className="gift-thumb gift-thumb--empty" style={box} />
    }

    if (itemType === 'TREE') {
        return (
            <div className="gift-thumb gift-thumb--tree" style={box}>
                <TreeThumb kind={item.code} size={size} />
            </div>
        )
    }

    if (itemType === 'AVATAR') {
        return (
            <div className="gift-thumb gift-thumb--avatar" style={box}>
                <AvatarArt avatar={item} emojiSize={Math.round(size * 0.55)} />
            </div>
        )
    }

    if (itemType === 'FRAME') {
        return (
            <div
                className={`avatar-frame ${item.cssClass || ''} gift-thumb gift-thumb--frame`}
                style={box}
            >
                <span
                    className="avatar-frame__initial"
                    style={{ fontSize: Math.round(size * 0.4) }}
                >
                    Aa
                </span>
            </div>
        )
    }

    if (itemType === 'ACCENT') {
        return (
            <div
                className={`gift-thumb gift-thumb--accent ${item.isRare ? 'gift-thumb--rare' : ''}`}
                style={{ ...box, ...accentVars(item), fontSize: Math.round(size * 0.4) }}
            >
                <span>Aa</span>
            </div>
        )
    }

    return <div className="gift-thumb gift-thumb--empty" style={box} />
}
