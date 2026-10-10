import { useEffect, useRef, useState } from 'react'
import { tasksApi } from '../../api/api'
import AvatarWithFrame from '../layout/AvatarWithFrame'
import { useAuth } from '../../context/AuthContext'

const POLL_INTERVAL = 4000

function formatDateTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function ChatAvatar({ msg }) {
    const hasAny = msg.avatarCode || msg.avatarEmoji || msg.avatarImageUrl || msg.avatarUrl || msg.frameCssClass

    if (hasAny) {
        return (
            <div className="task-chat__avatar-wrap">
                <AvatarWithFrame
                    avatar={{
                        code: msg.avatarCode || undefined,
                        emoji: msg.avatarEmoji || undefined,
                        imageUrl: msg.avatarImageUrl || msg.avatarUrl || undefined,
                    }}
                    frame={msg.frameCssClass ? { cssClass: msg.frameCssClass } : null}
                    displayName={msg.displayName}
                    username={msg.username}
                    size={32}
                />
            </div>
        )
    }
    return (
        <div className="task-chat__avatar">
            <span>{(msg.displayName || msg.username || '?').charAt(0).toUpperCase()}</span>
        </div>
    )
}

export default function TaskChat({ taskId }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const [editing, setEditing] = useState(null)
    const listRef = useRef(null)

    const inFlightRef = useRef(false)
    const lastIdsRef = useRef(new Set())

    const fetchMessages = async ({ silent = false } = {}) => {
        if (!taskId) return
        if (inFlightRef.current) return
        inFlightRef.current = true

        if (!silent) setLoading(true)

        try {
            const { data } = await tasksApi.messages.list(taskId)
            const list = Array.isArray(data) ? data : []

            const newIds = new Set(list.map(m => m.id))
            const changed =
                newIds.size !== lastIdsRef.current.size ||
                [...newIds].some(id => !lastIdsRef.current.has(id))

            if (changed) {
                setMessages(list)
                lastIdsRef.current = newIds
            }
            setError(null)
        } catch (err) {
            if (!silent) {
                setError(err.response?.data?.message || 'Не удалось загрузить чат')
            }
        } finally {
            inFlightRef.current = false
            if (!silent) setLoading(false)
        }
    }

    useEffect(() => {
        if (!taskId) {
            setMessages([])
            lastIdsRef.current = new Set()
            return
        }
        lastIdsRef.current = new Set()
        fetchMessages()
        // eslint-disable-next-line
    }, [taskId])

    useEffect(() => {
        if (!taskId) return
        const timer = setInterval(() => {
            if (editing || sending) return
            fetchMessages({ silent: true })
        }, POLL_INTERVAL)
        return () => clearInterval(timer)
        // eslint-disable-next-line
    }, [taskId, editing, sending])

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages.length])

    const send = async () => {
        const v = text.trim()
        if (!v) return
        setSending(true)
        setError(null)
        try {
            const { data } = await tasksApi.messages.create(taskId, { text: v })
            setMessages(prev => {
                const next = [...prev, data]
                lastIdsRef.current = new Set(next.map(m => m.id))
                return next
            })
            setText('')
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось отправить')
        } finally {
            setSending(false)
        }
    }

    const saveEdit = async () => {
        if (!editing) return
        const v = editing.text.trim()
        if (!v) return
        try {
            const { data } = await tasksApi.messages.update(taskId, editing.id, { text: v })
            setMessages(prev => prev.map(m => m.id === data.id ? data : m))
            setEditing(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    const remove = async (id) => {
        if (!confirm('Удалить сообщение?')) return
        try {
            await tasksApi.messages.delete(taskId, id)
            setMessages(prev => {
                const next = prev.filter(m => m.id !== id)
                lastIdsRef.current = new Set(next.map(m => m.id))
                return next
            })
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка')
        }
    }

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    const onEditKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            saveEdit()
        }
        if (e.key === 'Escape') setEditing(null)
    }

    return (
        <div className="task-chat">
            {error && <div className="modal__error">{error}</div>}

            <div className="task-chat__list" ref={listRef}>
                {loading && messages.length === 0 && (
                    <div className="loading">Загрузка…</div>
                )}
                {!loading && messages.length === 0 && (
                    <div className="task-chat__empty">
                        Здесь пока пусто. Напишите первое сообщение.
                    </div>
                )}

                {messages.map(m => {
                    const isOwn = user?.id === m.userId
                    const isEditing = editing?.id === m.id

                    return (
                        <div key={m.id} className={`task-chat__msg ${isOwn ? 'task-chat__msg--own' : ''}`}>
                            <ChatAvatar msg={m} />
                            <div className="task-chat__bubble">
                                <div className="task-chat__meta">
                                    <span className="task-chat__author">
                                        {m.displayName || m.username}
                                    </span>
                                    <span className="task-chat__time">
                                        {formatDateTime(m.createdAt)}
                                        {m.editedAt && ' · изменено'}
                                    </span>
                                </div>

                                {isEditing ? (
                                    <div className="task-chat__edit">
                                        <textarea
                                            className="input task-chat__input"
                                            value={editing.text}
                                            onChange={(e) => setEditing(f => ({ ...f, text: e.target.value }))}
                                            onKeyDown={onEditKeyDown}
                                            autoFocus
                                            rows={2}
                                        />
                                        <div className="task-chat__edit-actions">
                                            <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                                                Отмена
                                            </button>
                                            <button className="btn btn-primary" onClick={saveEdit}>
                                                Сохранить
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="task-chat__text">{m.text}</div>
                                )}
                            </div>

                            {isOwn && !isEditing && (
                                <div className="task-chat__actions">
                                    <button
                                        type="button"
                                        className="task-chat__action"
                                        onClick={() => setEditing({ id: m.id, text: m.text })}
                                        title="Редактировать"
                                    >✎</button>
                                    <button
                                        type="button"
                                        className="task-chat__action task-chat__action--danger"
                                        onClick={() => remove(m.id)}
                                        title="Удалить"
                                    >×</button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="task-chat__composer">
                <textarea
                    className="input task-chat__input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                />
                <button
                    type="button"
                    className="btn btn-primary task-chat__send"
                    onClick={send}
                    disabled={sending || !text.trim()}
                >
                    {sending ? '...' : 'Отправить'}
                </button>
            </div>
        </div>
    )
}