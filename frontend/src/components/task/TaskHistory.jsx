import { useEffect, useState } from 'react'
import { tasksApi } from '../../api/api'
import AvatarWithFrame from '../layout/AvatarWithFrame'

function formatDateTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatValue(v) {
    if (v == null || v === '') return '—'
    return String(v)
}

function describeNodes(log) {
    const { action, field, oldValue, newValue } = log

    if (action === 'CREATED') return ['создал(а) задачу']
    if (action === 'ATTACHMENT_ADDED')
        return ['прикрепил(а) файл ', <b key="v">«{formatValue(newValue)}»</b>]
    if (action === 'ATTACHMENT_REMOVED')
        return ['удалил(а) файл ', <b key="v">«{formatValue(oldValue)}»</b>]
    if (action === 'TAG_ADDED')
        return ['добавил(а) тег ', <b key="v">«{formatValue(newValue)}»</b>]
    if (action === 'TAG_REMOVED')
        return ['убрал(а) тег ', <b key="v">«{formatValue(oldValue)}»</b>]

    if (action === 'STATUS_CHANGED') {
        return [
            'изменил(а) статус: ',
            <b key="old">{formatValue(oldValue)}</b>,
            ' → ',
            <b key="new">{formatValue(newValue)}</b>,
        ]
    }

    if (action === 'UPDATED') {
        switch (field) {
            case 'title':
                return [
                    'переименовал(а): ',
                    <b key="old">{formatValue(oldValue)}</b>,
                    ' → ',
                    <b key="new">{formatValue(newValue)}</b>,
                ]
            case 'description':
                return ['изменил(а) описание']
            case 'priority':
                return [
                    'изменил(а) приоритет: ',
                    <b key="old">{formatValue(oldValue)}</b>,
                    ' → ',
                    <b key="new">{formatValue(newValue)}</b>,
                ]
            case 'deadline':
                return [
                    'изменил(а) дедлайн: ',
                    <b key="old">{formatValue(oldValue)}</b>,
                    ' → ',
                    <b key="new">{formatValue(newValue)}</b>,
                ]
            default:
                return ['изменил(а) ', formatValue(field)]
        }
    }

    return [String(action || '')]
}

function LogAvatar({ log }) {
    const hasAny = log.avatarCode || log.avatarEmoji || log.avatarImageUrl || log.avatarUrl || log.frameCssClass

    if (hasAny) {
        const avatar = {
            code: log.avatarCode || undefined,
            emoji: log.avatarEmoji || undefined,
            imageUrl: log.avatarImageUrl || log.avatarUrl || undefined,
        }
        const frame = log.frameCssClass ? { cssClass: log.frameCssClass } : null

        return (
            <div className="task-history__avatar-frame">
                <AvatarWithFrame
                    avatar={avatar}
                    frame={frame}
                    displayName={log.displayName}
                    username={log.username}
                    size={32}
                />
            </div>
        )
    }

    return (
        <div className="task-history__avatar">
            <span>{(log.displayName || log.username || '?').charAt(0).toUpperCase()}</span>
        </div>
    )
}

export default function TaskHistory({ taskId }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!taskId) {
            setItems([])
            return
        }
        setLoading(true)
        setError(null)
        tasksApi.history(taskId)
            .then(({ data }) => setItems(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('History load error:', err)
                setError(err.response?.data?.message || 'Не удалось загрузить историю')
            })
            .finally(() => setLoading(false))
    }, [taskId])

    if (!taskId) return null
    if (loading) return <div className="loading">Загрузка…</div>
    if (error) return <div className="modal__error">{error}</div>
    if (items.length === 0) {
        return <div className="task-history__empty">Пока нет изменений</div>
    }

    return (
        <div className="task-history">
            {items.map(log => (
                <div key={log.id} className="task-history__item">
                    <LogAvatar log={log} />
                    <div className="task-history__body">
                        <div className="task-history__line">
                            <span className="task-history__user">
                                {log.displayName || log.username || 'Кто-то'}
                            </span>{' '}
                            <span className="task-history__action">
                                {describeNodes(log)}
                            </span>
                        </div>
                        <div className="task-history__time">{formatDateTime(log.createdAt)}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}