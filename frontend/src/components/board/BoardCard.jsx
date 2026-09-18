export default function BoardCard({ board, onClick }) {
    const accent = board.accent || 'blue'   // blue | purple | green | orange

    return (
        <div className="board-card" onClick={onClick}>
            {/* Обложка с градиентом */}
            <div className={`board-card__cover board-card__cover--${accent}`}>
                <div className="board-card__pattern" />
                <div className="board-card__cover-title">{board.title}</div>
            </div>

            {/* Тело карточки */}
            <div className="board-card__body">
                <div className="board-card__title">{board.title}</div>
                <div className="board-card__meta">
          <span className="board-card__meta-item">
            <span className="board-card__meta-icon">✓</span>
              {board.taskCount} {plural(board.taskCount, ['задача', 'задачи', 'задач'])}
          </span>
                </div>
            </div>
        </div>
    )
}

function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}