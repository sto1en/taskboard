import { useNavigate } from 'react-router-dom'
import BoardCard from '../components/Board/BoardCard'

// Демо-данные. Позже — fetch('/api/boards')
const demoBoards = [
    {
        id: 1,
        title: 'Task Board',
        taskCount: 9,
        accent: 'blue',       // цвет обложки
    },
    {
        id: 2,
        title: 'Svekla kanban',
        taskCount: 2,
        accent: 'purple',
    },
    {
        id: 3,
        title: 'Estimations',
        taskCount: 0,
        accent: 'green',
    },
    {
        id: 4,
        title: 'Диплом / РПЗ',
        taskCount: 5,
        accent: 'orange',
    },
]

export default function BoardsPage() {
    const nav = useNavigate()

    const totalTasks = demoBoards.reduce((s, b) => s + b.taskCount, 0)

    return (
        <div className="boards">
            {/* Заголовок с приветствием */}
            <div className="boards__hero">
                <div>
                    <h1 className="boards__hero-title">Мои доски</h1>
                    <p className="boards__hero-sub">
                        {demoBoards.length} {plural(demoBoards.length, ['доска', 'доски', 'досок'])}
                        {' · '}
                        {totalTasks} {plural(totalTasks, ['задача', 'задачи', 'задач'])}
                    </p>
                </div>
                <button className="btn btn-primary">+ Новая доска</button>
            </div>

            {/* Сетка плиток */}
            <div className="boards__grid">
                {demoBoards.map(b => (
                    <BoardCard
                        key={b.id}
                        board={b}
                        onClick={() => nav(`/boards/${b.id}`)}
                    />
                ))}

                {/* Плитка «Создать доску» */}
                <button
                    className="board-card board-card--new"
                    onClick={() => console.log('create board')}
                >
                    <span className="board-card__plus">+</span>
                    <span>Создать доску</span>
                </button>
            </div>
        </div>
    )
}

/* Простая функция для склонения русских слов */
function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}