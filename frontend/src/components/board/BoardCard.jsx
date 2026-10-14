import { useState } from 'react'
import { plural, resolveUrl } from '../../utils/format'

export default function BoardCard({ board, onClick, onEdit, onTogglePin }) {
    const accent = board.accentCode || board.accent || 'blue'
    const coverUrl = resolveUrl(board.coverUrl)
    const [coverBroken, setCoverBroken] = useState(false)
    const hasCover = !!coverUrl && !coverBroken
    const initial = (board.title || '?').trim().charAt(0).toUpperCase()

    const handleEdit = (e) => {
        e.stopPropagation()
        onEdit && onEdit(board)
    }

    const handlePin = (e) => {
        e.stopPropagation()
        onTogglePin && onTogglePin()
    }

    return (
        <div className={`board-card ${board.isPinned ? 'board-card--pinned' : ''}`} onClick={onClick}>
            <div className={`board-card__cover board-card__cover--${accent}`}>
                {hasCover ? (
                    <img
                        src={coverUrl}
                        alt={board.title}
                        className="board-card__cover-img"
                        onError={() => setCoverBroken(true)}
                    />
                ) : (
                    <div className="board-card__cover-letter">{initial}</div>
                )}

                <div className="board-card__actions">
                    {onTogglePin && (
                        <button
                            className={`board-card__action-btn ${board.isPinned ? 'board-card__action-btn--active' : ''}`}
                            onClick={handlePin}
                            title={board.isPinned ? 'Открепить' : 'Закрепить'}
                        >
                            📌
                        </button>
                    )}
                    {onEdit && (
                        <button
                            className="board-card__action-btn"
                            onClick={handleEdit}
                            title="Редактировать доску"
                        >
                            ✎
                        </button>
                    )}
                </div>
            </div>

            <div className="board-card__body">
                <div className="board-card__title">{board.title}</div>
                <div className="board-card__meta">
                    <span className="board-card__meta-item">
                        <span className="board-card__meta-icon">✓</span>
                        {board.taskCount || 0} {plural(board.taskCount || 0, ['задача', 'задачи', 'задач'])}
                    </span>
                    <span className="board-card__meta-item">
                        📁 {board.projectCount || 0} {plural(board.projectCount || 0, ['проект', 'проекта', 'проектов'])}
                    </span>
                </div>
            </div>
        </div>
    )
}