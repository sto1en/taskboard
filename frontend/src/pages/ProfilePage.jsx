import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi, boardsApi, shopApi, projectsApi } from '../api/api'
import useT from '../hooks/useT'
import AccentDot from '../components/shop/AccentDot'
import HelpTip from '../components/common/HelpTip'
import { SvgAvatar } from '../components/Layout/SvgAvatars'

const RUSSIAN_TIMEZONES = [
    { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
    { value: 'Europe/Moscow',      label: 'Москва (UTC+3)' },
    { value: 'Europe/Simferopol',  label: 'Симферополь (UTC+3)' },
    { value: 'Europe/Volgograd',   label: 'Волгоград (UTC+3)' },
    { value: 'Europe/Kirov',       label: 'Киров (UTC+3)' },
    { value: 'Europe/Astrakhan',   label: 'Астрахань (UTC+4)' },
    { value: 'Europe/Samara',      label: 'Самара (UTC+4)' },
    { value: 'Europe/Saratov',     label: 'Саратов (UTC+4)' },
    { value: 'Europe/Ulyanovsk',   label: 'Ульяновск (UTC+4)' },
    { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
    { value: 'Asia/Omsk',          label: 'Омск (UTC+6)' },
    { value: 'Asia/Novosibirsk',   label: 'Новосибирск (UTC+7)' },
    { value: 'Asia/Barnaul',       label: 'Барнаул (UTC+7)' },
    { value: 'Asia/Krasnoyarsk',   label: 'Красноярск (UTC+7)' },
    { value: 'Asia/Tomsk',         label: 'Томск (UTC+7)' },
    { value: 'Asia/Novokuznetsk',  label: 'Новокузнецк (UTC+7)' },
    { value: 'Asia/Irkutsk',       label: 'Иркутск (UTC+8)' },
    { value: 'Asia/Chita',         label: 'Чита (UTC+9)' },
    { value: 'Asia/Yakutsk',       label: 'Якутск (UTC+9)' },
    { value: 'Asia/Khandyga',      label: 'Хандыга (UTC+9)' },
    { value: 'Asia/Vladivostok',   label: 'Владивосток (UTC+10)' },
    { value: 'Asia/Ust-Nera',      label: 'Усть-Нера (UTC+10)' },
    { value: 'Asia/Magadan',       label: 'Магадан (UTC+11)' },
    { value: 'Asia/Sakhalin',      label: 'Сахалин (UTC+11)' },
    { value: 'Asia/Srednekolymsk', label: 'Среднеколымск (UTC+11)' },
    { value: 'Asia/Kamchatka',     label: 'Камчатка (UTC+12)' },
    { value: 'Asia/Anadyr',        label: 'Анадырь (UTC+12)' },
]

const DEFAULT_APPEARANCE = {
    theme: 'light',
    accentCode: 'blue',
    density: 'cozy',
    sidebarCollapsed: false,
    treeEnabled: true,
    treeKind: 'sakura',
}
const DEFAULT_LOCALE = { language: 'ru', timezone: 'Europe/Moscow' }
const DEFAULT_WORKSPACE = {
    defaultBoardId: null,
    launchProjectId: null,
    defaultProjectId: null,
    tasksPerPage: 50,
    confirmBeforeDelete: true,
}
const DEFAULT_DISPLAY = { taskSortMode: 'manual', taskSortDir: 'asc', projectViewMode: 'kanban' }
const DEFAULT_NOTIFICATION = { notifyEmail: true, notifyDeadline: true, notifyDigest: 'daily', remindBeforeDays: 1 }

const BASE_ACCENTS = [
    { id: 'base-blue', code: 'blue', title: 'Синий' },
]

function AvatarVisual({ avatar, displayName, username }) {
    const code = avatar?.code
    const svgNode = code ? SvgAvatar({ code }) : null
    const initial = (displayName || username || 'U').charAt(0).toUpperCase()

    if (svgNode) {
        return <span className="profile-picker__svg">{svgNode}</span>
    }
    if (avatar?.imageUrl) {
        return (
            <img
                src={avatar.imageUrl}
                alt={avatar.title || ''}
                className="profile-picker__img"
                draggable={false}
            />
        )
    }
    if (avatar?.emoji) {
        return <span className="profile-picker__emoji">{avatar.emoji}</span>
    }
    return <span className="profile-picker__emoji">{initial}</span>
}

/**
 * Рамка считается «валидной» для отображения, если у неё есть cssClass.
 * Пустые рамки (без класса) не показываем и не даём выбрать.
 */
function isRenderableFrame(f) {
    return !!f?.cssClass
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const t = useT()
    const [searchParams, setSearchParams] = useSearchParams()

    const initialTab = searchParams.get('tab') || 'profile'
    const [tab, setTab] = useState(initialTab)

    useEffect(() => {
        const urlTab = searchParams.get('tab')
        if (urlTab && urlTab !== tab) setTab(urlTab)
    }, [searchParams])

    const switchTab = (code) => {
        setTab(code)
        setSearchParams({ tab: code })
    }

    const [msg, setMsg] = useState(null)
    const [err, setErr] = useState(null)

    const [profileForm, setProfileForm] = useState({ displayName: '', bio: '' })
    const [appearanceForm, setAppearanceForm] = useState(DEFAULT_APPEARANCE)
    const [localeForm, setLocaleForm] = useState(DEFAULT_LOCALE)
    const [workspaceForm, setWorkspaceForm] = useState(DEFAULT_WORKSPACE)
    const [boards, setBoards] = useState([])
    const [projectsOfDefaultBoard, setProjectsOfDefaultBoard] = useState([])
    const [allProjects, setAllProjects] = useState([])
    const [displayForm, setDisplayForm] = useState(DEFAULT_DISPLAY)
    const [notificationForm, setNotificationForm] = useState(DEFAULT_NOTIFICATION)

    const [pendingAccentId, setPendingAccentId] = useState(null)
    const [shop, setShop] = useState(null)

    // Состояние тумблера «Включить рамку» + ID последней выбранной рамки
    const [frameEnabled, setFrameEnabled] = useState(false)
    const [lastFrameId, setLastFrameId] = useState(null)

    useEffect(() => {
        if (!user) return
        setProfileForm({
            displayName: user.profile?.displayName || '',
            bio: user.profile?.bio || '',
        })
        setAppearanceForm({
            ...DEFAULT_APPEARANCE,
            ...(user.appearance || {}),
            treeEnabled: user.appearance?.treeEnabled !== false,
        })
        setLocaleForm({ ...DEFAULT_LOCALE, ...(user.locale || {}) })
        setWorkspaceForm({ ...DEFAULT_WORKSPACE, ...(user.workspace || {}) })
        setDisplayForm({ ...DEFAULT_DISPLAY, ...(user.display || {}) })
        setNotificationForm({ ...DEFAULT_NOTIFICATION, ...(user.notification || {}) })
        boardsApi.list().then(({ data }) => setBoards(data))
    }, [user])

    useEffect(() => {
        if (!boards.length) {
            setAllProjects([])
            return
        }
        Promise.all(
            boards.map(b =>
                projectsApi.listByBoard(b.id)
                    .then(({ data }) => data.map(p => ({
                        ...p,
                        boardId: b.id,
                        boardTitle: b.title,
                    })))
                    .catch(() => [])
            )
        ).then(arrays => {
            setAllProjects(arrays.flat())
        })
    }, [boards])

    useEffect(() => {
        const bid = workspaceForm.defaultBoardId
        if (!bid) {
            setProjectsOfDefaultBoard([])
            return
        }
        projectsApi.listByBoard(bid)
            .then(({ data }) => setProjectsOfDefaultBoard(data))
            .catch(() => setProjectsOfDefaultBoard([]))
    }, [workspaceForm.defaultBoardId])

    const loadShop = () => {
        shopApi.get().then(({ data }) => {
            setShop(data)

            // синхронизируем состояние тумблера и «последней выбранной» с бэком
            const active = (data?.frames || []).find(f => f.active && isRenderableFrame(f))
            if (active) {
                setFrameEnabled(true)
                setLastFrameId(active.id)
            } else {
                setFrameEnabled(false)
                // lastFrameId НЕ сбрасываем — чтобы пользователь мог включить обратно
            }
        }).catch(() => setShop(null))
    }
    useEffect(() => { loadShop() }, [])

    const flash = (m) => { setMsg(m); setErr(null); setTimeout(() => setMsg(null), 3000) }
    const flashErr = (e) => { setErr(e.response?.data?.message || e.message || 'Ошибка'); setMsg(null) }

    const saveProfile = async () => {
        try {
            const { data } = await userApi.updateProfile(profileForm)
            updateUser({ profile: data })
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    const saveAppearance = async () => {
        try {
            if (pendingAccentId && !String(pendingAccentId).startsWith('base-')) {
                const owned = shop?.accents?.find(a => a.id === pendingAccentId && a.owned)
                if (!owned) await shopApi.buyAccent(pendingAccentId)
                await shopApi.equipAccent(pendingAccentId)
                setPendingAccentId(null)
                loadShop()
                window.dispatchEvent(new Event('shop:refresh'))
                window.dispatchEvent(new Event('user:refresh'))
            } else if (pendingAccentId && String(pendingAccentId).startsWith('base-')) {
                setPendingAccentId(null)
            }

            const { accentCode, ...rest } = appearanceForm
            const { data } = await userApi.updateAppearance(rest)
            updateUser({ appearance: { ...data, accentCode } })
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    const saveLocale = async () => {
        try {
            const { data } = await userApi.updateLocale(localeForm)
            updateUser({ locale: data })
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    const saveWorkspace = async () => {
        try {
            const payload = {
                ...workspaceForm,
                clearDefaultBoard: !workspaceForm.defaultBoardId,
                clearLaunchProject: !workspaceForm.launchProjectId,
                clearDefaultProject: !workspaceForm.defaultProjectId,
            }
            const { data } = await userApi.updateWorkspace(payload)
            updateUser({ workspace: data })
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    const saveDisplay = async () => {
        try {
            const { data } = await userApi.updateDisplay(displayForm)
            updateUser({ display: data })
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }
    const saveNotification = async () => {
        try {
            const { data } = await userApi.updateNotification(notificationForm)
            updateUser({ notification: data })
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    const applyAvatar = async (avatarId) => {
        try {
            const owned = shop?.avatars?.find(a => a.id === avatarId && a.owned)
            if (!owned) await shopApi.buyAvatar(avatarId)
            await shopApi.equipAvatar(avatarId)
            loadShop()
            window.dispatchEvent(new Event('shop:refresh'))
            window.dispatchEvent(new Event('user:refresh'))
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    const applyFrame = async (frameId) => {
        try {
            const owned = shop?.frames?.find(f => f.id === frameId && f.owned)
            if (!owned) await shopApi.buyFrame(frameId)
            await shopApi.equipFrame(frameId)
            setFrameEnabled(true)
            setLastFrameId(frameId)
            loadShop()
            window.dispatchEvent(new Event('shop:refresh'))
            window.dispatchEvent(new Event('user:refresh'))
            flash('Сохранено')
        } catch (e) { flashErr(e) }
    }

    /**
     * Тумблер «Включить рамку»:
     *  - выключение: unequipFrame + запомнить последнюю активную рамку.
     *  - включение: если есть lastFrameId — надеть её; если её нет — взять
     *    текущую активную или первую купленную. Если вообще ничего нет — ничего не делать.
     */
    const toggleFramesEnabled = async () => {
        try {
            if (frameEnabled) {
                // Запоминаем текущую активную, чтобы вернуть при следующем включении
                const currentActive = (shop?.frames || []).find(
                    f => f.active && isRenderableFrame(f)
                )
                if (currentActive) setLastFrameId(currentActive.id)

                await shopApi.unequipFrame()
                setFrameEnabled(false)
            } else {
                // Целевая рамка: lastFrameId → текущая активная → первая купленная (fallback)
                const currentActive = (shop?.frames || []).find(
                    f => f.active && isRenderableFrame(f)
                )
                const owned = (shop?.frames || []).filter(
                    f => f.owned && isRenderableFrame(f)
                )
                const targetId =
                    lastFrameId
                    || currentActive?.id
                    || owned[0]?.id
                    || null

                if (!targetId) return

                await shopApi.equipFrame(targetId)
                setFrameEnabled(true)
                setLastFrameId(targetId)
            }

            // Обновляем shop, но НЕ трогаем frameEnabled из ответа — состояние уже верное
            const { data } = await shopApi.get()
            setShop(data)
            window.dispatchEvent(new Event('shop:refresh'))
            window.dispatchEvent(new Event('user:refresh'))
        } catch (e) { flashErr(e) }
    }

    const pickAccent = (accent) => {
        setAppearanceForm(f => ({ ...f, accentCode: accent.code }))
        setPendingAccentId(accent.id)
    }

    if (!user) return <div className="loading">Loading...</div>

    const TABS = [
        ['profile', t.tabProfile || 'Профиль'],
        ['appearance', t.tabAppearance || 'Внешний вид'],
        ['locale', t.tabLocale || 'Язык и время'],
        ['workspace', t.tabWorkspace || 'Рабочее пространство'],
        ['display', t.tabDisplay || 'Отображение'],
        ['notification', t.tabNotification || 'Уведомления'],
    ]

    const activeAvatar = shop?.avatars?.find(a => a.active) || null
    const activeFrame = shop?.frames?.find(f => f.active && isRenderableFrame(f)) || null

    // Показываем только «валидные» рамки (с cssClass)
    const ownedFrames = useMemo(
        () => (shop?.frames || []).filter(f => f.owned && isRenderableFrame(f)),
        [shop]
    )

    const ownedAccents = (shop?.accents || []).filter(a => a.owned)
    const ownedAccentCodes = new Set(ownedAccents.map(a => a.code))

    const accentList = [
        ...BASE_ACCENTS.filter(b => !ownedAccentCodes.has(b.code)),
        ...ownedAccents,
    ]

    const currentAccentCode = appearanceForm.accentCode
    const currentAccent = accentList.find(a => a.code === currentAccentCode)
    const currentAccentId = pendingAccentId
        || currentAccent?.id
        || ownedAccents.find(a => a.active)?.id
        || null

    return (
        <div className="profile-page">
            <h1 className="profile-page__title">{t.userSettings || 'Настройки пользователя'}</h1>

            <div className="profile-tabs">
                {TABS.map(([code, label]) => (
                    <button
                        key={code}
                        className={`profile-tab ${tab === code ? 'active' : ''}`}
                        onClick={() => switchTab(code)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {msg && <div className="profile-msg profile-msg--success">{msg}</div>}
            {err && <div className="profile-msg profile-msg--error">{err}</div>}

            {tab === 'profile' && (
                <div className="profile-section">
                    <div className="profile-avatar-preview">
                        <div className={`avatar-frame ${activeFrame?.cssClass || ''}`}
                             style={{ width: 96, height: 96 }}>
                            <div className="avatar-frame__inner">
                                <AvatarVisual
                                    avatar={activeAvatar}
                                    displayName={user.profile?.displayName}
                                    username={user.username}
                                />
                            </div>
                        </div>
                        <div className="profile-avatar-preview__hint">
                            Аватарка и рамка выбираются из магазина 🛒
                        </div>
                        <Link to="/shop" className="btn btn-ghost" style={{ marginTop: 6 }}>
                            Перейти в магазин
                        </Link>
                    </div>

                    {shop && (
                        <>
                            <div className="profile-picker-title">
                                Купленные аватарки
                            </div>
                            {shop.avatars.filter(a => a.owned).length === 0 ? (
                                <div className="profile-picker-empty">
                                    Пока нет купленных аватарок. Откройте магазин, чтобы выбрать.
                                </div>
                            ) : (
                                <div className="profile-picker">
                                    {shop.avatars.filter(a => a.owned).map(a => {
                                        const isActive = a.active
                                        return (
                                            <button
                                                key={a.id}
                                                className={`profile-picker__item ${isActive ? 'profile-picker__item--active' : ''}`}
                                                onClick={() => applyAvatar(a.id)}
                                                title={a.title}
                                            >
                                                <AvatarVisual
                                                    avatar={a}
                                                    displayName={user.profile?.displayName}
                                                    username={user.username}
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* ── Заголовок «Купленные рамки» + тумблер справа ── */}
                            <div className="profile-picker-title-row">
                                <div className="profile-picker-title profile-picker-title--inline">
                                    Купленные рамки
                                </div>
                                {ownedFrames.length > 0 && (
                                    <div className="profile-picker-toggle">
                                        <span
                                            className="profile-picker-toggle__label"
                                            onClick={toggleFramesEnabled}
                                        >
                                            Включить рамку
                                        </span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={frameEnabled}
                                            className={`toggle ${frameEnabled ? 'toggle--on' : ''}`}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                toggleFramesEnabled()
                                            }}
                                        >
                                            <span className="toggle__thumb" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {ownedFrames.length === 0 ? (
                                <div className="profile-picker-empty">
                                    Пока нет купленных рамок. Откройте магазин, чтобы выбрать.
                                </div>
                            ) : (
                                <div className={`profile-picker ${!frameEnabled ? 'profile-picker--disabled' : ''}`}>
                                    {ownedFrames.map(f => {
                                        const isActive = frameEnabled && f.active
                                        return (
                                            <button
                                                key={f.id}
                                                className={`profile-picker__item ${isActive ? 'profile-picker__item--active' : ''}`}
                                                onClick={() => applyFrame(f.id)}
                                                title={f.title}
                                                disabled={!frameEnabled}
                                            >
                                                <span className={`profile-picker__frame ${f.cssClass || ''}`} />
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    <div className="profile-field" style={{ marginTop: 24 }}>
                        <label>{t.loginLabel || 'Логин'}</label>
                        <input className="input" value={user.username} disabled />
                    </div>
                    <div className="profile-field">
                        <label>{t.emailLabel || 'Email'}</label>
                        <input className="input" value={user.email} disabled />
                    </div>
                    <div className="profile-field">
                        <label>{t.displayNameLabel || 'Отображаемое имя'}</label>
                        <input
                            className="input"
                            value={profileForm.displayName}
                            onChange={(e) => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                        />
                    </div>
                    <div className="profile-field">
                        <label>{t.bioLabel || 'О себе'}</label>
                        <textarea
                            className="input"
                            value={profileForm.bio || ''}
                            onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={saveProfile}>
                        {t.saveProfile || 'Сохранить профиль'}
                    </button>
                </div>
            )}

            {tab === 'appearance' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.theme || 'Тема'}</label>
                        <select
                            className="input"
                            value={appearanceForm.theme}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, theme: e.target.value }))}
                        >
                            <option value="light">{t.themeLight || 'Светлая'}</option>
                            <option value="dark">{t.themeDark || 'Тёмная'}</option>
                            <option value="system">{t.themeSystem || 'Как в системе'}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.accentColor || 'Акцентный цвет'}</label>

                        {!shop ? (
                            <div className="profile-picker-empty">Загрузка…</div>
                        ) : accentList.length === 0 ? (
                            <div className="profile-picker-empty">
                                Нет доступных акцентов.
                            </div>
                        ) : (
                            <div className="accent-picker">
                                {accentList.map(a => (
                                    <AccentDot
                                        key={a.id}
                                        code={a.code}
                                        title={a.title}
                                        size={40}
                                        active={currentAccentId === a.id}
                                        onClick={() => pickAccent(a)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="profile-field">
                        <label>{t.density || 'Плотность'}</label>
                        <select
                            className="input"
                            value={appearanceForm.density}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, density: e.target.value }))}
                        >
                            <option value="compact">{t.densityCompact || 'Компактная'}</option>
                            <option value="cozy">{t.densityCozy || 'Удобная'}</option>
                            <option value="comfortable">{t.densityComfortable || 'Просторная'}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.treeKind || 'Вид дерева'}</label>
                        <select
                            className="input"
                            value={appearanceForm.treeKind || 'sakura'}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, treeKind: e.target.value }))}
                        >
                            <option value="apple">{t.treeApple || '🍎 Яблоня'}</option>
                            <option value="palm">{t.treePalm || '🌴 Пальма'}</option>
                            <option value="birch">{t.treeBirch || '🌳 Берёза'}</option>
                            <option value="sakura">{t.treeSakura || '🌸 Сакура'}</option>
                            <option value="xmas">{t.treeXmas || '🎄 Ёлка'}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <div className="toggle-row">
                            <span className="toggle-row__label">{t.showTree || 'Показывать дерево роста в сайдбаре'}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={appearanceForm.treeEnabled !== false}
                                className={`toggle ${appearanceForm.treeEnabled !== false ? 'toggle--on' : ''}`}
                                onClick={() => setAppearanceForm(f => ({
                                    ...f,
                                    treeEnabled: !(f.treeEnabled !== false),
                                }))}
                            >
                                <span className="toggle__thumb" />
                            </button>
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={saveAppearance}>
                        {t.apply || 'Применить'}
                    </button>
                </div>
            )}

            {tab === 'locale' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.language || 'Язык'}</label>
                        <select
                            className="input"
                            value={localeForm.language}
                            onChange={(e) => setLocaleForm(f => ({ ...f, language: e.target.value }))}
                        >
                            <option value="ru">{t.languageRu || 'Русский'}</option>
                            <option value="en">{t.languageEn || 'English'}</option>
                        </select>
                    </div>
                    <div className="profile-field">
                        <label>{t.timezone || 'Часовой пояс'}</label>
                        <select
                            className="input"
                            value={localeForm.timezone}
                            onChange={(e) => setLocaleForm(f => ({ ...f, timezone: e.target.value }))}
                        >
                            {RUSSIAN_TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={saveLocale}>
                        {t.apply || 'Применить'}
                    </button>
                </div>
            )}

            {tab === 'workspace' && (
                <div className="profile-section">
                    <div className="profile-field profile-field--card">
                        <div className="toggle-row">
                            <span className="toggle-row__label">
                                {t.launchToggle || 'Открывать доску при запуске'}
                                <HelpTip text="Если включено — при входе на сайт откроется выбранная доска (или конкретный проект). Иначе — календарь." />
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!!workspaceForm.defaultBoardId}
                                className={`toggle ${workspaceForm.defaultBoardId ? 'toggle--on' : ''}`}
                                onClick={() => {
                                    if (workspaceForm.defaultBoardId) {
                                        setWorkspaceForm(f => ({
                                            ...f,
                                            defaultBoardId: null,
                                            launchProjectId: null,
                                        }))
                                    } else {
                                        const firstBoardId = boards[0]?.id || null
                                        setWorkspaceForm(f => ({
                                            ...f,
                                            defaultBoardId: firstBoardId,
                                            launchProjectId: null,
                                        }))
                                    }
                                }}
                            >
                                <span className="toggle__thumb" />
                            </button>
                        </div>

                        {workspaceForm.defaultBoardId && (
                            <div className="profile-field--card-body">
                                <div className="profile-field">
                                    <label className="profile-field__label-row">
                                        <span>{t.defaultBoard || 'Доска по умолчанию'}</span>
                                    </label>
                                    <select
                                        className="input"
                                        value={workspaceForm.defaultBoardId || ''}
                                        onChange={(e) => {
                                            const v = e.target.value ? Number(e.target.value) : null
                                            setWorkspaceForm(f => ({
                                                ...f,
                                                defaultBoardId: v,
                                                launchProjectId: null,
                                            }))
                                        }}
                                    >
                                        {boards.map(b => (
                                            <option key={b.id} value={b.id}>{b.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="profile-field">
                                    <label className="profile-field__label-row">
                                        <span>{t.launchProject || 'Стартовый проект'}</span>
                                        <HelpTip text="Если выбрать — при запуске откроется именно этот проект. Если оставить пусто — откроется доска целиком." />
                                    </label>
                                    <select
                                        className="input"
                                        value={workspaceForm.launchProjectId || ''}
                                        onChange={(e) => {
                                            const v = e.target.value ? Number(e.target.value) : null
                                            setWorkspaceForm(f => ({ ...f, launchProjectId: v }))
                                        }}
                                    >
                                        <option value="">{t.openWholeBoard || '— Открыть всю доску —'}</option>
                                        {projectsOfDefaultBoard.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}{p.isMain ? ' (главный)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="profile-field">
                        <label className="profile-field__label-row">
                            <span>{t.defaultProject || 'Проект для новых задач из календаря'}</span>
                            <HelpTip text="Когда вы создаёте задачу прямо из календаря, она автоматически попадает в этот проект. Если ничего не выбрано — откроется обычное окно с выбором доски и проекта." />
                        </label>
                        <select
                            className="input"
                            value={workspaceForm.defaultProjectId || ''}
                            onChange={(e) => {
                                const v = e.target.value ? Number(e.target.value) : null
                                setWorkspaceForm(f => ({ ...f, defaultProjectId: v }))
                            }}
                        >
                            <option value="">{t.notSelected || '— Не выбрано —'}</option>
                            {allProjects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.boardTitle} → {p.title}{p.isMain ? ' (главный)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="profile-field">
                        <label className="profile-field__label-row">
                            <span>{t.tasksPerPage || 'Задач на странице'}</span>
                            <HelpTip text="Сколько задач подгружать за один раз в списках и на канбан-доске. Влияет на скорость загрузки." />
                        </label>
                        <input
                            className="input"
                            type="number"
                            min="10"
                            max="200"
                            value={workspaceForm.tasksPerPage}
                            onChange={(e) => setWorkspaceForm(f => ({ ...f, tasksPerPage: Number(e.target.value) }))}
                        />
                    </div>

                    <div className="profile-field profile-field--check">
                        <label>
                            <input
                                type="checkbox"
                                checked={workspaceForm.confirmBeforeDelete}
                                onChange={(e) => setWorkspaceForm(f => ({ ...f, confirmBeforeDelete: e.target.checked }))}
                            />
                            {t.confirmDelete || 'Спрашивать подтверждение перед удалением'}
                        </label>
                    </div>

                    <button className="btn btn-primary" onClick={saveWorkspace}>
                        {t.apply || 'Применить'}
                    </button>
                </div>
            )}

            {tab === 'display' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.taskSort || 'Сортировка задач'}</label>
                        <select
                            className="input"
                            value={displayForm.taskSortMode}
                            onChange={(e) => setDisplayForm(f => ({ ...f, taskSortMode: e.target.value }))}
                        >
                            <option value="manual">{t.sortManual || 'Ручная'}</option>
                            <option value="by_status">{t.sortByStatus || 'По статусу'}</option>
                            <option value="by_deadline">{t.sortByDeadline || 'По дедлайну'}</option>
                            <option value="by_priority">{t.sortByPriority || 'По приоритету'}</option>
                            <option value="by_created">{t.sortByCreated || 'По дате создания'}</option>
                        </select>
                    </div>
                    <div className="profile-field">
                        <label>{t.direction || 'Направление'}</label>
                        <select
                            className="input"
                            value={displayForm.taskSortDir}
                            onChange={(e) => setDisplayForm(f => ({ ...f, taskSortDir: e.target.value }))}
                        >
                            <option value="asc">{t.asc || 'По возрастанию'}</option>
                            <option value="desc">{t.desc || 'По убыванию'}</option>
                        </select>
                    </div>
                    <div className="profile-field">
                        <label>{t.viewProject || 'Вид проекта по умолчанию'}</label>
                        <select
                            className="input"
                            value={displayForm.projectViewMode}
                            onChange={(e) => setDisplayForm(f => ({ ...f, projectViewMode: e.target.value }))}
                        >
                            <option value="kanban">{t.viewKanban || 'Таблица'}</option>
                            <option value="list">{t.viewList || 'Список'}</option>
                            <option value="compact">{t.viewCompact || 'Компакт'}</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={saveDisplay}>
                        {t.apply || 'Применить'}
                    </button>
                </div>
            )}

            {tab === 'notification' && (
                <div className="profile-section">
                    <div className="profile-field profile-field--check">
                        <label>
                            <input
                                type="checkbox"
                                checked={notificationForm.notifyEmail}
                                onChange={(e) => setNotificationForm(f => ({ ...f, notifyEmail: e.target.checked }))}
                            />
                            {t.emailNotifications || 'Email-уведомления'}
                        </label>
                    </div>
                    <div className="profile-field profile-field--check">
                        <label>
                            <input
                                type="checkbox"
                                checked={notificationForm.notifyDeadline}
                                onChange={(e) => setNotificationForm(f => ({ ...f, notifyDeadline: e.target.checked }))}
                            />
                            {t.deadlineNotifications || 'Уведомления о дедлайнах'}
                        </label>
                    </div>
                    <div className="profile-field">
                        <label>{t.digest || 'Сводка'}</label>
                        <select
                            className="input"
                            value={notificationForm.notifyDigest}
                            onChange={(e) => setNotificationForm(f => ({ ...f, notifyDigest: e.target.value }))}
                        >
                            <option value="off">{t.digestOff || 'Не присылать'}</option>
                            <option value="daily">{t.digestDaily || 'Раз в день'}</option>
                            <option value="weekly">{t.digestWeekly || 'Раз в неделю'}</option>
                        </select>
                    </div>
                    <div className="profile-field">
                        <label>{t.remindBefore || 'Напомнить за N дней до дедлайна'}</label>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            max="30"
                            value={notificationForm.remindBeforeDays}
                            onChange={(e) => setNotificationForm(f => ({ ...f, remindBeforeDays: Number(e.target.value) }))}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={saveNotification}>
                        {t.apply || 'Применить'}
                    </button>
                </div>
            )}
        </div>
    )
}