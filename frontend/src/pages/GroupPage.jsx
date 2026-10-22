import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { groupApi, userGroupsApi, usersApi } from '../api/api'
import { fetchGroupProjects } from '../store/slices/sidebarSlice'
import { useAuth } from '../context/AuthContext'
import AvatarWithFrame from '../components/layout/AvatarWithFrame'
import ConfirmModal from '../components/common/ConfirmModal'

function memberAvatar(m) {
    return {
        code: m.avatarCode,
        emoji: m.avatarEmoji,
        imageUrl: m.avatarImageUrl || m.avatarUrl,
    }
}

/**
 * «Групповое» — групповые проекты и пользовательские группы.
 *
 * Пользовательская группа — это именованный список людей. Владелец может
 * добавить человека (тот получит приглашение), а после согласия — одной
 * кнопкой пригласить всю группу в кооперативный проект.
 */
export default function GroupPage() {
    const nav = useNavigate()
    const dispatch = useDispatch()
    const { user } = useAuth()

    const [projects, setProjects] = useState([])
    const [groups, setGroups] = useState([])
    const [groupInvites, setGroupInvites] = useState([])
    const [projectInvites, setProjectInvites] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notice, setNotice] = useState(null)

    // Групповой проект
    const [creating, setCreating] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [invite, setInvite] = useState(null)
    const [inviteBusy, setInviteBusy] = useState(null)
    const [copied, setCopied] = useState(false)

    // Пользовательские группы
    const [showGroupForm, setShowGroupForm] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupBusy, setGroupBusy] = useState(false)
    const [expandedGroup, setExpandedGroup] = useState(null)
    const [searchGroupId, setSearchGroupId] = useState(null)
    const [memberQuery, setMemberQuery] = useState('')
    const [memberResults, setMemberResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [inviteTargets, setInviteTargets] = useState({})

    // Подтверждения (удаление группы/выход из проекта/участника)
    const [confirm, setConfirm] = useState(null)
    const [confirmBusy, setConfirmBusy] = useState(false)

    const load = async () => {
        setError(null)
        const [p, g, gi, pi] = await Promise.all([
            groupApi.list(),
            userGroupsApi.list(),
            userGroupsApi.invitations(),
            userGroupsApi.projectInvitations(),
        ])
        setProjects(p.data || [])
        setGroups(g.data || [])
        setGroupInvites(gi.data || [])
        setProjectInvites(pi.data || [])
        // Боковая панель показывает групповые проекты как проекты
        // виртуальной доски «Групповая» — держим её список в актуальном виде.
        dispatch(fetchGroupProjects())
    }

    useEffect(() => {
        load()
            .catch(err => setError(err.response?.data?.message || 'Не удалось загрузить данные'))
            .finally(() => setLoading(false))
        // eslint-disable-next-line
    }, [])

    // Поиск людей для добавления в группу
    useEffect(() => {
        if (!searchGroupId) return
        const q = memberQuery.trim()
        if (!q) {
            setMemberResults([])
            return
        }
        setSearching(true)
        const timer = setTimeout(() => {
            usersApi.search(q)
                .then(({ data }) => setMemberResults(data || []))
                .catch(() => setMemberResults([]))
                .finally(() => setSearching(false))
        }, 250)
        return () => clearTimeout(timer)
    }, [memberQuery, searchGroupId])

    const flash = (text) => {
        setNotice(text)
        setTimeout(() => setNotice(null), 4000)
    }

    // ============================================================
    // Групповые проекты
    // ============================================================

    const create = async (e) => {
        e.preventDefault()
        if (!title.trim() || creating) return
        setCreating(true)
        setError(null)
        try {
            const { data } = await groupApi.create({ title: title.trim(), description })
            setTitle('')
            setDescription('')
            setShowForm(false)
            await load()
            nav(`/group/${data.id}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось создать проект')
        } finally {
            setCreating(false)
        }
    }

    const createInvite = async (project) => {
        if (inviteBusy) return
        setInviteBusy(project.id)
        setCopied(false)
        try {
            const { data } = await groupApi.invite(project.id)
            setInvite({ ...data, link: `${window.location.origin}${data.path}` })
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось создать приглашение')
        } finally {
            setInviteBusy(null)
        }
    }

    const copyInvite = async () => {
        if (!invite?.link) return
        try {
            await navigator.clipboard.writeText(invite.link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(false)
        }
    }

    // ============================================================
    // Пользовательские группы
    // ============================================================

    const createGroup = async (e) => {
        e.preventDefault()
        if (!groupName.trim() || groupBusy) return
        setGroupBusy(true)
        try {
            await userGroupsApi.create(groupName.trim())
            setGroupName('')
            setShowGroupForm(false)
            await load()
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось создать группу')
        } finally {
            setGroupBusy(false)
        }
    }

    const addMember = async (group, userId) => {
        setGroupBusy(true)
        try {
            const { data } = await userGroupsApi.addMember(group.id, userId)
            setGroups(prev => prev.map(g => g.id === group.id ? data : g))
            setMemberQuery('')
            setMemberResults([])
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось пригласить')
        } finally {
            setGroupBusy(false)
        }
    }

    const inviteGroup = async (group) => {
        const projectId = inviteTargets[group.id]
        if (!projectId) return
        setGroupBusy(true)
        try {
            const { data } = await userGroupsApi.inviteToProject(group.id, Number(projectId))
            flash(`Приглашено: ${data.invited}. Уже в проекте: ${data.skipped}.`)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось пригласить группу')
        } finally {
            setGroupBusy(false)
        }
    }

    const acceptGroupInvite = async (inv) => {
        try {
            await userGroupsApi.acceptInvite(inv.groupId)
            await load()
            flash(`Группа «${inv.groupName}» добавлена вам`)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось принять приглашение')
        }
    }

    const declineGroupInvite = async (inv) => {
        try {
            await userGroupsApi.declineInvite(inv.groupId)
            await load()
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось отклонить приглашение')
        }
    }

    const acceptProjectInvite = async (inv) => {
        try {
            await groupApi.join(inv.token)
            await load()
            nav(`/group/${inv.projectId}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось присоединиться к проекту')
        }
    }

    const declineProjectInvite = async (inv) => {
        try {
            await userGroupsApi.declineProjectInvite(inv.token)
            await load()
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось отклонить приглашение')
        }
    }

    const askRemoveGroup = (group) => setConfirm({
        title: 'Удалить группу?',
        text: `Группа «${group.name}» будет удалена. У участников её копия останется.`,
        confirmLabel: 'Удалить',
        danger: true,
        action: async () => {
            await userGroupsApi.remove(group.id)
            await load()
            flash('Группа удалена')
        },
    })

    const askRemoveMember = (group, member) => setConfirm({
        title: member.isMe ? 'Выйти из группы?' : 'Убрать из группы?',
        text: member.isMe
            ? `Вы выйдете из группы «${group.name}».`
            : `Убрать «${member.displayName}» из группы «${group.name}»?`,
        confirmLabel: member.isMe ? 'Выйти' : 'Убрать',
        danger: true,
        action: async () => {
            await userGroupsApi.removeMember(group.id, member.userId)
            await load()
        },
    })

    const askLeaveProject = (project) => setConfirm({
        title: 'Покинуть проект?',
        text: `Вы потеряете доступ к задачам проекта «${project.title}».`,
        confirmLabel: 'Покинуть',
        danger: true,
        action: async () => {
            await groupApi.removeMember(project.id, user?.id)
            await load()
            flash('Вы покинули проект')
        },
    })

    const runConfirm = async () => {
        if (!confirm) return
        setConfirmBusy(true)
        setError(null)
        try {
            await confirm.action()
            setConfirm(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось выполнить действие')
            setConfirm(null)
        } finally {
            setConfirmBusy(false)
        }
    }

    const canInviteToProject = (group) => group.isOwner
    const projectLabel = (p) => p.title

    if (loading) return <div className="loading">Загрузка…</div>

    return (
        <div className="group-page">
            <header className="group-page__head">
                <div>
                    <nav className="group-page__crumbs" aria-label="Навигация">
                        <Link to="/boards" className="group-page__crumb">← Доски</Link>
                        <span className="group-page__crumb-sep">/</span>
                        <span className="group-page__crumb-current">Групповая</span>
                    </nav>
                    <h1 className="group-page__title">Групповая доска</h1>
                    <p className="group-page__sub">
                        Доска для совместных проектов. Участники видят только те проекты,
                        в которые их пригласили, — ваша личная доска и остальные проекты
                        остаются закрытыми.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowForm(v => !v)}
                >
                    {showForm ? 'Отмена' : '+ Групповой проект'}
                </button>
            </header>

            {error && <div className="group-page__error">{error}</div>}
            {notice && <div className="group-page__notice">{notice}</div>}

            {showForm && (
                <form className="group-create" onSubmit={create}>
                    <input
                        className="input"
                        placeholder="Название проекта"
                        value={title}
                        maxLength={200}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                    />
                    <textarea
                        className="input group-create__desc"
                        placeholder="Описание (необязательно)"
                        value={description}
                        maxLength={4000}
                        rows={3}
                        onChange={e => setDescription(e.target.value)}
                    />
                    <div className="group-create__actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!title.trim() || creating}
                        >
                            {creating ? 'Создаём…' : 'Создать'}
                        </button>
                    </div>
                </form>
            )}

            <section className="group-page__projects">
                <div className="ug-section__head">
                    <h2 className="ug-section__title">📁 Проекты доски</h2>
                    <span className="projects-section__count">{projects.length}</span>
                </div>

                {projects.length === 0 ? (
                    <div className="group-empty">
                        <span className="group-empty__icon" aria-hidden="true">👥</span>
                        <h2>Пока нет групповых проектов</h2>
                        <p>
                            Создайте проект и отправьте ссылку-приглашение — человек сможет
                            работать с задачами, не видя вашу доску.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setShowForm(true)}
                        >
                            Создать первый проект
                        </button>
                    </div>
                ) : (
                    <div className="group-grid">
                        {projects.map(p => {
                            const pct = p.taskTotal > 0
                                ? Math.round((p.taskDone / p.taskTotal) * 100)
                                : 0
                            return (
                                <article key={p.id} className="group-card">
                                    <div className="group-card__head">
                                        <h2 className="group-card__title" title={p.title}>{p.title}</h2>
                                        <span className={`group-card__role group-card__role--${p.role}`}>
                                            {p.role === 'owner' ? 'владелец' : p.role === 'editor' ? 'участник' : 'читатель'}
                                        </span>
                                    </div>

                                    {p.description && (
                                        <p className="group-card__desc">{p.description}</p>
                                    )}

                                    <div className="group-card__progress">
                                        <div className="group-card__bar">
                                            <span style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="group-card__progress-text">
                                            {p.taskDone} / {p.taskTotal} задач
                                        </span>
                                    </div>

                                    <div className="group-card__meta">
                                        <span>👥 {p.memberCount}</span>
                                        {p.taskActive > 0 && <span>⚡ {p.taskActive} в работе</span>}
                                    </div>

                                    <div className="group-card__actions">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => nav(`/group/${p.id}`)}
                                        >
                                            Открыть
                                        </button>
                                        {p.canEdit && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                onClick={() => createInvite(p)}
                                                disabled={inviteBusy === p.id}
                                            >
                                                {inviteBusy === p.id ? '…' : 'Пригласить'}
                                            </button>
                                        )}
                                        {!p.isOwner && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost group-card__leave"
                                                onClick={() => askLeaveProject(p)}
                                            >
                                                Покинуть
                                            </button>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>

            {groupInvites.length > 0 && (
                <section className="ug-invites">
                    <h2 className="ug-section__title">👋 Приглашения в группы</h2>
                    <div className="ug-invite-list">
                        {groupInvites.map(inv => (
                            <div key={inv.groupId} className="ug-invite">
                                <div className="ug-invite__text">
                                    <b>{inv.ownerDisplayName || inv.ownerUsername}</b>
                                    {' приглашает вас в группу '}
                                    <b>«{inv.groupName}»</b>
                                    <span className="ug-invite__meta"> · уже {inv.acceptedCount} чел.</span>
                                </div>
                                <div className="ug-invite__actions">
                                    <button type="button" className="btn btn-primary"
                                            onClick={() => acceptGroupInvite(inv)}>
                                        Принять
                                    </button>
                                    <button type="button" className="btn btn-ghost"
                                            onClick={() => declineGroupInvite(inv)}>
                                        Отклонить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {projectInvites.length > 0 && (
                <section className="ug-invites">
                    <h2 className="ug-section__title">📨 Приглашения в проекты</h2>
                    <div className="ug-invite-list">
                        {projectInvites.map(inv => (
                            <div key={inv.token} className="ug-invite">
                                <div className="ug-invite__text">
                                    <b>{inv.fromDisplayName || inv.fromUsername}</b>
                                    {' приглашает вас в проект '}
                                    <b>«{inv.projectTitle}»</b>
                                </div>
                                <div className="ug-invite__actions">
                                    <button type="button" className="btn btn-primary"
                                            onClick={() => acceptProjectInvite(inv)}>
                                        Присоединиться
                                    </button>
                                    <button type="button" className="btn btn-ghost"
                                            onClick={() => declineProjectInvite(inv)}>
                                        Отклонить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="ug-section">
                <div className="ug-section__head">
                    <div>
                        <h2 className="ug-section__title">👥 Мои группы</h2>
                        <p className="ug-section__sub">
                            Соберите людей в группу и приглашайте всех в кооп-проект одной кнопкой.
                            Человек должен принять приглашение в группу — тогда она появится и у него.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowGroupForm(v => !v)}
                    >
                        {showGroupForm ? 'Отмена' : '+ Группа'}
                    </button>
                </div>

                {showGroupForm && (
                    <form className="group-create" onSubmit={createGroup}>
                        <input
                            className="input"
                            placeholder="Название группы, например «Друзья»"
                            value={groupName}
                            maxLength={64}
                            onChange={e => setGroupName(e.target.value)}
                            autoFocus
                        />
                        <div className="group-create__actions">
                            <button type="submit" className="btn btn-primary"
                                    disabled={!groupName.trim() || groupBusy}>
                                {groupBusy ? 'Создаём…' : 'Создать группу'}
                            </button>
                        </div>
                    </form>
                )}

                {groups.length === 0 ? (
                    <div className="ug-empty">
                        Пока нет групп. Создайте группу и добавьте в неё людей по нику.
                    </div>
                ) : (
                    <div className="ug-grid">
                        {groups.map(g => {
                            const expanded = expandedGroup === g.id
                            const existingIds = new Set(g.members.map(m => m.userId))
                            const candidates = memberResults.filter(u => !existingIds.has(u.userId))
                            return (
                                <article key={g.id} className="ug-card">
                                    <div className="ug-card__head">
                                        <div>
                                            <h3 className="ug-card__title">{g.name}</h3>
                                            <div className="ug-card__meta">
                                                <span>✅ {g.acceptedCount}</span>
                                                {g.pendingCount > 0 && <span>⏳ {g.pendingCount}</span>}
                                                {g.originGroupId && <span className="ug-card__mirror">принята от другого</span>}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost ug-card__expand"
                                            onClick={() => {
                                                setExpandedGroup(expanded ? null : g.id)
                                                setSearchGroupId(expanded ? null : g.id)
                                                setMemberQuery('')
                                                setMemberResults([])
                                            }}
                                        >
                                            {expanded ? 'Свернуть' : 'Состав'}
                                        </button>
                                    </div>

                                    {expanded && (
                                        <div className="ug-members">
                                            {g.members.map(m => (
                                                <div key={m.userId} className="ug-member">
                                                    <AvatarWithFrame
                                                        avatar={memberAvatar(m)}
                                                        frame={{ cssClass: m.frameCssClass }}
                                                        displayName={m.displayName}
                                                        username={m.username}
                                                        size={30}
                                                    />
                                                    <div className="ug-member__names">
                                                        <span className="ug-member__name">{m.displayName}</span>
                                                        <span className="ug-member__username">@{m.username}</span>
                                                    </div>
                                                    {m.isOwner ? (
                                                        <span className="ug-member__badge">владелец</span>
                                                    ) : m.status === 'pending' ? (
                                                        <span className="ug-member__badge ug-member__badge--pending">ждёт</span>
                                                    ) : (
                                                        <span className="ug-member__badge ug-member__badge--ok">в группе</span>
                                                    )}
                                                    {!m.isOwner && (
                                                        <button
                                                            type="button"
                                                            className="ug-member__remove"
                                                            title={m.isMe ? 'Выйти' : 'Убрать'}
                                                            onClick={() => askRemoveMember(g, m)}
                                                        >×</button>
                                                    )}
                                                </div>
                                            ))}

                                            {g.isOwner && (
                                                <div className="ug-search">
                                                    <input
                                                        className="input"
                                                        placeholder="Добавить человека по нику…"
                                                        value={searchGroupId === g.id ? memberQuery : ''}
                                                        onFocus={() => {
                                                            if (searchGroupId !== g.id) {
                                                                setSearchGroupId(g.id)
                                                                setMemberQuery('')
                                                                setMemberResults([])
                                                            }
                                                        }}
                                                        onChange={e => {
                                                            setSearchGroupId(g.id)
                                                            setMemberQuery(e.target.value)
                                                        }}
                                                    />
                                                    {searchGroupId === g.id && memberQuery.trim() && (
                                                        <div className="ug-search__results">
                                                            {searching && <div className="ug-search__empty">Поиск…</div>}
                                                            {!searching && candidates.length === 0 && (
                                                                <div className="ug-search__empty">Никого не найдено</div>
                                                            )}
                                                            {!searching && candidates.map(u => (
                                                                <button
                                                                    key={u.userId}
                                                                    type="button"
                                                                    className="ug-search__item"
                                                                    onClick={() => addMember(g, u.userId)}
                                                                    disabled={groupBusy}
                                                                >
                                                                    <AvatarWithFrame
                                                                        avatar={{ imageUrl: u.avatarUrl }}
                                                                        displayName={u.displayName}
                                                                        username={u.username}
                                                                        size={28}
                                                                    />
                                                                    <span>{u.displayName}</span>
                                                                    <small>@{u.username}</small>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {canInviteToProject(g) && projects.length > 0 && (
                                        <div className="ug-card__invite">
                                            <select
                                                className="input ug-card__select"
                                                value={inviteTargets[g.id] || ''}
                                                onChange={e => setInviteTargets(prev => ({
                                                    ...prev,
                                                    [g.id]: e.target.value,
                                                }))}
                                            >
                                                <option value="">— выбрать проект —</option>
                                                {projects.filter(p => p.canEdit).map(p => (
                                                    <option key={p.id} value={p.id}>{projectLabel(p)}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                disabled={!inviteTargets[g.id] || groupBusy}
                                                onClick={() => inviteGroup(g)}
                                            >
                                                Пригласить группу
                                            </button>
                                        </div>
                                    )}

                                    {g.isOwner && (
                                        <div className="ug-card__footer">
                                            <button
                                                type="button"
                                                className="btn btn-ghost ug-card__danger"
                                                onClick={() => askRemoveGroup(g)}
                                            >
                                                Удалить группу
                                            </button>
                                        </div>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>

            {invite && (
                <div className="group-invite-overlay" onClick={() => setInvite(null)}>
                    <div className="group-invite" onClick={e => e.stopPropagation()}>
                        <h3 className="group-invite__title">Приглашение в «{invite.projectTitle}»</h3>
                        <p className="group-invite__hint">
                            Отправьте ссылку. Приглашённый получит доступ только к этому
                            проекту — доска и остальные проекты останутся закрытыми.
                        </p>
                        <div className="group-invite__row">
                            <input className="input" readOnly value={invite.link} onFocus={e => e.target.select()} />
                            <button type="button" className="btn btn-primary" onClick={copyInvite}>
                                {copied ? 'Скопировано' : 'Копировать'}
                            </button>
                        </div>
                        <p className="group-invite__exp">
                            Ссылка действует до {new Date(invite.expiresAt).toLocaleDateString('ru-RU')}.
                        </p>
                        <div className="group-invite__actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setInvite(null)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!confirm}
                title={confirm?.title || ''}
                text={confirm?.text || ''}
                confirmLabel={confirm?.confirmLabel || 'ОК'}
                cancelLabel="Отмена"
                danger={confirm?.danger}
                loading={confirmBusy}
                onConfirm={runConfirm}
                onClose={() => !confirmBusy && setConfirm(null)}
            />
        </div>
    )
}
