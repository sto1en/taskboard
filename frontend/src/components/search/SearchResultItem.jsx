import { useNavigate } from 'react-router-dom'
import useT from '../../hooks/useT'

// Санитайз HTML
function sanitizeHtml(html) {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    tmp.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove())
    const allowed = new Set([
        'B','I','U','S','STRONG','EM','PRE','CODE','BR',
        'P','DIV','SPAN','UL','OL','LI',
    ])
    const walk = (node) => {
        const children = Array.from(node.childNodes)
        for (const child of children) {
            if (child.nodeType === 1) {
                if (!allowed.has(child.tagName)) {
                    const text = document.createTextNode(child.textContent)
                    child.parentNode.replaceChild(text, child)
                } else {
                    walk(child)
                }
            }
        }
    }
    walk(tmp)
    return tmp.innerHTML
}

function formatDate(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString()
}

/**
 * Теги: если бэк отдал item.tags (объекты) — берём оттуда.
 * Иначе fallback на item.tagTitles (строки).
 */
function collectTags(item) {
    if (Array.isArray(item.tags) && item.tags.length > 0) {
        return item.tags.map(tg => ({
            id: tg.id,
            title: tg.title,
            accentCode: tg.accentCode || tg.accent || tg.color || 'gray',
            icon: tg.icon || tg.emoji || null,
        }))
    }
    if (Array.isArray(item.tagTitles) && item.tagTitles.length > 0) {
        return item.tagTitles.map((title, i) => ({
            id: `t-${i}`,
            title: String(title),
            accentCode: 'gray',
            icon: null,
        }))
    }
    return []
}

export default function SearchResultItem({ item, onOpenTask }) {
    const t = useT()
    const nav = useNavigate()

    const kindLabel = {
        board:   t.groupBoards,
        project: t.groupProjects,
        task:    t.groupTasks,
        tag:     t.groupTags,
    }[item.kind] || item.kind

    const kindClass = `search-result--kind-${item.kind}`

    // === Обработчик клика по карточке ===
    // Для task — открываем модалку задачи (через onOpenTask)
    // Для board/project/tag — переходим по маршруту
    const handleOpen = () => {
        if (item.kind === 'task') {
            onOpenTask?.(item.id)
            return
        }
        if (item.kind === 'board') {
            nav(`/boards/${item.boardId}`)
            return
        }
        if (item.kind === 'project') {
            nav(`/boards/${item.boardId}/projects/${item.projectId}`)
            return
        }
        if (item.kind === 'tag') {
            nav(`/search?tagIds=${item.id}`)
            return
        }
    }

    // === Обработчик клика по НАЗВАНИЮ ===
    // Для task — переходим в проект этой задачи (не открываем модалку)
    // Для остальных типов — ведём себя как обычный клик по карточке
    const handleTitleClick = (e) => {
        e.stopPropagation()
        if (item.kind === 'task') {
            if (item.boardId && item.projectId) {
                nav(`/boards/${item.boardId}/projects/${item.projectId}`)
            }
            return
        }
        handleOpen()
    }

    const isDone = item.statusCategoryCode === 'DONE'
        || item.statusCategoryCode === 'CANCELLED'

    const titleHtml = sanitizeHtml(item.title || '')
    const descHtml = item.description ? sanitizeHtml(item.description) : ''

    const allItemTags = collectTags(item)
    const visibleTags = allItemTags.slice(0, 3)
    const restTags = allItemTags.length - visibleTags.length

    const hasStatus = item.kind === 'task' && item.statusTitle
    const hasPriority = item.kind === 'task' && item.priority > 0
    const hasTags = visibleTags.length > 0

    return (
        <div
            className={`search-result ${kindClass}`}
            onClick={handleOpen}
        >
            <div className="search-result__main">

                {/* Строка 1: название + тип + приоритет + ... + теги + статус */}
                <div className="search-result__title-row">
                    <div
                        className={`search-result__title ${isDone ? 'search-result__title--done' : ''}`}
                        dangerouslySetInnerHTML={{ __html: titleHtml }}
                        onClick={handleTitleClick}
                        title={
                            item.kind === 'task' && item.projectId
                                ? 'Перейти в проект'
                                : undefined
                        }
                    />
                    <span className="search-result__kind">{kindLabel}</span>

                    {item.kind === 'tag' && item.icon && (
                        <span className="search-result__icon">{item.icon}</span>
                    )}
                    {item.kind === 'tag' && !item.icon && (
                        <span
                            className="search-result__dot"
                            style={{ backgroundColor: `var(--accent-${item.accentCode || 'gray'})` }}
                        />
                    )}

                    {hasPriority && (
                        <span className="search-result__priority">
                            {item.priority === 2 ? '❗' : '⚡'}
                        </span>
                    )}

                    <span className="search-result__meta-right">
                        {hasTags && (
                            <span className="search-result__mini-tags">
                                {visibleTags.map((tag, i) => {
                                    const realTagId =
                                        tag.id && !String(tag.id).startsWith('t-')
                                            ? tag.id
                                            : null

                                    const handleTagClick = (e) => {
                                        if (!realTagId) return
                                        e.stopPropagation()
                                        nav(`/search?tagIds=${realTagId}`)
                                    }

                                    return (
                                        <span
                                            key={tag.id || i}
                                            className={
                                                'search-result__mini-tag' +
                                                (realTagId ? ' search-result__mini-tag--clickable' : '')
                                            }
                                            style={{
                                                color: `var(--accent-${tag.accentCode || 'gray'})`,
                                            }}
                                            title={
                                                realTagId
                                                    ? `${tag.title} — найти все задачи с этим тегом`
                                                    : tag.title
                                            }
                                            onClick={handleTagClick}
                                        >
                                            {tag.icon && (
                                                <span className="search-result__mini-tag-icon">
                                                    {tag.icon}
                                                </span>
                                            )}
                                            {tag.title}
                                        </span>
                                    )
                                })}
                                {restTags > 0 && (
                                    <span className="search-result__mini-tag search-result__mini-tag--rest">
                                        +{restTags}
                                    </span>
                                )}
                            </span>
                        )}

                        {hasStatus && (
                            <span
                                className="search-result__status"
                                style={item.statusAccentCode
                                    ? { backgroundColor: `var(--accent-${item.statusAccentCode})` }
                                    : undefined}
                            >
                                {item.statusTitle}
                            </span>
                        )}
                    </span>
                </div>

                {/* Строка 2: Описание */}
                {descHtml && (
                    <div
                        className="search-result__description"
                        dangerouslySetInnerHTML={{ __html: descHtml }}
                    />
                )}

                {/* Строка 3: Метаданные (subtitle + deadline) */}
                {(item.subtitle || item.deadline) && (
                    <div className="search-result__meta-row">
                        {item.subtitle && (
                            <span className="search-result__meta-item">
                                {item.kind === 'task' && '📁 '}
                                {item.subtitle}
                            </span>
                        )}
                        {item.deadline && (
                            <span className="search-result__meta-item">
                                📅 {formatDate(item.deadline)}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}