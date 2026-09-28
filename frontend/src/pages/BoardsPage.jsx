import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    SortableContext,
    rectSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { boardsApi } from '../api/api'
import SortableBoardCard from '../components/Board/SortableBoardCard'
import BoardCard from '../components/Board/BoardCard'
import CreateBoardModal from '../components/Board/CreateBoardModal'

export default function BoardsPage() {
    const nav = useNavigate()
    const [boards, setBoards] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [activeBoard, setActiveBoard] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await boardsApi.list()
            setBoards(data)
        } catch (err) {
            console.error('Boards load error:', err)
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleCreated = (newBoard) => {
        setBoards(prev => [...prev, newBoard])
    }

    const handleDeleted = async (boardId) => {
        try {
            await boardsApi.delete(boardId)
            setBoards(prev => prev.filter(b => b.id !== boardId))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка удаления')
        }
    }

    const handleTogglePin = async (board) => {
        try {
            const { data } = await boardsApi.update(board.id, {
                isPinned: !board.isPinned,
            })
            setBoards(prev => prev.map(b => b.id === data.id ? data : b))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

    // Закреплённые всегда сверху — drag только внутри своей группы
    const pinned = boards.filter(b => b.isPinned)
    const unpinned = boards.filter(b => !b.isPinned)

    const handleDragStart = (event) => {
        const { active } = event
        const board = active.data.current?.board
        if (board) setActiveBoard(board)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveBoard(null)
        if (!over || active.id === over.id) return

        const activeBoard = boards.find(b => b.id === active.id)
        const overBoard = boards.find(b => b.id === over.id)
        if (!activeBoard || !overBoard) return

        // Не даём мешать закреплённые и незакреплённые
        if (activeBoard.isPinned !== overBoard.isPinned) return

        const group = activeBoard.isPinned ? pinned : unpinned
        const oldIndex = group.findIndex(b => b.id === active.id)
        const newIndex = group.findIndex(b => b.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(group, oldIndex, newIndex)

        // Обновляем position локально
        const updated = reordered.map((b, idx) => ({ ...b, position: idx }))
        const other = activeBoard.isPinned ? unpinned : pinned
        const merged = activeBoard.isPinned
            ? [...updated, ...other]
            : [...other, ...updated]

        setBoards(merged)

        // Сохраняем на бэкенде
        try {
            await Promise.all(
                updated.map(b => boardsApi.move(b.id, { position: b.position }))
            )
        } catch (err) {
            console.error('Move failed:', err)
            load() // откат
        }
    }

    if (loading) return <div className="loading">Загрузка...</div>

    const sorted = [...pinned, ...unpinned]
    const boardIds = sorted.map(b => b.id)

    return (
        <div className="boards">
            <div className="boards__hero">
                <div>
                    <h1 className="boards__hero-title">Мои доски</h1>
                    <p className="boards__hero-sub">
                        {boards.length} {plural(boards.length, ['доска', 'доски', 'досок'])}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    + Новая доска
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={boardIds} strategy={rectSortingStrategy}>
                    <div className="boards__grid">
                        {sorted.map(b => (
                            <SortableBoardCard
                                key={b.id}
                                board={b}
                                onClick={() => nav(`/boards/${b.id}`)}
                                onDelete={handleDeleted}
                                onTogglePin={() => handleTogglePin(b)}
                            />
                        ))}
                        <button
                            className="board-card board-card--new"
                            onClick={() => setShowCreate(true)}
                        >
                            <span className="board-card__plus">+</span>
                            <span>Создать доску</span>
                        </button>
                    </div>
                </SortableContext>

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.5' } },
                        }),
                    }}
                >
                    {activeBoard ? (
                        <div style={{ width: 240 }}>
                            <BoardCard board={activeBoard} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <CreateBoardModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={handleCreated}
            />
        </div>
    )
}

function plural(n, forms) {
    const mod10 = n % 10, mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}