import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi, attachmentsApi, boardsApi } from '../api/api'
import { resolveUrl } from '../utils/format'
import useT from '../hooks/useT'

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
    tasksPerPage: 50,
    confirmBeforeDelete: true,
}

const DEFAULT_DISPLAY = {
    taskSortMode: 'manual',
    taskSortDir: 'asc',
    projectViewMode: 'kanban',
}

const DEFAULT_NOTIFICATION = {
    notifyEmail: true,
    notifyDeadline: true,
    notifyDigest: 'daily',
    remindBeforeDays: 1,
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const t = useT()
    const [searchParams, setSearchParams] = useSearchParams()

    const initialTab = searchParams.get('tab') || 'profile'
    const [tab, setTab] = useState(initialTab)

    useEffect(() => {
        const urlTab = searchParams.get('tab')
        if (urlTab && urlTab !== tab) {
            setTab(urlTab)
        }
    }, [searchParams])

    const switchTab = (code) => {
        setTab(code)
        setSearchParams({ tab: code })
    }

    const [msg, setMsg] = useState(null)
    const [err, setErr] = useState(null)

    const [profileForm, setProfileForm] = useState({
        displayName: '',
        bio: '',
        avatarAttachmentId: null,
    })
    const [avatarPreview, setAvatarPreview] = useState(null)
    const fileInputRef = useRef(null)

    const [appearanceForm, setAppearanceForm] = useState(DEFAULT_APPEARANCE)
    const [localeForm, setLocaleForm] = useState(DEFAULT_LOCALE)
    const [workspaceForm, setWorkspaceForm] = useState(DEFAULT_WORKSPACE)
    const [boards, setBoards] = useState([])
    const [displayForm, setDisplayForm] = useState(DEFAULT_DISPLAY)
    const [notificationForm, setNotificationForm] = useState(DEFAULT_NOTIFICATION)

    useEffect(() => {
        if (!user) return

        setProfileForm({
            displayName: user.profile?.displayName || '',
            bio: user.profile?.bio || '',
            avatarAttachmentId: user.profile?.avatarAttachmentId || null,
        })
        setAvatarPreview(resolveUrl(user.profile?.avatarUrl))

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

    const flash = (m) => {
        setMsg(m); setErr(null)
        setTimeout(() => setMsg(null), 3000)
    }
    const flashErr = (e) => {
        setErr(e.response?.data?.message || e.message || 'Ошибка')
        setMsg(null)
    }

    const saveProfile = async () => {
        try {
            const { data } = await userApi.updateProfile(profileForm)
            updateUser({ profile: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    const uploadAvatar = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const { data: attachment } = await attachmentsApi.upload(file)
            setAvatarPreview(resolveUrl(attachment.url))
            const newProfile = { ...profileForm, avatarAttachmentId: attachment.id }
            setProfileForm(newProfile)
            const { data } = await userApi.updateProfile(newProfile)
            updateUser({ profile: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    const saveAppearance = async () => {
        try {
            const { data } = await userApi.updateAppearance(appearanceForm)
            updateUser({ appearance: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    const saveLocale = async () => {
        try {
            const { data } = await userApi.updateLocale(localeForm)
            updateUser({ locale: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    const saveWorkspace = async () => {
        try {
            const { data } = await userApi.updateWorkspace(workspaceForm)
            updateUser({ workspace: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    const saveDisplay = async () => {
        try {
            const { data } = await userApi.updateDisplay(displayForm)
            updateUser({ display: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    const saveNotification = async () => {
        try {
            const { data } = await userApi.updateNotification(notificationForm)
            updateUser({ notification: data })
            flash('OK')
        } catch (e) { flashErr(e) }
    }

    if (!user) return <div className="loading">Loading...</div>

    const TABS = [
        ['profile', t.tabProfile],
        ['appearance', t.tabAppearance],
        ['locale', t.tabLocale],
        ['workspace', t.tabWorkspace],
        ['display', t.tabDisplay],
        ['notification', t.tabNotification],
    ]

    return (
        <div className="profile-page">
            <h1 className="profile-page__title">{t.userSettings}</h1>

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
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {avatarPreview
                                ? <img src={avatarPreview} alt="avatar" />
                                : <div className="profile-avatar__placeholder">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>}
                        </div>
                        <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                            {t.avatarUpload}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={uploadAvatar}
                        />
                    </div>

                    <div className="profile-field">
                        <label>{t.loginLabel}</label>
                        <input className="input" value={user.username} disabled />
                    </div>

                    <div className="profile-field">
                        <label>{t.emailLabel}</label>
                        <input className="input" value={user.email} disabled />
                    </div>

                    <div className="profile-field">
                        <label>{t.displayNameLabel}</label>
                        <input
                            className="input"
                            value={profileForm.displayName}
                            onChange={(e) => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                        />
                    </div>

                    <div className="profile-field">
                        <label>{t.bioLabel}</label>
                        <textarea
                            className="input"
                            value={profileForm.bio || ''}
                            onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={saveProfile}>
                        {t.saveProfile}
                    </button>
                </div>
            )}

            {tab === 'appearance' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.theme}</label>
                        <select
                            className="input"
                            value={appearanceForm.theme}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, theme: e.target.value }))}
                        >
                            <option value="light">{t.themeLight}</option>
                            <option value="dark">{t.themeDark}</option>
                            <option value="system">{t.themeSystem}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.accentColor}</label>
                        <div className="accent-picker">
                            {['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`accent-picker__item ${appearanceForm.accentCode === c ? 'active' : ''}`}
                                    data-accent={c}
                                    onClick={() => setAppearanceForm(f => ({ ...f, accentCode: c }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="profile-field">
                        <label>{t.density}</label>
                        <select
                            className="input"
                            value={appearanceForm.density}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, density: e.target.value }))}
                        >
                            <option value="compact">{t.densityCompact}</option>
                            <option value="cozy">{t.densityCozy}</option>
                            <option value="comfortable">{t.densityComfortable}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <div className="toggle-row">
                            <span className="toggle-row__label">{t.showTree}</span>
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

                    {appearanceForm.treeEnabled !== false && (
                        <div className="profile-field">
                            <label>{t.treeKind}</label>
                            <select
                                className="input"
                                value={appearanceForm.treeKind || 'sakura'}
                                onChange={(e) => setAppearanceForm(f => ({
                                    ...f,
                                    treeKind: e.target.value,
                                }))}
                            >
                                <option value="sakura">{t.treeSakura}</option>
                                <option value="birch">{t.treeBirch}</option>
                                <option value="palm">{t.treePalm}</option>
                                <option value="apple">{t.treeApple}</option>
                            </select>
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={saveAppearance}>
                        {t.apply}
                    </button>
                </div>
            )}

            {tab === 'locale' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.language}</label>
                        <select
                            className="input"
                            value={localeForm.language}
                            onChange={(e) => setLocaleForm(f => ({ ...f, language: e.target.value }))}
                        >
                            <option value="ru">{t.languageRu}</option>
                            <option value="en">{t.languageEn}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.timezone}</label>
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
                        {t.apply}
                    </button>
                </div>
            )}

            {tab === 'workspace' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.defaultBoard}</label>
                        <select
                            className="input"
                            value={workspaceForm.defaultBoardId || ''}
                            onChange={(e) => setWorkspaceForm(f => ({
                                ...f,
                                defaultBoardId: e.target.value ? Number(e.target.value) : null,
                            }))}
                        >
                            <option value="">{t.notSelected}</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.tasksPerPage}</label>
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
                            {t.confirmDelete}
                        </label>
                    </div>

                    <button className="btn btn-primary" onClick={saveWorkspace}>
                        {t.apply}
                    </button>
                </div>
            )}

            {tab === 'display' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>{t.taskSort}</label>
                        <select
                            className="input"
                            value={displayForm.taskSortMode}
                            onChange={(e) => setDisplayForm(f => ({ ...f, taskSortMode: e.target.value }))}
                        >
                            <option value="manual">{t.sortManual}</option>
                            <option value="by_status">{t.sortByStatus}</option>
                            <option value="by_deadline">{t.sortByDeadline}</option>
                            <option value="by_priority">{t.sortByPriority}</option>
                            <option value="by_project">{t.sortByProject}</option>
                            <option value="by_created">{t.sortByCreated}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.direction}</label>
                        <select
                            className="input"
                            value={displayForm.taskSortDir}
                            onChange={(e) => setDisplayForm(f => ({ ...f, taskSortDir: e.target.value }))}
                        >
                            <option value="asc">{t.asc}</option>
                            <option value="desc">{t.desc}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.viewProject}</label>
                        <select
                            className="input"
                            value={displayForm.projectViewMode}
                            onChange={(e) => setDisplayForm(f => ({ ...f, projectViewMode: e.target.value }))}
                        >
                            <option value="kanban">{t.viewKanban}</option>
                            <option value="list">{t.viewList}</option>
                            <option value="compact">{t.viewCompact}</option>
                        </select>
                    </div>

                    <button className="btn btn-primary" onClick={saveDisplay}>
                        {t.apply}
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
                            {t.emailNotifications}
                        </label>
                    </div>

                    <div className="profile-field profile-field--check">
                        <label>
                            <input
                                type="checkbox"
                                checked={notificationForm.notifyDeadline}
                                onChange={(e) => setNotificationForm(f => ({ ...f, notifyDeadline: e.target.checked }))}
                            />
                            {t.deadlineNotifications}
                        </label>
                    </div>

                    <div className="profile-field">
                        <label>{t.digest}</label>
                        <select
                            className="input"
                            value={notificationForm.notifyDigest}
                            onChange={(e) => setNotificationForm(f => ({ ...f, notifyDigest: e.target.value }))}
                        >
                            <option value="off">{t.digestOff}</option>
                            <option value="daily">{t.digestDaily}</option>
                            <option value="weekly">{t.digestWeekly}</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>{t.remindBefore}</label>
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
                        {t.apply}
                    </button>
                </div>
            )}
        </div>
    )
}