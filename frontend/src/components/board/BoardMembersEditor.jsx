import { useEffect, useRef, useState } from 'react'
import { boardMembersApi, usersApi } from '../../api/api'
import ConfirmModal from '../common/ConfirmModal'
import useT from '../../hooks/useT'

export default function BoardMembersEditor({ boardId, ownerRole }) {
    const t = useT()

    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [showResults, setShowResults] = useState(false)
    const [searching, setSearching] = useState(false)

    const [adding, setAdding] = useState(false)

    // Подтверждение удаления — своя модалка
    const [pendingRemove, setPendingRemove] = useState(null)   // { userId, displayName }
    const [removing, setRemoving] = useState(false)

    const isOwner = ownerRole === 'owner'
    const wrapperRef = useRef(null)

    const load = () => {
        setLoading(true)
        boardMembersApi.list(boardId)
            .then(({ data }) => setMembers(data))
            .catch(err => setError(err.response?.data?.message || 'Ошибка'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (boardId) load()
    }, [boardId])

    useEffect(() => {
        if (!isOwner) return
        const q = query.trim()
        if (q.length < 1) {
            setResults([])
            setShowResults(false)
            return
        }
        setSearching(true)
        const timer = setTimeout(() => {
            usersApi.search(q)
                .then(({ data }) => {
                    const existing = new Set(members.map(m => m.userId))
                    setResults(data.filter(u => !existing.has(u.userId)))
                    setShowResults(true)
                })
                .catch(() => setResults([]))
                .finally(() => setSearching(false))
        }, 250)
        return () => clearTimeout(timer)
    }, [query, members, isOwner])

    useEffect(() => {
        const onClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowResults(false)
            }
        }
        window.addEventListener('mousedown', onClick)
        return () => window.removeEventListener('mousedown', onClick)
    }, [])

    const addMember = async (userId) => {
        setAdding(true)
        setError(null)
        try {
            const { data } = await boardMembersApi.add(boardId, {
                userId,
                role: 'editor',
            })
            setMembers(prev => [...prev, data])
            setQuery('')
            setResults([])
            setShowResults(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        } finally {
            setAdding(false)
        }
    }

    const changeRole = async (userId, role) => {
        try {
            const { data } = await boardMembersApi.update(boardId, userId, { role })
            setMembers(prev => prev.map(m => m.userId === userId ? data : m))
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    // Открыть модалку подтверждения
    const requestRemove = (member) => {
        setPendingRemove({ userId: member.userId, displayName: member.displayName })
    }

    // Подтвердить удаление
    const confirmRemove = async () => {
        if (!pendingRemove) return
        setRemoving(true)
        try {
            await boardMembersApi.remove(boardId, pendingRemove.userId)
            setMembers(prev => prev.filter(m => m.userId !== pendingRemove.userId))
            setPendingRemove(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
            setPendingRemove(null)
        } finally {
            setRemoving(false)
        }
    }

    return (
        <div className="members-editor">
            {error && <div className="profile-msg profile-msg--error">{error}</div>}
            {loading && <div className="loading">{t.loading || 'Загрузка...'}</div>}

            {!loading && (
                <>
                    <div className="members-editor__list">
                        {members.map(m => (
                            <div key={m.userId} className="member-row">
                                <div className="member-row__avatar">
                                    {m.avatarUrl
                                        ? <img src={m.avatarUrl} alt="" />
                                        : <span>{m.displayName.charAt(0).toUpperCase()}</span>}
                                </div>
                                <div className="member-row__info">
                                    <div className="member-row__name">{m.displayName}</div>
                                    <div className="member-row__username">@{m.username}</div>
                                </div>
                                {m.isOwner ? (
                                    <span className="member-row__role member-row__role--owner">владелец</span>
                                ) : isOwner ? (
                                    <>
                                        <select
                                            className="input member-row__role-select"
                                            value={m.role}
                                            onChange={(e) => changeRole(m.userId, e.target.value)}
                                        >
                                            <option value="editor">Редактор</option>
                                            <option value="viewer">Просмотр</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="member-row__btn member-row__btn--danger"
                                            onClick={() => requestRemove(m)}
                                            title="Удалить"
                                        >×</button>
                                    </>
                                ) : (
                                    <span className="member-row__role">
                                        {m.role === 'editor' ? 'Редактор' : 'Просмотр'}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {isOwner && (
                        <div className="members-editor__add-wrap" ref={wrapperRef}>
                            <div className="members-editor__add">
                                <input
                                    className="input members-editor__search"
                                    placeholder="Поиск по никнейму..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => query.trim().length > 0 && setShowResults(true)}
                                />
                            </div>

                            {showResults && (
                                <div className="members-editor__results">
                                    {searching && (
                                        <div className="members-editor__result-empty">Поиск...</div>
                                    )}
                                    {!searching && results.length === 0 && (
                                        <div className="members-editor__result-empty">
                                            Никого не найдено
                                        </div>
                                    )}
                                    {!searching && results.map(u => (
                                        <button
                                            key={u.userId}
                                            type="button"
                                            className="members-editor__result"
                                            onClick={() => addMember(u.userId)}
                                            disabled={adding}
                                        >
                                            <span className="members-editor__result-avatar">
                                                {u.avatarUrl
                                                    ? <img src={u.avatarUrl} alt="" />
                                                    : <span>{u.displayName.charAt(0).toUpperCase()}</span>}
                                            </span>
                                            <span className="members-editor__result-name">
                                                {u.displayName}
                                            </span>
                                            <span className="members-editor__result-username">
                                                @{u.username}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <ConfirmModal
                open={!!pendingRemove}
                title="Удалить участника?"
                text={pendingRemove
                    ? `Убрать «${pendingRemove.displayName}» из доски? Пользователь потеряет доступ ко всем её проектам и задачам.`
                    : ''}
                confirmLabel="Удалить"
                cancelLabel="Отмена"
                danger
                loading={removing}
                onConfirm={confirmRemove}
                onClose={() => !removing && setPendingRemove(null)}
            />
        </div>
    )
}