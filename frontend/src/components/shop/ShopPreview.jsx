// frontend/src/components/shop/ShopPreview.jsx

/**
 * Превью товара 1:1 с тем, как предмет выглядит в интерфейсе.
 *
 *   trees   — сюда больше не попадает (см. TreeSkinCard + TreePreviewPopup:
 *              деревья рендерятся только по клику, чтобы не грузить сетку)
 *   frames  — рамка вокруг реальной аватарки пользователя
 *   accents — реальный акцент: заливка, текст и контур
 *   avatars — сама аватарка (при наличии рамки пользователя — в ней)
 *
 * Живёт в components/shop, а не в layout, потому что тянет shop.css
 * (.shop-preview-* / .shop-demo-*), который подключается в main.jsx.
 */

import AvatarWithFrame from '../layout/AvatarWithFrame'
import { resolveUrl } from '../../utils/format'

const ACCENT_DEMO_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
}

/**
 * Переменные акцента.
 *
 * Однотонный: --accent = hex, градиент = сам цвет.
 * Градиентный: линейный переход hex → secondary.
 * Редкий (металл): свой набор переменных, чтобы один и тот же акцент и в
 * карточке, и в профиле, и в интерфейсе выглядел металлическим контуром.
 *
 * ВАЖНО: значения пишем и в локальные (--accent-solid / --accent-fill),
 * и в глобальные имена (--accent / --accent-gradient). Глобальные — только
 * фолбэк для CSS; приоритет всегда у локальных, потому что --accent на
 * :root принадлежит ТЕКУЩЕМУ акценту пользователя. Иначе у «Малинового»
 * заливка рисовалась градиентом выбранной темы (например, лаванды).
 */
export function accentVars(item) {
    const solid = item.hexColor || null
    const vars = {}

    if (solid) {
        vars['--accent'] = solid
        vars['--accent-color'] = solid
        vars['--accent-solid'] = solid
        vars['--accent-fill'] = solid
        vars['--accent-outline'] = solid
    }

    if (item.isRare) {
        const m1 = item.hexColor || 'var(--accent)'
        const m2 = item.hexColorSecondary || m1
        const m3 = item.hexColorTertiary || m2
        const metal = `linear-gradient(115deg, ${m1} 0%, ${m2} 34%, ${m3} 58%, ${m2} 78%, ${m1} 100%)`
        vars['--accent-metal-1'] = m1
        vars['--accent-metal-2'] = m2
        vars['--accent-metal-3'] = m3
        vars['--accent-metal'] = metal
        vars['--accent-fill'] = metal
        vars['--accent-gradient'] = metal
        return vars
    }

    if (item.isGradient && item.hexColorSecondary) {
        const gradient = `linear-gradient(120deg, ${item.hexColor} 0%, ${item.hexColorSecondary} 100%)`
        vars['--accent-gradient'] = gradient
        vars['--accent-gradient-round'] = gradient
        // Один и тот же градиент используется во всех элементах примера
        // (текст, заливка, контур), чтобы не получалось «разных цветов»
        // у одного акцента.
        vars['--accent-fill'] = gradient
    }
    return vars
}

export default function ShopPreview({
                                         kind,
                                         item,
                                         userAvatar,
                                         userFrame,
                                         userDisplayName,
                                         userUsername,
                                     }) {
    // ---------- Акценты ----------
    if (kind === 'accents') {
        const rare = !!item.isRare
        return (
            <div
                className={`shop-preview shop-preview--accents ${rare ? 'shop-preview--rare' : ''} ${item.isGradient ? 'shop-preview--gradient' : ''}`}
                data-accent={item.code}
                style={accentVars(item)}
            >
                <div className="shop-demo" style={ACCENT_DEMO_STYLE}>
                    <span className="shop-demo__accent-text">Aa</span>
                    <span className="shop-demo__accent-fill">Заливка</span>
                    <span className="shop-demo__accent-outline">
                        <span className="shop-demo__accent-outline-label">Контур</span>
                    </span>
                </div>
                {rare && <span className="shop-preview__rare-tag">Редкий</span>}
            </div>
        )
    }

    // ---------- Рамки ----------
    if (kind === 'frames') {
        return (
            <div className="shop-preview shop-preview--frames" data-frame={item.code}>
                <AvatarWithFrame
                    avatar={userAvatar}
                    frame={{ cssClass: item.cssClass || '' }}
                    displayName={userDisplayName}
                    username={userUsername}
                    size={76}
                />
            </div>
        )
    }

    // ---------- Деревья ----------
    // Не рендерим: у деревьев вместо превью — кнопка (TreeSkinCard).
    if (kind === 'trees') {
        return <div className="shop-preview shop-preview--trees" data-tree={item.code}/>
    }

    // ---------- Аватарки ----------
    // Картинка, загруженная через админку, приходит как «avatars/code.png»
    // без ведущего слэша — resolveUrl() добавляет /uploads/.
    const avatarSrc = resolveUrl(item.imageUrl)

    return (
        <div className="shop-preview shop-preview--avatars" data-avatar={item.code}>
            <div className={`avatar-frame ${userFrame?.cssClass || ''}`} style={{ width: 76, height: 76 }}>
                {avatarSrc
                    ? <img src={avatarSrc} alt={item.title} className="avatar-frame__img" draggable={false}/>
                    : <span className="avatar-frame__emoji" style={{ fontSize: 46 }}>{item.emoji || '👤'}</span>}
            </div>
        </div>
    )
}
