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
import { boardsApi, projectsApi } from '../api/api'
import useT from '../hooks/useT'
import SortableBoardCard from '../components/Board/SortableBoardCard'
import BoardCard from '../components/Board/BoardCard'
import CreateBoardModal from '../components/Board/CreateBoardModal'
import EditBoardModal from '../components/Board/EditBoardModal'

export default function BoardsPage() {
    const nav = useNavigate()
    const t = useT()
    const [boards, setBoards] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [editBoard, setEditBoard] = useState(null)
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
        window.dispatchEvent(new Event('sidebar:refresh'))
    }

    const handleUpdated = (updated) => {
        setBoards(prev => prev.map(b => b.id === updated.id ? updated : b))
        setEditBoard(null)
        window.dispatchEvent(new Event('sidebar:refresh'))
    }

    const countPins = async () => {
        const { data: allBoards } = await boardsApi.list()
        const pinnedBoards = allBoards.filter(b => b.isPinned)
        let count = 0
        for (const b of pinnedBoards) {
            const { data: projects } = await projectsApi.listByBoard(b.id)
            const pinnedProjects = projects.filter(p => p.isPinned)
            if (pinnedProjects.length > 0) {
                count += pinnedProjects.length
            } else {
                count += 1
            }
        }
        return count
    }

    const handleTogglePin = async (board) => {
        try {
            if (!board.isPinned) {
                const count = await countPins()
                if (count >= 3) {
                    alert('Максимум 3 закрепа. Открепите что-нибудь, чтобы закрепить новое.')
                    return
                }
            }
            const { data } = await boardsApi.update(board.id, {
                isPinned: !board.isPinned,
            })
            setBoards(prev => prev.map(b => b.id === data.id ? data : b))
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch (err) {
            alert(err.response?.data?.message || 'Ошибка')
        }
    }

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

        if (activeBoard.isPinned !== overBoard.isPinned) return

        const group = activeBoard.isPinned ? pinned : unpinned
        const oldIndex = group.findIndex(b => b.id === active.id)
        const newIndex = group.findIndex(b => b.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(group, oldIndex, newIndex)

        const updated = reordered.map((b, idx) => ({ ...b, position: idx }))
        const other = activeBoard.isPinned ? unpinned : pinned
        const merged = activeBoard.isPinned
            ? [...updated, ...other]
            : [...other, ...updated]

        setBoards(merged)

        try {
            await Promise.all(
                updated.map(b => boardsApi.move(b.id, { position: b.position }))
            )
            window.dispatchEvent(new Event('sidebar:refresh'))
        } catch (err) {
            console.error('Move failed:', err)
            load()
        }
    }

    if (loading) return <div className="loading">Загрузка...</div>

    const sorted = [...pinned, ...unpinned]
    const boardIds = sorted.map(b => b.id)

    return (
        <div className="boards">
            <div className="boards__hero">
                <div>
                    <h1 className="boards__hero-title">{t.myBoards}</h1>
                    <p className="boards__hero-sub">
                        {t.boardsCount(boards.length)}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    {t.newBoard}
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
                                onEdit={(board) => setEditBoard(board)}
                                onTogglePin={() => handleTogglePin(b)}
                            />
                        ))}
                        <button
                            className="board-card board-card--new"
                            onClick={() => setShowCreate(true)}
                        >
                            <span className="board-card__plus">+</span>
                            <span>{t.createBoard}</span>
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

            <EditBoardModal
                open={!!editBoard}
                onClose={() => setEditBoard(null)}
                board={editBoard}
                onUpdated={handleUpdated}
            />
        </div>
    )
}