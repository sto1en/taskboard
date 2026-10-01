import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { userApi, attachmentsApi, boardsApi } from '../api/api'
import { resolveUrl } from '../utils/format'

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
    projectViewMode: 'auto',
}

const DEFAULT_NOTIFICATION = {
    notifyEmail: true,
    notifyDeadline: true,
    notifyDigest: 'daily',
    remindBeforeDays: 1,
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const [tab, setTab] = useState('profile')
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
            flash('Профиль сохранён')
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
            flash('Аватар обновлён')
        } catch (e) { flashErr(e) }
    }

    const saveAppearance = async () => {
        try {
            const { data } = await userApi.updateAppearance(appearanceForm)
            updateUser({ appearance: data })
            flash('Внешний вид сохранён')
        } catch (e) { flashErr(e) }
    }

    const saveLocale = async () => {
        try {
            const { data } = await userApi.updateLocale(localeForm)
            updateUser({ locale: data })
            flash('Локаль сохранена')
        } catch (e) { flashErr(e) }
    }

    const saveWorkspace = async () => {
        try {
            const { data } = await userApi.updateWorkspace(workspaceForm)
            updateUser({ workspace: data })
            flash('Настройки сохранены')
        } catch (e) { flashErr(e) }
    }

    const saveDisplay = async () => {
        try {
            const { data } = await userApi.updateDisplay(displayForm)
            updateUser({ display: data })
            flash('Настройки сохранены')
        } catch (e) { flashErr(e) }
    }

    const saveNotification = async () => {
        try {
            const { data } = await userApi.updateNotification(notificationForm)
            updateUser({ notification: data })
            flash('Уведомления сохранены')
        } catch (e) { flashErr(e) }
    }

    if (!user) return <div className="loading">Загрузка...</div>

    return (
        <div className="profile-page">
            <h1 className="profile-page__title">Настройки пользователя</h1>

            <div className="profile-tabs">
                {[
                    ['profile', 'Профиль'],
                    ['appearance', 'Внешний вид'],
                    ['locale', 'Язык и время'],
                    ['workspace', 'Рабочее пространство'],
                    ['display', 'Отображение'],
                    ['notification', 'Уведомления'],
                ].map(([code, label]) => (
                    <button
                        key={code}
                        className={`profile-tab ${tab === code ? 'active' : ''}`}
                        onClick={() => setTab(code)}
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
                            Загрузить аватар
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
                        <label>Логин (нельзя изменить)</label>
                        <input className="input" value={user.username} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Email (нельзя изменить)</label>
                        <input className="input" value={user.email} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Отображаемое имя</label>
                        <input
                            className="input"
                            value={profileForm.displayName}
                            onChange={(e) => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                        />
                    </div>

                    <div className="profile-field">
                        <label>О себе</label>
                        <textarea
                            className="input"
                            value={profileForm.bio || ''}
                            onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                        />
                    </div>

                    <button className="btn btn-primary" onClick={saveProfile}>
                        Сохранить профиль
                    </button>
                </div>
            )}

            {tab === 'appearance' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>Тема</label>
                        <select
                            className="input"
                            value={appearanceForm.theme}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, theme: e.target.value }))}
                        >
                            <option value="light">Светлая</option>
                            <option value="dark">Тёмная</option>
                            <option value="system">Как в системе</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>Акцентный цвет</label>
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
                        <label>Плотность</label>
                        <select
                            className="input"
                            value={appearanceForm.density}
                            onChange={(e) => setAppearanceForm(f => ({ ...f, density: e.target.value }))}
                        >
                            <option value="compact">Компактная</option>
                            <option value="cozy">Удобная</option>
                            <option value="comfortable">Просторная</option>
                        </select>
                    </div>

                    <div className="profile-field profile-field--check">
                        <label>
                            <input
                                type="checkbox"
                                checked={appearanceForm.treeEnabled !== false}
                                onChange={(e) => setAppearanceForm(f => ({
                                    ...f,
                                    treeEnabled: e.target.checked,
                                }))}
                            />
                            Показывать дерево роста в сайдбаре
                        </label>
                    </div>

                    {appearanceForm.treeEnabled !== false && (
                        <div className="profile-field">
                            <label>Вид дерева</label>
                            <select
                                className="input"
                                value={appearanceForm.treeKind || 'sakura'}
                                onChange={(e) => setAppearanceForm(f => ({
                                    ...f,
                                    treeKind: e.target.value,
                                }))}
                            >
                                <option value="sakura">🌸 Сакура</option>
                                <option value="birch">🌳 Берёза</option>
                                <option value="palm">🌴 Пальма</option>
                                <option value="apple">🍎 Яблоня</option>
                            </select>
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={saveAppearance}>
                        Применить
                    </button>
                </div>
            )}

            {tab === 'locale' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>Язык</label>
                        <select
                            className="input"
                            value={localeForm.language}
                            onChange={(e) => setLocaleForm(f => ({ ...f, language: e.target.value }))}
                        >
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>Часовой пояс</label>
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
                        Применить
                    </button>
                </div>
            )}

            {tab === 'workspace' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>Доска по умолчанию</label>
                        <select
                            className="input"
                            value={workspaceForm.defaultBoardId || ''}
                            onChange={(e) => setWorkspaceForm(f => ({
                                ...f,
                                defaultBoardId: e.target.value ? Number(e.target.value) : null,
                            }))}
                        >
                            <option value="">— Не выбрано —</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>Задач на странице</label>
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
                            Спрашивать подтверждение перед удалением
                        </label>
                    </div>

                    <button className="btn btn-primary" onClick={saveWorkspace}>
                        Применить
                    </button>
                </div>
            )}

            {tab === 'display' && (
                <div className="profile-section">
                    <div className="profile-field">
                        <label>Сортировка задач</label>
                        <select
                            className="input"
                            value={displayForm.taskSortMode}
                            onChange={(e) => setDisplayForm(f => ({ ...f, taskSortMode: e.target.value }))}
                        >
                            <option value="manual">Ручная</option>
                            <option value="by_status">По статусу</option>
                            <option value="by_deadline">По дедлайну</option>
                            <option value="by_priority">По приоритету</option>
                            <option value="by_project">По проекту</option>
                            <option value="by_created">По дате создания</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>Направление</label>
                        <select
                            className="input"
                            value={displayForm.taskSortDir}
                            onChange={(e) => setDisplayForm(f => ({ ...f, taskSortDir: e.target.value }))}
                        >
                            <option value="asc">По возрастанию</option>
                            <option value="desc">По убыванию</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>Вид проекта</label>
                        <select
                            className="input"
                            value={displayForm.projectViewMode}
                            onChange={(e) => setDisplayForm(f => ({ ...f, projectViewMode: e.target.value }))}
                        >
                            <option value="auto">Автоматически</option>
                            <option value="kanban">Kanban</option>
                            <option value="list">Список</option>
                            <option value="compact">Компакт</option>
                        </select>
                    </div>

                    <button className="btn btn-primary" onClick={saveDisplay}>
                        Применить
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
                            Email-уведомления
                        </label>
                    </div>

                    <div className="profile-field profile-field--check">
                        <label>
                            <input
                                type="checkbox"
                                checked={notificationForm.notifyDeadline}
                                onChange={(e) => setNotificationForm(f => ({ ...f, notifyDeadline: e.target.checked }))}
                            />
                            Уведомления о дедлайнах
                        </label>
                    </div>

                    <div className="profile-field">
                        <label>Сводка</label>
                        <select
                            className="input"
                            value={notificationForm.notifyDigest}
                            onChange={(e) => setNotificationForm(f => ({ ...f, notifyDigest: e.target.value }))}
                        >
                            <option value="off">Не присылать</option>
                            <option value="daily">Раз в день</option>
                            <option value="weekly">Раз в неделю</option>
                        </select>
                    </div>

                    <div className="profile-field">
                        <label>Напомнить за N дней до дедлайна</label>
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
                        Применить
                    </button>
                </div>
            )}
        </div>
    )
}