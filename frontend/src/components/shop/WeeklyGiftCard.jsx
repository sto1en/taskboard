import useT from '../../hooks/useT'
import TreeThumb from './TreeThumb'
import ShopPreview from './ShopPreview'
import AvatarArt from '../layout/AvatarArt'

/**
 * Баннер «Подарок недели» в магазине.
 *
 * Показывается только когда админ настроил подарок на текущую неделю.
 * Пять закрытых задач открывают кнопку «Забрать»; после получения
 * карточка остаётся на месте с отметкой «Получено».
 */
export default function WeeklyGiftCard({
    gift,
    claiming = false,
    onClaim,
    userAvatar,
    userDisplayName,
    userUsername,
}) {
    const t = useT()
    if (!gift?.configured || !gift.enabled) return null

    const done = gift.doneTasks ?? 0
    const required = gift.requiredTasks ?? 5
    const pct = Math.min(100, required > 0 ? (done / required) * 100 : 0)

    const formatDate = (iso) => {
        if (!iso) return ''
        const d = new Date(`${iso}T00:00:00`)
        return Number.isNaN(d.getTime())
            ? iso
            : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }

    const art = (() => {
        if (gift.itemType === 'TREE') {
            return <TreeThumb kind={gift.itemCode} size={96}/>
        }
        if (gift.itemType === 'AVATAR') {
            return (
                <div className="weekly-gift__avatar avatar-frame">
                    <AvatarArt
                        avatar={{
                            code: gift.itemCode,
                            imageUrl: gift.imageUrl,
                            emoji: gift.emoji,
                            title: gift.title,
                        }}
                        emojiSize={40}
                    />
                </div>
            )
        }
        if (gift.itemType === 'FRAME' || gift.itemType === 'ACCENT') {
            return (
                <ShopPreview
                    kind={gift.itemType === 'FRAME' ? 'frames' : 'accents'}
                    item={{
                        ...gift,
                        code: gift.itemCode,
                        cssClass: gift.cssClass,
                    }}
                    userAvatar={userAvatar}
                    userDisplayName={userDisplayName}
                    userUsername={userUsername}
                />
            )
        }
        return <span className="weekly-gift__emoji">{gift.emoji || '🎁'}</span>
    })()

    return (
        <div className={`weekly-gift weekly-gift--${gift.state}`}>
            <div className="weekly-gift__art">{art}</div>

            <div className="weekly-gift__body">
                <div className="weekly-gift__eyebrow">🎁 {t.weeklyGiftTitle}</div>
                <div className="weekly-gift__title">{gift.title}</div>
                {gift.description && (
                    <div className="weekly-gift__desc">{gift.description}</div>
                )}
                <div className="weekly-gift__dates">
                    {formatDate(gift.weekStart)} — {formatDate(gift.weekEnd)}
                </div>

                <div className="weekly-gift__progress">
                    <div className="weekly-gift__progress-text">
                        <span>{t.weeklyGiftProgress(done, required)}</span>
                        <span>{Math.min(done, required)} / {required}</span>
                    </div>
                    <div className="weekly-gift__progress-track">
                        <span style={{ width: `${pct}%` }}/>
                    </div>
                </div>
            </div>

            <div className="weekly-gift__action">
                {gift.state === 'claimed' ? (
                    <span className="weekly-gift__done">✓ {t.weeklyGiftClaimed}</span>
                ) : (
                    <button
                        type="button"
                        className="btn btn-primary weekly-gift__btn"
                        onClick={onClaim}
                        disabled={!gift.canClaim || claiming}
                    >
                        {claiming
                            ? t.loading
                            : gift.canClaim
                                ? t.weeklyGiftClaim
                                : t.weeklyGiftLocked}
                    </button>
                )}
                {gift.owned && gift.state !== 'claimed' && (
                    <span className="weekly-gift__owned">{t.weeklyGiftOwned}</span>
                )}
            </div>
        </div>
    )
}
