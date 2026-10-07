import { SvgAvatar } from '../Layout/SvgAvatars'

export default function AvatarCard({ item, onBuy, onEquip }) {
    const owned = item.owned
    const active = item.active
    const code = item.code || 'default'

    const svgNode = SvgAvatar({ code })

    return (
        <div className={`shop-card ${active ? 'shop-card--active' : ''}`}>
            <div className="shop-card__preview">
                <div
                    className={`avatar-frame ${item.cssClass || ''}`}
                    style={{ width: 80, height: 80 }}
                >
                    <div className="avatar-frame__inner">
                        {svgNode ? (
                            svgNode
                        ) : item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className={`avatar-frame__img avatar-frame__img--${code}`}
                                draggable={false}
                            />
                        ) : (
                            <span className="avatar-frame__emoji">{item.emoji || '👤'}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="shop-card__body">
                <div className="shop-card__title">{item.title}</div>
                <div className="shop-card__desc">{item.description}</div>
                <div className="shop-card__footer">
                    {!owned && (
                        <>
                            <span className="shop-card__price">🍃 {item.price}</span>
                            <button className="btn btn-primary shop-card__btn" onClick={onBuy}>
                                Купить
                            </button>
                        </>
                    )}
                    {owned && !active && (
                        <button className="btn btn-primary shop-card__btn" onClick={onEquip}>
                            Надеть
                        </button>
                    )}
                    {owned && active && (
                        <span className="shop-card__badge">Активно</span>
                    )}
                </div>
            </div>
        </div>
    )
}