import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { socialApi, usersApi } from '../../api/api'
import { resolveUrl } from '../../utils/format'
import AvatarArt from '../layout/AvatarArt'
import Modal from '../modal/Modal'
import AchievementCard from '../achievement/AchievementCard'

/**
 * Steam-подобная стена профиля.
 *
 * Один компонент обслуживает и свой профиль (/profile?tab=wall), и чужой
 * (/users/:id): отличается только набор доступных действий.
 */

const BACKGROUNDS = [
    { code: 'aurora', title: 'Аврора' },
    { code: 'sunset', title: 'Закат' },
    { code: 'ocean', title: 'Океан' },
    { code: 'forest', title: 'Лес' },
    { code: 'neon', title: 'Неон' },
    { code: 'ember', title: 'Угли' },
    { code: 'candy', title: 'Карамель' },
    { code: 'midnight', title: 'Полночь' },
]

/** Фолбэк, если сервер ещё не вернул каталог фонов. */
const FALLBACK_BACKGROUNDS = BACKGROUNDS.map(b => ({ ...b, cssClass: b.code, price: 0 }))

const SHOWCASE_LIMIT = 3

function avatarOf(profile) {
    if (!profile) return null
    return {
        code: profile.avatarCode || undefined,
        emoji: profile.avatarEmoji || undefined,
        imageUrl: profile.avatarImageUrl || profile.avatarUrl || undefined,
        title: profile.displayName || profile.username,
    }
}

function frameClass(profile) {
    return profile?.frameCssClass ? `avatar-frame ${profile.frameCssClass}` : 'avatar-frame'
}

function formatMemberSince(value) {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function formatPostDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function bgCode(profile) {
    const code = (profile?.backgroundCode || 'aurora').toLowerCase()
    const known = (profile?.backgrounds || []).some(b => b.code === code)
    if (known) return code
    return BACKGROUNDS.some(b => b.code === code) ? code : 'aurora'
}

function Stat({ icon, value, label }) {
    return (
        <div className="wall-stat">
            <span className="wall-stat__icon" aria-hidden="true">{icon}</span>
            <span className="wall-stat__value">{value}</span>
            <span className="wall-stat__label">{label}</span>
        </div>
    )
}

function ShowcaseSlot({ achievement, own, onEdit }) {
    if (!achievement) {
        return (
            <button
                type="button"
                className="wall-showcase__slot wall-showcase__slot--empty"
                onClick={own ? onEdit : undefined}
                disabled={!own}
            >
                <span className="wall-showcase__empty-icon">＋</span>
                <span className="wall-showcase__empty-label">
                    {own ? 'Выбрать достижение' : 'Пустой слот'}
                </span>
            </button>
        )
    }

    return (
        <div
            className="wall-showcase__slot"
            style={{ '--ach-accent': `var(--accent-${achievement.accentCode || 'blue'})` }}
            title={achievement.description}
        >
            <span className="wall-showcase__icon">{achievement.icon || '🏆'}</span>
            <span className="wall-showcase__title">{achievement.title}</span>
            <span className="wall-showcase__reward">🍃 {achievement.reward || 0}</span>
        </div>
    )
}

function FriendChip({ friend }) {
    return (
        <Link to={`/users/${friend.userId}`} className="wall-friend" title={friend.displayName}>
            <span className={friend.frameCssClass ? `avatar-frame ${friend.frameCssClass}` : 'avatar-frame'}>
                <span className="avatar-frame__inner">
                    <AvatarArt
                        avatar={avatarOf(friend)}
                        title={friend.displayName || friend.username}
                        className="avatar-frame__img"
                    />
                </span>
            </span>
            <span className="wall-friend__name">{friend.displayName}</span>
        </Link>
    )
}

function ShowcaseEditor({ open, achievements, initialCodes, onClose, onSaved }) {
    const [selected, setSelected] = useState(initialCodes)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const initialKey = initialCodes.join('|')

    useEffect(() => {
        if (open) {
            setSelected(initialCodes.slice(0, SHOWCASE_LIMIT))
            setError(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialKey])

    const toggle = (code) => {
        setSelected(list => {
            if (list.includes(code)) return list.filter(c => c !== code)
            if (list.length >= SHOWCASE_LIMIT) return list
            return [...list, code]
        })
    }

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            const { data } = await socialApi.updateShowcase(selected)
            onSaved(data)
            onClose()
        } catch (e) {
            setError(e.response?.data?.message || 'Не удалось сохранить витрину')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Витрина достижений"
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                        Отмена
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={save}
                        disabled={saving}
                    >
                        {saving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                </>
            }
        >
            <p className="wall-editor__hint">
                Выберите до {SHOWCASE_LIMIT} полученных достижений. Они будут видны
                всем, кто открывает ваш профиль.
            </p>
            <div className="wall-editor__grid">
                {achievements.map(a => {
                    const active = selected.includes(a.code)
                    const disabled = !active && selected.length >= SHOWCASE_LIMIT
                    return (
                        <button
                            key={a.code}
                            type="button"
                            className={`wall-editor__item ${active ? 'wall-editor__item--active' : ''}`}
                            onClick={() => toggle(a.code)}
                            disabled={disabled}
                        >
                            <span className="wall-editor__item-icon">{a.icon || '🏆'}</span>
                            <span className="wall-editor__item-body">
                                <span className="wall-editor__item-title">{a.title}</span>
                                <span className="wall-editor__item-desc">{a.description}</span>
                            </span>
                            <span className="wall-editor__item-check">
                                {active ? '✓' : ''}
                            </span>
                        </button>
                    )
                })}
                {achievements.length === 0 && (
                    <div className="wall-empty">
                        Пока нет полученных достижений — самое время начать.
                    </div>
                )}
            </div>
            {error && <div className="modal__error">{error}</div>}
        </Modal>
    )
}

export default function ProfileWall({ userId, own = false, onChanged }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionError, setActionError] = useState(null)
    const [busy, setBusy] = useState(false)
    const [composer, setComposer] = useState('')
    const [posting, setPosting] = useState(false)
    const [showcaseOpen, setShowcaseOpen] = useState(false)
    const [achievementsOpen, setAchievementsOpen] = useState(false)
    const [bgOpen, setBgOpen] = useState(false)
    const [friendQuery, setFriendQuery] = useState('')
    const [friendResults, setFriendResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [friendData, setFriendData] = useState(null)

    const load = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        setError(null)
        try {
            const { data } = await socialApi.profile(userId)
            setProfile(data)
        } catch (e) {
            setError(e.response?.data?.message || 'Не удалось загрузить профиль')
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => { load() }, [load])

    const loadFriends = useCallback(async () => {
        if (!own) return
        try {
            const { data } = await socialApi.friends()
            setFriendData(data)
        } catch {
            setFriendData(null)
        }
    }, [own])

    useEffect(() => { loadFriends() }, [loadFriends])

    const unlocked = useMemo(
        () => (profile?.achievements || []).filter(a => a.unlocked !== false),
        [profile],
    )

    const reloadProfile = async () => {
        const { data } = await socialApi.profile(userId)
        setProfile(data)
        onChanged?.(data)
    }

    const friendAction = async () => {
        if (!profile || busy) return
        setBusy(true)
        setActionError(null)
        try {
            if (profile.friendStatus === 'NONE') {
                await socialApi.addFriend(profile.id)
            } else if (profile.friendStatus === 'REQUEST_RECEIVED') {
                await socialApi.acceptFriend(profile.id)
            } else if (profile.friendStatus === 'FRIENDS') {
                await socialApi.removeFriend(profile.id)
            } else if (profile.friendStatus === 'REQUEST_SENT') {
                await socialApi.removeFriend(profile.id)
            }
            await reloadProfile()
        } catch (e) {
            setActionError(e.response?.data?.message || 'Не удалось выполнить действие')
        } finally {
            setBusy(false)
        }
    }

    const pickBackground = async (code) => {
        setBusy(true)
        setActionError(null)
        try {
            await socialApi.updateBackground(code)
            const chosen = (profile?.backgrounds || []).find(b => b.code === code)
            const patch = {
                backgroundCode: code,
                backgroundImageUrl: chosen?.imageUrl || null,
                backgroundCssClass: chosen?.cssClass || code,
            }
            setProfile(p => ({ ...p, ...patch }))
            setBgOpen(false)
            onChanged?.({ ...profile, ...patch })
        } catch (e) {
            setActionError(e.response?.data?.message || 'Не удалось сменить фон')
        } finally {
            setBusy(false)
        }
    }

    const submitPost = async (e) => {
        e.preventDefault()
        const text = composer.trim()
        if (!text || posting || !profile) return
        setPosting(true)
        setActionError(null)
        try {
            const { data } = await socialApi.addWallPost(profile.id, text)
            setProfile(p => ({ ...p, wall: data }))
            setComposer('')
        } catch (err) {
            setActionError(err.response?.data?.message || 'Не удалось отправить сообщение')
        } finally {
            setPosting(false)
        }
    }

    const deletePost = async (postId) => {
        if (!profile) return
        setActionError(null)
        try {
            const { data } = await socialApi.deleteWallPost(profile.id, postId)
            setProfile(p => ({ ...p, wall: data }))
        } catch (err) {
            setActionError(err.response?.data?.message || 'Не удалось удалить сообщение')
        }
    }

    const acceptFriendRequest = async (requesterId) => {
        try {
            const { data } = await socialApi.acceptFriend(requesterId)
            setFriendData(data)
            await reloadProfile()
        } catch (e) {
            setActionError(e.response?.data?.message || 'Не удалось принять заявку')
        }
    }

    const searchPeople = async (e) => {        e.preventDefault()
        const q = friendQuery.trim()
        if (!q) {
            setFriendResults([])
            return
        }
        setSearching(true)
        try {
            const { data } = await usersApi.search(q)
            const friendIds = new Set((profile?.friends || []).map(f => f.userId))
            setFriendResults((data || []).filter(u =>
                u.userId !== profile?.id && !friendIds.has(u.userId)))
        } catch {
            setFriendResults([])
        } finally {
            setSearching(false)
        }
    }

    if (loading) return <div className="wall-loading">Загружаем профиль…</div>
    if (error) return <div className="wall-error">{error}</div>
    if (!profile) return null

    const showcase = Array.from({ length: SHOWCASE_LIMIT }, (_, i) => profile.showcase?.[i] || null)
    const guideShowcase = profile.guideShowcase || []
    const memberSince = formatMemberSince(profile.memberSince)
    const friends = profile.friends || []
    const wall = profile.wall || []

    const friendLabel = {
        NONE: 'Добавить в друзья',
        REQUEST_SENT: 'Заявка отправлена',
        REQUEST_RECEIVED: 'Принять заявку',
        FRIENDS: 'Удалить из друзей',
    }[profile.friendStatus] || 'Добавить в друзья'

    const ownedBackgrounds = profile.backgrounds?.length
        ? profile.backgrounds
        : FALLBACK_BACKGROUNDS
    const heroStyle = profile.backgroundImageUrl
        ? {
            backgroundImage: `linear-gradient(125deg, rgba(9, 30, 66, .45), rgba(9, 30, 66, .15)), url(${resolveUrl(profile.backgroundImageUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }
        : undefined

    return (
        <div className={`profile-wall profile-wall--${bgCode(profile)}`}>
            <section className="wall-hero" style={heroStyle}>
                <div className="wall-hero__glow" aria-hidden="true" />
                <div className="wall-hero__identity">
                    <span className={frameClass(profile)} style={{ width: 128, height: 128 }}>
                        <span className="avatar-frame__inner">
                            <AvatarArt
                                avatar={avatarOf(profile)}
                                title={profile.displayName || profile.username}
                                className="avatar-frame__img"
                            />
                        </span>
                    </span>
                    <div className="wall-hero__text">
                        <div className="wall-hero__name-row">
                            <h1 className="wall-hero__name">{profile.displayName || profile.username}</h1>
                            {profile.isAdmin && <span className="wall-badge wall-badge--admin">admin</span>}
                            <span className="wall-badge wall-badge--level">Уровень {profile.level}</span>
                        </div>
                        <div className="wall-hero__login">@{profile.username}</div>
                        {profile.bio && <p className="wall-hero__bio">{profile.bio}</p>}
                        <div className="wall-hero__meta">
                            {memberSince && <span>В TaskBoard с {memberSince}</span>}
                            <span>·</span>
                            <span>{profile.achievementsUnlocked} из {profile.achievementsTotal} достижений</span>
                        </div>
                    </div>
                </div>

                <div className="wall-hero__actions">
                    {own ? (
                        <>
                            <Link to="/profile?tab=profile" className="btn btn-primary">
                                Редактировать профиль
                            </Link>
                            <Link to="/shop" className="btn btn-ghost">Магазин</Link>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setAchievementsOpen(true)}
                            >
                                🏆 Достижения
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost wall-bg-toggle"
                                onClick={() => setBgOpen(v => !v)}
                            >
                                🎨 Фон
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={friendAction}
                                disabled={busy || profile.friendStatus === 'REQUEST_SENT'}
                            >
                                {busy ? '…' : friendLabel}
                            </button>
                            {profile.friendStatus === 'FRIENDS' && (
                                <span className="wall-hero__friend-note">Вы друзья</span>
                            )}
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setAchievementsOpen(true)}
                            >
                                🏆 Достижения
                            </button>
                        </>
                    )}
                </div>

                {own && bgOpen && (
                    <div className="wall-bg-picker">
                        {ownedBackgrounds.map(b => {
                            const code = b.cssClass || b.code
                            const style = b.imageUrl
                                ? {
                                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45)), url(${resolveUrl(b.imageUrl)})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }
                                : undefined
                            return (
                                <button
                                    key={b.code}
                                    type="button"
                                    className={`wall-bg-picker__item wall-bg-picker__item--${code} ${bgCode(profile) === b.code ? 'active' : ''}`}
                                    style={style}
                                    onClick={() => pickBackground(b.code)}
                                    disabled={busy}
                                    title={b.title}
                                >
                                    <span>{b.title}</span>
                                </button>
                            )
                        })}
                        <Link to="/shop" className="wall-bg-picker__buy">
                            ＋ Купить новые фоны в магазине
                        </Link>
                    </div>
                )}
            </section>

            <section className="wall-stats">
                <Stat icon="🍃" value={profile.leaves ?? 0} label="листьев" />
                <Stat icon="🔥" value={profile.streakDays ?? 0} label="дней подряд" />
                <Stat icon="✅" value={profile.tasksDoneTotal ?? 0} label="задач закрыто" />
                <Stat icon="🏆" value={profile.achievementsUnlocked ?? 0} label="достижений" />
                <Stat icon="👥" value={profile.friendsCount ?? 0} label="друзей" />
            </section>

            {actionError && <div className="profile-msg profile-msg--error">{actionError}</div>}

            <div className="wall-grid">
                <div className="wall-main">
                    <section className="wall-card wall-showcase">
                        <div className="wall-card__head">
                            <h2 className="wall-card__title">Витрина</h2>
                            {own && (
                                <button
                                    type="button"
                                    className="wall-card__link"
                                    onClick={() => setShowcaseOpen(true)}
                                >
                                    Изменить
                                </button>
                            )}
                        </div>
                        <div className="wall-showcase__grid">
                            {showcase.map((a, i) => (
                                <ShowcaseSlot
                                    key={a?.code || `slot-${i}`}
                                    achievement={a}
                                    own={own}
                                    onEdit={() => setShowcaseOpen(true)}
                                />
                            ))}
                        </div>
                    </section>

                    {guideShowcase.length > 0 && (
                        <section className="wall-card wall-guide-showcase">
                            <div className="wall-card__head">
                                <h2 className="wall-card__title">Гайды</h2>
                                {own && (
                                    <Link to="/guides#showcase" className="wall-card__link">
                                        Изменить витрину
                                    </Link>
                                )}
                            </div>
                            <div className="wall-guide-showcase__grid">
                                {guideShowcase.map(guide => (
                                    <Link
                                        key={guide.id}
                                        to={`/guides/${guide.id}`}
                                        className={`wall-guide-card wall-guide-card--${guide.accent || 'blue'}`}
                                    >
                                        <span className="wall-guide-card__emoji">{guide.emoji || '📅'}</span>
                                        <span className="wall-guide-card__body">
                                            <span className="wall-guide-card__title">{guide.title}</span>
                                            <span className="wall-guide-card__subtitle">{guide.subtitle}</span>
                                            <span className="wall-guide-card__meta">
                                                {guide.periodType === 'MONTH' ? 'Месяц' : guide.periodType === 'WEEK' ? 'Неделя' : 'Гайд'}
                                                {' · '}
                                                {guide.taskCount} задач
                                            </span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="wall-card wall-feed">
                        <div className="wall-card__head">
                            <h2 className="wall-card__title">Стена</h2>
                            <span className="wall-card__count">{wall.length}</span>
                        </div>

                        <form className="wall-composer" onSubmit={submitPost}>
                            <textarea
                                className="input wall-composer__input"
                                value={composer}
                                onChange={(e) => setComposer(e.target.value)}
                                placeholder={own
                                    ? 'Что нового? Напишите на своей стене…'
                                    : `Написать ${profile.displayName || profile.username}…`}
                                maxLength={1000}
                                rows={2}
                            />
                            <div className="wall-composer__footer">
                                <span className="wall-composer__counter">{composer.length}/1000</span>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={posting || !composer.trim()}
                                >
                                    {posting ? 'Отправка…' : 'Отправить'}
                                </button>
                            </div>
                        </form>

                        {wall.length === 0 ? (
                            <div className="wall-empty">
                                Здесь пока тихо. Оставьте первое сообщение!
                            </div>
                        ) : (
                            <div className="wall-posts">
                                {wall.map(post => (
                                    <article key={post.id} className="wall-post">
                                        <Link to={`/users/${post.author.userId}`} className="wall-post__avatar">
                                            <span className={post.author.frameCssClass
                                                ? `avatar-frame ${post.author.frameCssClass}`
                                                : 'avatar-frame'}
                                                  style={{ width: 40, height: 40 }}>
                                                <span className="avatar-frame__inner">
                                                    <AvatarArt
                                                        avatar={avatarOf(post.author)}
                                                        title={post.author.displayName}
                                                        className="avatar-frame__img"
                                                    />
                                                </span>
                                            </span>
                                        </Link>
                                        <div className="wall-post__body">
                                            <div className="wall-post__head">
                                                <Link to={`/users/${post.author.userId}`} className="wall-post__author">
                                                    {post.author.displayName || post.author.username}
                                                </Link>
                                                <span className="wall-post__date">{formatPostDate(post.createdAt)}</span>
                                                {post.canDelete && (
                                                    <button
                                                        type="button"
                                                        className="wall-post__delete"
                                                        onClick={() => deletePost(post.id)}
                                                        title="Удалить сообщение"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                            <p className="wall-post__text">{post.body}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="wall-side">
                    <section className="wall-card wall-side__friends">
                        <div className="wall-card__head">
                            <h2 className="wall-card__title">Друзья</h2>
                            <span className="wall-card__count">{friends.length}</span>
                        </div>
                            {own && friendData?.incoming?.length > 0 && (
                                <div className="wall-requests">
                                    <div className="wall-requests__title">
                                        Заявки в друзья
                                        <span className="wall-card__count">{friendData.incoming.length}</span>
                                    </div>
                                    {friendData.incoming.map(u => (
                                        <div key={u.userId} className="wall-request">
                                            <Link to={`/users/${u.userId}`} className="wall-request__name">
                                                {u.displayName || u.username}
                                            </Link>
                                            <button
                                                type="button"
                                                className="wall-request__accept"
                                                onClick={() => acceptFriendRequest(u.userId)}
                                            >
                                                Принять
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                        {friends.length === 0 ? (
                            <div className="wall-empty wall-empty--small">
                                {own ? 'Друзей пока нет — найдите единомышленников.' : 'Список друзей пуст.'}
                            </div>
                        ) : (
                            <div className="wall-friends">
                                {friends.slice(0, 12).map(f => <FriendChip key={f.userId} friend={f} />)}
                            </div>
                        )}

                        {own && (
                            <div className="wall-friend-search">
                                <form className="wall-friend-search__form" onSubmit={searchPeople}>
                                    <input
                                        className="input"
                                        value={friendQuery}
                                        onChange={(e) => setFriendQuery(e.target.value)}
                                        placeholder="Найти пользователя…"
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-ghost"
                                        disabled={searching}
                                    >
                                        {searching ? '…' : '🔍'}
                                    </button>
                                </form>
                                {friendResults.length > 0 && (
                                    <div className="wall-friend-results">
                                        {friendResults.slice(0, 5).map(u => (
                                            <Link key={u.userId} to={`/users/${u.userId}`} className="wall-friend-result">
                                                <span className="avatar-frame" style={{ width: 28, height: 28 }}>
                                                    <AvatarArt
                                                        avatar={{ imageUrl: u.avatarUrl || undefined }}
                                                        title={u.displayName || u.username}
                                                        className="avatar-frame__img"
                                                    />
                                                </span>
                                                <span className="wall-friend-result__name">
                                                    {u.displayName || u.username}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="wall-card wall-side__achievements">
                        <div className="wall-card__head">
                            <h2 className="wall-card__title">Последние достижения</h2>
                            <span className="wall-card__count">{unlocked.length}</span>
                        </div>
                        {unlocked.length === 0 ? (
                            <div className="wall-empty wall-empty--small">Пока ни одного достижения.</div>
                        ) : (
                            <div className="wall-ach-list">
                                {unlocked.slice(0, 6).map(a => (
                                    <div
                                        key={a.code}
                                        className="wall-ach"
                                        style={{ '--ach-accent': `var(--accent-${a.accentCode || 'blue'})` }}
                                    >
                                        <span className="wall-ach__icon">{a.icon || '🏆'}</span>
                                        <span className="wall-ach__body">
                                            <span className="wall-ach__title">{a.title}</span>
                                            <span className="wall-ach__reward">🍃 {a.reward || 0}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </aside>
            </div>

            {own && (
                <ShowcaseEditor
                    open={showcaseOpen}
                    achievements={unlocked}
                    initialCodes={(profile.showcase || []).map(a => a.code)}
                    onClose={() => setShowcaseOpen(false)}
                    onSaved={(data) => setProfile(p => ({ ...p, showcase: data }))}
                />
            )}

            <Modal
                open={achievementsOpen}
                onClose={() => setAchievementsOpen(false)}
                title={`Выполненные достижения · ${unlocked.length}`}
            >
                {unlocked.length === 0 ? (
                    <div className="wall-empty">
                        Пока нет выполненных достижений.
                    </div>
                ) : (
                    <div className="achievements__grid">
                        {unlocked.map(a => <AchievementCard key={a.code} achievement={a} />)}
                    </div>
                )}
            </Modal>
        </div>
    )
}
