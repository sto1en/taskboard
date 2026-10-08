import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi, boardsApi, shopApi } from '../api/api'
import useT from '../hooks/useT'
import AccentDot from '../components/shop/AccentDot'

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
const DEFAULT_WORKSPACE = { defaultBoardId: null, tasksPerPage: 50, confirmBeforeDelete: true }
const DEFAULT_DISPLAY = { taskSortMode: 'manual', taskSortDir: 'asc', projectViewMode: 'kanban' }
const DEFAULT_NOTIFICATION = { notifyEmail: true, notifyDeadline: true, notifyDigest: 'daily', remindBeforeDays: 1 }

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
    const [displayForm, setDisplayForm] = useState(DEFAULT_DISPLAY)
    const [notificationForm, setNotificationForm] = useState(DEFAULT_NOTIFICATION)

    const [pendingAccentId, setPendingAccentId] = useState(null)
    const [shop, setShop] = useState(null)

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

    const loadShop = () => {
        shopApi.get().then(({ data }) => setShop(data)).catch(() => setShop(null))
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
            if (pendingAccentId) {
                const owned = shop?.accents?.find(a => a.id === pendingAccentId && a.owned)
                if (!owned) await shopApi.buyAccent(pendingAccentId)
                await shopApi.equipAccent(pendingAccentId)
                setPendingAccentId(null)
                loadShop()
                window.dispatchEvent(new Event('shop:refresh'))
                window.dispatchEvent(new Event('user:refresh'))
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
            const { data } = await userApi.updateWorkspace(workspaceForm)
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
            loadShop()
            window.dispatchEvent(new Event('shop:refresh'))
            window.dispatchEvent(new Event('user:refresh'))
            flash('Сохранено')
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
    const activeFrame = shop?.frames?.find(f => f.active) || null

    const activeAccentId = pendingAccentId
        || shop?.accents?.find(a => a.active)?.id
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
                            <div className={`avatar-frame__inner ${activeAvatar?.cssClass || ''}`}>
                                {activeAvatar?.emoji
                                    ? <span className="avatar-frame__emoji">{activeAvatar.emoji}</span>
                                    : <span className="avatar-frame__initial">
                                        {(user.profile?.displayName || user.username).charAt(0).toUpperCase()}
                                      </span>}
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
                                                <span className="profile-picker__emoji">{a.emoji || '👤'}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="profile-picker-title" style={{ marginTop: 20 }}>
                                Купленные рамки
                            </div>
                            {shop.frames.filter(f => f.owned).length === 0 ? (
                                <div className="profile-picker-empty">
                                    Пока нет купленных рамок. Откройте магазин, чтобы выбрать.
                                </div>
                            ) : (
                                <div className="profile-picker">
                                    {shop.frames.filter(f => f.owned).map(f => {
                                        const isActive = f.active
                                        return (
                                            <button
                                                key={f.id}
                                                className={`profile-picker__item ${isActive ? 'profile-picker__item--active' : ''}`}
                                                onClick={() => applyFrame(f.id)}
                                                title={f.title}
                                            >
                                                <span className={`profile-picker__frame ${f.cssClass || ''}`}>
                                                    <span className="profile-picker__frame-inner">Т</span>
                                                </span>
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
                        ) : (shop.accents || []).filter(a => a.owned).length === 0 ? (
                            <div className="profile-picker-empty">
                                Пока нет купленных акцентов. Откройте магазин, чтобы выбрать.
                                <div style={{ marginTop: 8 }}>
                                    <Link to="/shop" className="btn btn-ghost">Перейти в магазин</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="accent-picker">
                                {(shop.accents || [])
                                    .filter(a => a.owned)
                                    .map(a => (
                                        <AccentDot
                                            key={a.id}
                                            code={a.code}
                                            title={a.title}
                                            size={40}
                                            active={activeAccentId === a.id}
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
                    <div className="profile-field">
                        <label>{t.defaultBoard || 'Доска по умолчанию'}</label>
                        <select
                            className="input"
                            value={workspaceForm.defaultBoardId || ''}
                            onChange={(e) => setWorkspaceForm(f => ({
                                ...f,
                                defaultBoardId: e.target.value ? Number(e.target.value) : null,
                            }))}
                        >
                            <option value="">{t.notSelected || '— Не выбрано —'}</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="profile-field">
                        <label>{t.tasksPerPage || 'Задач на странице'}</label>
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