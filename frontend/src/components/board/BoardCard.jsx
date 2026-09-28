export default function BoardCard({ board, onClick, onDelete, onTogglePin }) {
    const accent = board.accentCode || board.accent || 'blue'
    const hasCover = !!board.coverUrl

    const handleDelete = (e) => {
        e.stopPropagation()
        if (confirm(`Удалить доску "${board.title}"?`)) {
            onDelete && onDelete(board.id)
        }
    }

    const handlePin = (e) => {
        e.stopPropagation()
        onTogglePin && onTogglePin()
    }

    return (
        <div className={`board-card ${board.isPinned ? 'board-card--pinned' : ''}`} onClick={onClick}>
            <div className={`board-card__cover board-card__cover--${accent}`}>
                {hasCover && (
                    <img
                        src={board.coverUrl}
                        alt={board.title}
                        className="board-card__cover-img"
                    />
                )}
                <div className="board-card__pattern" />
                <div className="board-card__cover-title">{board.title}</div>

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
                    {onDelete && (
                        <button
                            className="board-card__action-btn board-card__action-btn--danger"
                            onClick={handleDelete}
                            title="Удалить доску"
                        >
                            🗑
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

function plural(n, forms) {
    const mod10 = n % 10, mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}