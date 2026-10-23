import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { invalidateTasks } from '../../store/slices/tasksSlice'
import { tasksApi, tagsApi, attachmentsApi, projectsApi, recurrenceApi } from '../../api/api'
import Modal from '../modal/Modal'
import ConfirmModal from '../common/ConfirmModal'
import AttachmentPreview from './AttachmentPreview'
import DetailTextEditor from './DetailTextEditor'
import RecurrenceEditor from './RecurrenceEditor'
import TaskHistory from './TaskHistory'
import TaskChat from './TaskChat'
import { PriorityPicker, PriorityStars } from './PriorityStars'
import {
    formatDeadline,
    splitDeadline,
    buildDeadline,
    isDateInPast,
    todayIsoDate,
    resolveUrl,
} from '../../utils/format'
import useT from '../../hooks/useT'
import useConfirmDelete from '../../hooks/useConfirmDelete'
import { useAuth } from '../../context/AuthContext'

const TAG_ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']
const TAG_ICONS = [
    '', '📌', '⭐', '🔥', '✅', '❗', '💡', '🎯', '📎', '📁',
    '🏷️', '🎨', '🚀', '🐛', '📝', '💼', '🎓', '❤️', '⚡', '🔔',
]

function describeRecurrence(rec, t) {
    const rule = rec?.rule || ''
    if (rule === 'daily') return t.repeatDaily
    if (rule === 'weekly') return t.repeatWeekly
    if (rule === 'monthly') return t.repeatMonthly
    if (rule === 'yearly') return t.repeatYearly
    if (rule.startsWith('every:')) {
        const arg = rule.slice(6)
        const unit = arg.slice(-1)
        const n = parseInt(arg.slice(0, -1), 10) || 1
        const unitLabel = {
            d: t.repeatUnitD,
            w: t.repeatUnitW,
            M: t.repeatUnitM,
            y: t.repeatUnitY,
        }[unit] || ''
        return t.repeatEvery(n, unitLabel)
    }
    return t.repeatGeneric
}

const RECURRENCE_FIELDS = ['rule', 'startAt', 'endMode', 'endUntil', 'endCount', 'timeOfDay']

/** Сравнивает только поля, которые редактирует RecurrenceEditor. */
function sameRecurrence(a, b) {
    if (!a && !b) return true
    if (!a || !b) return false
    return RECURRENCE_FIELDS.every(key => (a[key] ?? null) === (b[key] ?? null))
}

export default function TaskDetailModal({
                                            open,
                                            onClose,
                                            taskId,
                                            onOpenTask,
                                            onUpdated,
                                            boardId: boardIdProp,
                                            columns: columnsProp,
                                        }) {
    const t = useT()
    const { user, updateUser } = useAuth()
    const dispatch = useDispatch()
    const confirmBeforeDelete = user?.workspace?.confirmBeforeDelete !== false
    const { requestDelete, modalProps } = useConfirmDelete({
        confirmBeforeDelete,
        updateUser,
    })

    const [detailTab, setDetailTab] = useState('details')

    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    const [boardId, setBoardId] = useState(boardIdProp || null)
    const [columns, setColumns] = useState(columnsProp || [])
    const [isGroupProject, setIsGroupProject] = useState(false)
    // Право на правку задачи (ProjectDto.canEdit). null — неизвестно, не блокируем.
    const [canEditTask, setCanEditTask] = useState(null)

    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 0,
        deadlineDate: '',
        deadlineTime: '',
        hasTime: false,
        statusId: '',
    })
    const [tags, setTags] = useState([])
    const [uploading, setUploading] = useState(false)
    const [creatingTag, setCreatingTag] = useState(false)
    const [newTagTitle, setNewTagTitle] = useState('')
    const [newTagAccent, setNewTagAccent] = useState('blue')
    const [newTagIcon, setNewTagIcon] = useState('')
    const [editingTag, setEditingTag] = useState(null)
    const [dirty, setDirty] = useState(false)
    const [discardAction, setDiscardAction] = useState(null)
    const [previewAttachment, setPreviewAttachment] = useState(null)
    const fileInputRef = useRef(null)

    const [existingSubtasks, setExistingSubtasks] = useState([])
    const [pendingSubtasks, setPendingSubtasks] = useState([])
    const [subtaskInput, setSubtaskInput] = useState('')
    const [showSubtaskAutocomplete, setShowSubtaskAutocomplete] = useState(false)
    const [allProjectTasks, setAllProjectTasks] = useState([])
    const [subtaskError, setSubtaskError] = useState(null)

    const [recurrence, setRecurrence] = useState(null)
    const [recurrenceDirty, setRecurrenceDirty] = useState(false)

    // === Вложения ===
    // Новые, ещё не привязанные к задаче (черновики на добавление)
    const [pendingAttachments, setPendingAttachments] = useState([])
    // Id уже привязанных вложений, помеченных на удаление (черновики на удаление)
    const [pendingRemovals, setPendingRemovals] = useState([])

    const load = async () => {
        if (!taskId) return
        // Не показываем данные предыдущей задачи, пока грузится новая.
        setTask(null)
        setLoading(true)
        setError(null)

        try {
            const { data: taskData } = await tasksApi.get(taskId)

            const { date, time, hasTime } = splitDeadline(taskData.deadline)
            setTask(taskData)
            setForm({
                title: taskData.title || '',
                description: taskData.description || '',
                priority: taskData.priority || 0,
                deadlineDate: date,
                deadlineTime: time,
                hasTime,
                statusId: taskData.statusId || '',
            })

            setExistingSubtasks(taskData.subtasks || [])
            setPendingSubtasks([])
            setDirty(false)
            setRecurrence(taskData.recurrence || null)
            setRecurrenceDirty(false)
            setPendingAttachments([])
            setPendingRemovals([])

            let bid = boardIdProp
            let cols = columnsProp || []

            // Побочные справочники грузятся независимо от задачи: если что-то
            // из них упало, задача всё равно открывается, но пользователь
            // видит, что именно недоступно, вместо пустого списка без причины.
            const loadErrors = []

            // Проект нужен ради boardId и флага isCoop (авторы показываются
            // только в коопных проектах). Без него доска остаётся неизвестной,
            // поэтому это не «шум», а причина пустых тегов и статусов — сообщаем.
            if (taskData.projectId) {
                try {
                    const { data: project } = await projectsApi.get(taskData.projectId)
                    setIsGroupProject(project?.isCoop === true)
                    setCanEditTask(project?.canEdit !== false)
                    if (!bid) {
                        bid = project.boardId
                        setBoardId(bid)
                    }
                } catch {
                    setIsGroupProject(false)
                    loadErrors.push(t.errorProject)
                }
            }
            if (bid) setBoardId(bid)

            if ((!cols || cols.length === 0) && taskData.projectId) {
                try {
                    const { data: kanban } = await tasksApi.kanban(taskData.projectId)
                    cols = kanban.columns || []
                    setColumns(cols)
                } catch {
                    loadErrors.push(t.errorStatuses)
                }
            } else if (cols?.length) {
                setColumns(cols)
            }

            if (bid) {
                try {
                    const { data: tagsData } = await tagsApi.listByBoard(bid)
                    setTags(tagsData)
                } catch {
                    setTags([])
                    loadErrors.push(t.errorTags)
                }
            }

            if (taskData.projectId) {
                try {
                    const { data } = await tasksApi.listByProject(taskData.projectId)
                    setAllProjectTasks(data)
                } catch {
                    setAllProjectTasks([])
                    loadErrors.push(t.errorProjectTasks)
                }
            }

            if (loadErrors.length > 0) setError(loadErrors.join(' · '))
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && taskId) {
            load()
        }
        // eslint-disable-next-line
    }, [open, taskId])

    useEffect(() => {
        if (open) setDetailTab('details')
    }, [open, taskId])

    useEffect(() => {
        if (!open) {
            setPreviewAttachment(null)
            setEditingTag(null)
            setCreatingTag(false)
            setPendingSubtasks([])
            setSubtaskInput('')
            setShowSubtaskAutocomplete(false)
            setSubtaskError(null)
            setBoardId(boardIdProp || null)
            setColumns(columnsProp || [])
            setRecurrence(null)
            setRecurrenceDirty(false)
            setDetailTab('details')
            setPendingAttachments([])
            setPendingRemovals([])
        }
    }, [open, boardIdProp, columnsProp])

    const setField = (key, value) => {
        setForm(f => ({ ...f, [key]: value }))
        setDirty(true)
    }

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            const deadline = buildDeadline(form.deadlineDate, form.deadlineTime, form.hasTime)
            const tagIds = (task.tags || []).map(tg => tg.id)

            await tasksApi.update(taskId, {
                title: form.title,
                description: form.description,
                priority: form.priority,
                deadline,
                statusId: form.statusId || null,
                tagIds,
            })

            // Сохранение основной формы прошло. Всё, что ниже, — отдельные
            // запросы, которые могут упасть поодиночке. Раньше такие ошибки
            // уходили в console.error, а окно закрывалось как при успехе:
            // пользователь считал, что вложения/подзадачи сохранились.
            // Теперь провалы собираются, а несохранённые черновики остаются
            // в состоянии, чтобы повторить «Сохранить».
            const saveErrors = []
            // Что не удалось записать — останется кнопкой «Сохранить» на повтор
            let failedAttachments = []
            let failedRemovals = []
            let failedSubtasks = []

            // === Привязываем новые черновики ===
            if (pendingAttachments.length > 0) {
                for (const a of pendingAttachments) {
                    try {
                        await tasksApi.attach(taskId, a.id)
                    } catch (err) {
                        console.error('Attach error:', err)
                        failedAttachments.push(a)
                    }
                }
                if (failedAttachments.length) {
                    saveErrors.push(t.errorAttach(failedAttachments.length))
                }
                setPendingAttachments(failedAttachments)
            }

            // === Удаляем помеченные вложения ===
            if (pendingRemovals.length > 0) {
                for (const attachmentId of pendingRemovals) {
                    try {
                        await tasksApi.detach(taskId, attachmentId)
                    } catch (err) {
                        console.error('Detach error:', err)
                        failedRemovals.push(attachmentId)
                    }
                }
                if (failedRemovals.length) {
                    saveErrors.push(t.errorDetach(failedRemovals.length))
                }
                setPendingRemovals(failedRemovals)
            }

            if (recurrenceDirty) {
                try {
                    if (recurrence && recurrence.rule) {
                        await recurrenceApi.save(taskId, recurrence)
                    } else if (!recurrence) {
                        await recurrenceApi.delete(taskId)
                    }
                } catch (err) {
                    console.error('Recurrence save error:', err)
                    saveErrors.push(err.response?.data?.message || t.errorRecurrence)
                }
            }

            if (pendingSubtasks.length > 0) {
                for (const ps of pendingSubtasks) {
                    try {
                        await tasksApi.create(task.projectId, {
                            title: ps.title,
                            parentId: taskId,
                        })
                    } catch (err) {
                        console.error('Subtask create error:', err)
                        failedSubtasks.push(ps)
                    }
                }
                if (failedSubtasks.length) {
                    saveErrors.push(t.errorSubtaskCreate(failedSubtasks.length))
                }
                setPendingSubtasks(failedSubtasks)
            }

            // Обновляем то, что реально записалось. Не сохранённые черновики
            // (вложения, подзадачи) остаются в своём стейте, если их запись
            // упала, — иначе после ошибки они потерялись бы вместе с окном.
            const { data: refreshed } = await tasksApi.get(taskId)
            setTask(refreshed)
            setExistingSubtasks(refreshed.subtasks || [])
            setPendingSubtasks(failedSubtasks)
            setPendingAttachments(failedAttachments)
            setPendingRemovals(failedRemovals)
            setRecurrence(refreshed.recurrence || null)
            if (saveErrors.length === 0) setRecurrenceDirty(false)

            const { date, time, hasTime } = splitDeadline(refreshed.deadline)
            setForm({
                title: refreshed.title || '',
                description: refreshed.description || '',
                priority: refreshed.priority ?? 0,
                deadlineDate: date,
                deadlineTime: time,
                hasTime,
                statusId: refreshed.statusId || '',
            })
            setDirty(false)

            if (saveErrors.length > 0) {
                // Форма сохранена, но часть вложений/подзадач/повторения — нет.
                // Окно остаётся открытым, чтобы можно было нажать «Сохранить»
                // ещё раз, не вводя всё заново.
                setError(saveErrors.join(' · '))
                onUpdated && onUpdated()
                return
            }

            onUpdated && onUpdated()
            onClose && onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteClick = () => {
        if (!task) return
        requestDelete({
            kind: 'task',
            title: task.title,
            onConfirm: async () => {
                try {
                    await tasksApi.delete(taskId)
                    dispatch(invalidateTasks())
                    onUpdated && onUpdated()
                    onClose && onClose()
                } catch (err) {
                    setError(err.response?.data?.message || 'Error')
                }
            },
        })
    }

    // Загрузка файла — просто кладём в «черновики», не привязываем
    const uploadAttachment = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data: attachment } = await attachmentsApi.upload(file)
            setPendingAttachments(prev => [...prev, {
                id: attachment.id,
                url: attachment.url,
                originalName: attachment.originalName,
                mimeCode: attachment.mimeCode,
            }])
            setDirty(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // === «Удалить вложение»: только помечаем, на сервере — при сохранении ===
    const detachAttachment = (attachmentId) => {
        // 1. Если это черновик (ещё не привязан) — просто убираем из списка
        const isPending = pendingAttachments.some(a => a.id === attachmentId)
        if (isPending) {
            setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId))
            return
        }

        // 2. Если это уже привязанное вложение — помечаем на удаление
        setPendingRemovals(prev =>
            prev.includes(attachmentId) ? prev : [...prev, attachmentId]
        )
        setDirty(true)
    }

    // === Отменить пометку на удаление ===
    const undoRemoveAttachment = (attachmentId) => {
        setPendingRemovals(prev => prev.filter(id => id !== attachmentId))
    }

    const toggleTag = (tagId) => {
        const currentTagIds = (task.tags || []).map(tg => tg.id)
        const newTagIds = currentTagIds.includes(tagId)
            ? currentTagIds.filter(id => id !== tagId)
            : [...currentTagIds, tagId]
        const newTags = tags.filter(tg => newTagIds.includes(tg.id))
        setTask(prev => ({ ...prev, tags: newTags }))
        setDirty(true)
    }

    const createTag = async () => {
        if (!newTagTitle.trim() || !boardId) return
        try {
            const { data } = await tagsApi.create(boardId, {
                title: newTagTitle.trim(),
                accentCode: newTagAccent,
                icon: newTagIcon || null,
            })
            setTags(prev => [...prev, data])
            setTask(prev => ({
                ...prev,
                tags: [...(prev.tags || []), data],
            }))
            setNewTagTitle('')
            setNewTagAccent('blue')
            setNewTagIcon('')
            setCreatingTag(false)
            setDirty(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const saveTagEdit = async () => {
        if (!editingTag || !editingTag.title.trim()) return
        try {
            const { data } = await tagsApi.update(editingTag.id, {
                title: editingTag.title.trim(),
                accentCode: editingTag.accentCode,
                icon: editingTag.icon || null,
            })
            setTags(prev => prev.map(tg => tg.id === data.id ? data : tg))
            setTask(prev => ({
                ...prev,
                tags: (prev.tags || []).map(tg => tg.id === data.id ? data : tg),
            }))
            setEditingTag(null)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const handleAttachmentClick = (a) => {
        const isImage = a.mimeCode?.startsWith('image/')
        if (isImage) {
            setPreviewAttachment(a)
        } else {
            const url = resolveUrl(a.url)
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    }

    const existingTaskIds = new Set([
        taskId,
        ...existingSubtasks.map(s => s.id),
    ])

    const autocompleteResults = subtaskInput.trim().length > 0
        ? allProjectTasks
            .filter(t => !existingTaskIds.has(t.id))
            .filter(t => t.title.toLowerCase().includes(subtaskInput.trim().toLowerCase()))
            .slice(0, 8)
        : []

    const attachExistingSubtask = async (existing) => {
        setSubtaskError(null)
        try {
            await tasksApi.setParent(existing.id, taskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setSubtaskInput('')
            setShowSubtaskAutocomplete(false)
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setSubtaskError(err.response?.data?.message || 'Error')
        }
    }

    const addPendingSubtask = () => {
        if (!subtaskInput.trim()) return
        setPendingSubtasks(prev => [...prev, { title: subtaskInput.trim() }])
        setSubtaskInput('')
        setShowSubtaskAutocomplete(false)
        setDirty(true)
    }

    const deleteExistingSubtask = async (subtaskId) => {
        if (!confirm(t.deleteSubtask + '?')) return
        try {
            await tasksApi.delete(subtaskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    const removePendingSubtask = (idx) => {
        setPendingSubtasks(prev => prev.filter((_, i) => i !== idx))
        setDirty(true)
    }

    const detachSubtask = async (subtaskId) => {
        if (!confirm(t.makeStandalone + '?')) return
        try {
            await tasksApi.clearParent(subtaskId)
            const { data } = await tasksApi.get(taskId)
            setTask(data)
            setExistingSubtasks(data.subtasks || [])
            setDirty(true)
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        }
    }

    /**
     * Перестановка подзадач внутри задачи.
     *
     * Раньше подзадачи таскали dnd-kit'ом прямо в карточке — они выезжали
     * за границы задачи. Теперь порядок меняется явными кнопками ↑/↓,
     * а позиции сохраняются на сервере.
     */
    const moveExistingSubtask = async (subtaskId, direction) => {
        const index = existingSubtasks.findIndex(s => s.id === subtaskId)
        const target = index + direction
        if (index < 0 || target < 0 || target >= existingSubtasks.length) return

        const next = [...existingSubtasks]
        const [moved] = next.splice(index, 1)
        next.splice(target, 0, moved)
        setExistingSubtasks(next)
        setDirty(true)

        try {
            await Promise.all(next.map((s, i) => tasksApi.update(s.id, { position: i })))
            onUpdated && onUpdated()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
            const { data } = await tasksApi.get(taskId)
            setExistingSubtasks(data.subtasks || [])
        }
    }

    const openSubtask = (subtaskId) => {
        if (!onOpenTask) return
        if (dirty) {
            setDiscardAction({ type: 'subtask', subtaskId })
            return
        }
        onOpenTask(subtaskId)
    }

    // Причины, по которым задача не сохранится. Блокирующие повторяют
    // ограничения бэкенда (UpdateTaskRequest: title 1..255, description <=5000)
    // и то, что раньше молча роняло сохранение.
    const taskSaveBlockers = () => {
        const list = []
        const title = (form.title || '').trim()

        if (canEditTask === false) list.push(t.taskNoPermission)
        if (!title) list.push(t.taskTitleRequired)
        if (form.title && form.title.length > 255) list.push(t.taskTitleTooLong(255))
        if (form.description && form.description.length > 5000) {
            list.push(t.taskDescriptionTooLong(5000))
        }
        if (!form.hasTime && form.deadlineTime) list.push(t.taskDeadlineNoDate)
        // Бэкенд сравнивает LocalDate.now() со своей датой дедлайна, поэтому
        // здесь тоже сравниваем строки YYYY-MM-DD в локальной зоне, а не
        // toLocaleDateString: тот зависел от локали браузера ('sv-SE' мог
        // молча не совпасть формат и проверка просто не срабатывала).
        if (isDateInPast(form.deadlineDate)) {
            list.push(t.taskDeadlinePast)
        }
        if (creatingTag && newTagTitle.length > 100) list.push(t.taskTagTooLong(100))
        // Текст в поле подзадачи ещё не нажат «Добавить» — уйдёт вместе с формой.
        if (subtaskInput.trim()) list.push(t.taskSubtaskPending)
        return list
    }

    // Предупреждения: не мешают сохранить, но результат будет неполным.
    const taskSaveWarnings = () => {
        const list = []
        if (pendingAttachments.length > 0) list.push(t.taskAttachPending(pendingAttachments.length))
        if (pendingRemovals.length > 0) list.push(t.taskDetachPending(pendingRemovals.length))
        if (pendingSubtasks.length > 0) list.push(t.taskSubtaskCreate(pendingSubtasks.length))
        if (!dirty && !recurrenceDirty && !pendingSubtasks.length
            && !pendingAttachments.length && !pendingRemovals.length) {
            list.push(t.taskNoChanges)
        }
        return list
    }

    const requestClose = () => {
        if (saving || discardAction) return
        if (dirty || recurrenceDirty) {
            setDiscardAction({ type: 'close' })
            return
        }
        onClose && onClose()
    }

    const confirmDiscard = () => {
        const action = discardAction
        setDiscardAction(null)
        if (!action) return
        if (action.type === 'subtask' && action.subtaskId != null) {
            onOpenTask && onOpenTask(action.subtaskId)
        } else {
            onClose && onClose()
        }
    }

    const handleSubtaskKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addPendingSubtask()
        }
        if (e.key === 'Escape') {
            setShowSubtaskAutocomplete(false)
        }
    }

    if (!open) return null

    const isSubtask = !!task?.parentId
    const isRecurrenceInstance = !!task?.isRecurrenceInstance

    // Ошибки, из-за которых «Сохранить» недоступна, и предупреждения, которые
    // сохранение не блокируют. Считаются на каждый рендер — так же, как
    // пересчитывается кнопка, поэтому кнопка и причина не разъедутся.
    const blockers = task ? taskSaveBlockers() : [t.taskNotLoaded]
    const warnings = task ? taskSaveWarnings() : []
    let saveHint = saving
        ? t.loading
        : blockers.length
            ? blockers.join(' · ')
            : warnings.length ? warnings.join(' · ') : ''

    return (
        <>
            <Modal
                open={open}
                onClose={requestClose}
                title={loading ? t.loading : t.taskLabel}
                className="task-detail-modal"
                footer={
                    <>
                        <button
                            type="button"
                            className="btn btn-icon btn-icon--danger"
                            onClick={handleDeleteClick}
                            title={t.deleteTaskTitle}
                        >
                            🗑
                        </button>
                        <div className="modal__foot-spacer" />
                        {detailTab === 'details' && saveHint && (
                            <div
                                className={`modal__foot-hint ${blockers.length ? 'modal__foot-hint--error' : ''}`}
                                role={blockers.length ? 'alert' : 'status'}
                                title={saveHint}
                            >
                                {blockers.length ? '⚠ ' : 'ℹ '}{saveHint}
                            </div>
                        )}
                        {detailTab === 'details' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={save}
                                disabled={saving || blockers.length > 0}
                                title={blockers.length ? blockers.join('\n') : undefined}
                            >
                                {saving ? t.loading : t.save}
                            </button>
                        )}
                        <button type="button" className="btn btn-ghost" onClick={requestClose}>
                            {t.cancel}
                        </button>
                    </>
                }
            >
                {loading && <div className="loading">{t.loading}</div>}
                {error && <div className="modal__error">{error}</div>}

                {task && (
                    <>
                        <div className="task-detail-tabs">
                            <button
                                type="button"
                                className={`task-detail-tab ${detailTab === 'details' ? 'task-detail-tab--active' : ''}`}
                                onClick={() => setDetailTab('details')}
                            >{t.tabDetails}</button>
                            <button
                                type="button"
                                className={`task-detail-tab ${detailTab === 'history' ? 'task-detail-tab--active' : ''}`}
                                onClick={() => setDetailTab('history')}
                            >{t.tabHistory}</button>
                            <button
                                type="button"
                                className={`task-detail-tab ${detailTab === 'chat' ? 'task-detail-tab--active' : ''}`}
                                onClick={() => setDetailTab('chat')}
                            >{t.tabChat}</button>
                        </div>

                        {detailTab === 'history' ? (
                            <TaskHistory taskId={taskId} />
                        ) : detailTab === 'chat' ? (
                            <TaskChat taskId={taskId} />
                        ) : (
                            <div className="task-detail">

                                {isGroupProject && (task.startedBy || task.lastEditedBy) && (
                                    <div className="task-detail__authors">
                                        {task.startedBy && (
                                            <div className="task-detail__author-row">
                                                <span className="task-detail__author-label">{t.startedByLabel}</span>
                                                <span className="task-detail__author-name">
                                                    {task.startedBy.displayName}
                                                </span>
                                            </div>
                                        )}
                                        {task.lastEditedBy && (
                                            <div className="task-detail__author-row">
                                                <span className="task-detail__author-label">{t.lastEditorLabel}</span>
                                                <span className="task-detail__author-name">
                                                    {task.lastEditedBy.displayName}
                                                    {task.lastEditedAt && (
                                                        <span className="task-detail__author-date">
                                                            {' · '}{new Date(task.lastEditedAt).toLocaleString('ru-RU')}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isGroupProject && task.lastEditedAt && (
                                    <div className="task-detail__authors task-detail__authors--solo">
                                        <div className="task-detail__author-row">
                                            <span className="task-detail__author-label">{t.changedAtLabel}</span>
                                            <span className="task-detail__author-name">
                                                {new Date(task.lastEditedAt).toLocaleString('ru-RU')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {task.recurrence && !isRecurrenceInstance && (
                                    <div className="recurrence-banner recurrence-banner--root">
                                        <span className="recurrence-banner__icon">🔁</span>
                                        <div className="recurrence-banner__text">
                                            <b>{t.recurrenceRootTitle}</b>{' '}
                                            {describeRecurrence(task.recurrence, t)}
                                            {' '}{t.recurrenceRootHint}
                                        </div>
                                    </div>
                                )}

                                {isRecurrenceInstance && (
                                    <div className="recurrence-banner">
                                        <span className="recurrence-banner__icon">🔁</span>
                                        <div className="recurrence-banner__text">
                                            {t.recurrenceInstanceHint}
                                            {task.occurrenceDate && (
                                                <> <b>{new Date(task.occurrenceDate).toLocaleDateString()}</b></>
                                            )}.
                                            {task.recurrenceParentId && onOpenTask && (
                                                <button
                                                    type="button"
                                                    className="recurrence-banner__link"
                                                    onClick={() => onOpenTask(task.recurrenceParentId)}
                                                >
                                                    {t.openRootBtn}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="task-detail__group">
                                    <div className="modal__field">
                                        <label className="modal__label">{t.nameLabel}</label>
                                        <input
                                            className="input"
                                            value={form.title}
                                            onChange={(e) => setField('title', e.target.value)}
                                        />
                                    </div>

                                    <div className="modal__field">
                                        <label className="modal__label">{t.taskDescriptionLabel}</label>
                                        <DetailTextEditor
                                            value={form.description}
                                            onSave={(html) => setField('description', html)}
                                            placeholder={t.addDescription}
                                            title={t.edit}
                                        />
                                    </div>
                                </div>

                                <div className="task-detail__group">
                                    <div className="modal__row">
                                        {!isSubtask && columns.length > 0 && (
                                            <div className="modal__field">
                                                <label className="modal__label">{t.statusLabel}</label>
                                                <select
                                                    className="input"
                                                    value={form.statusId}
                                                    onChange={(e) => setField('statusId', Number(e.target.value))}
                                                >
                                                    {columns.map(c => (
                                                        <option key={c.statusId} value={c.statusId}>{c.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="modal__field">
                                            <label className="modal__label">{t.priorityLabel}</label>
                                            <PriorityPicker
                                                value={form.priority}
                                                onChange={(value) => setField('priority', value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="modal__field">
                                        <label className="modal__label">{t.deadlineLabel}</label>
                                        <input
                                            className="input"
                                            type="date"
                                            value={form.deadlineDate}
                                            min={todayIsoDate()}
                                            onChange={(e) => setField('deadlineDate', e.target.value)}
                                        />
                                    </div>

                                    <label className="task-detail__toggle">
                                        <input
                                            type="checkbox"
                                            checked={form.hasTime}
                                            onChange={(e) => setField('hasTime', e.target.checked)}
                                        />
                                        <span>{t.specifyTime}</span>
                                    </label>

                                    {form.hasTime && (
                                        <div className="modal__field">
                                            <label className="modal__label">{t.timeLabel}</label>
                                            <input
                                                className="input"
                                                type="time"
                                                value={form.deadlineTime}
                                                onChange={(e) => setField('deadlineTime', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {!isSubtask && !isRecurrenceInstance && (
                                    <div className="task-detail__group">
                                        <RecurrenceEditor
                                            key={taskId}
                                            taskId={taskId}
                                            initial={recurrence}
                                            onChange={(val) => {
                                                if (!sameRecurrence(recurrence, val)) {
                                                    setRecurrenceDirty(true)
                                                }
                                                setRecurrence(val)
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="task-detail__group">
                                    <div className="task-detail__label-row">
                                        <div className="task-detail__label">{t.tagsLabel}</div>
                                        {boardId && (
                                            <button
                                                type="button"
                                                className="task-detail__small-btn"
                                                onClick={() => setCreatingTag(v => !v)}
                                            >
                                                {creatingTag ? t.cancelCreate : t.createTag}
                                            </button>
                                        )}
                                    </div>

                                    {creatingTag && (
                                        <div className="task-detail__create-tag">
                                            <input
                                                className="input"
                                                placeholder={t.tagName}
                                                value={newTagTitle}
                                                onChange={(e) => setNewTagTitle(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && createTag()}
                                                autoFocus
                                            />
                                            <select
                                                className="input tag-row__icon-select"
                                                value={newTagIcon}
                                                onChange={(e) => setNewTagIcon(e.target.value)}
                                            >
                                                {TAG_ICONS.map(ic => (
                                                    <option key={ic} value={ic}>
                                                        {ic ? `${ic}` : t.noIcon}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="color-picker tag-row__colors">
                                                {TAG_ACCENTS.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        data-accent={c}
                                                        className={`color-picker__item color-picker__item--sm ${newTagAccent === c ? 'color-picker__item--active' : ''}`}
                                                        onClick={() => setNewTagAccent(c)}
                                                    />
                                                ))}
                                            </div>
                                            <button type="button" className="btn btn-primary" onClick={createTag}>
                                                {t.ok}
                                            </button>
                                        </div>
                                    )}

                                    <div className="task-detail__tags">
                                        {tags.length === 0 && !creatingTag && (
                                            <div className="task-detail__empty">{t.noBoardTags}</div>
                                        )}
                                        {tags.map(tag => {
                                            const active = (task.tags || []).some(tg => tg.id === tag.id)
                                            return (
                                                <div key={tag.id} className="task-detail__tag-wrap">
                                                    <button
                                                        type="button"
                                                        className={`task-detail__tag ${active ? 'active' : ''}`}
                                                        style={active ? {
                                                            background: `var(--accent-${tag.accentCode || 'gray'})`,
                                                            borderColor: `var(--accent-${tag.accentCode || 'gray'})`,
                                                            color: '#fff',
                                                        } : {}}
                                                        onClick={() => toggleTag(tag.id)}
                                                    >
                                                        {tag.icon && <span className="task-tag__icon">{tag.icon}</span>}
                                                        {tag.title}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="task-detail__tag-edit"
                                                        onClick={() => setEditingTag({
                                                            id: tag.id,
                                                            title: tag.title,
                                                            accentCode: tag.accentCode || 'gray',
                                                            icon: tag.icon || '',
                                                        })}
                                                        title={t.edit}
                                                    >✎</button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {!isSubtask && (
                                    <div className="task-detail__group">
                                        <div className="task-detail__label-row">
                                            <div className="task-detail__label">
                                                {t.subtasksLabel} {(existingSubtasks.length + pendingSubtasks.length) > 0
                                                ? `(${existingSubtasks.length + pendingSubtasks.length})`
                                                : ''}
                                            </div>
                                        </div>

                                        <div className="task-detail__subtask-input-wrap">
                                            <input
                                                className="input"
                                                placeholder={t.findOrCreateSubtask}
                                                value={subtaskInput}
                                                onChange={(e) => {
                                                    setSubtaskInput(e.target.value)
                                                    setShowSubtaskAutocomplete(true)
                                                }}
                                                onFocus={() => setShowSubtaskAutocomplete(true)}
                                                onKeyDown={handleSubtaskKeyDown}
                                            />

                                            {showSubtaskAutocomplete && subtaskInput.trim().length > 0 && (
                                                <div className="task-detail__subtask-autocomplete">
                                                    {autocompleteResults.map(st => (
                                                        <button
                                                            key={st.id}
                                                            type="button"
                                                            className="task-detail__subtask-ac-item"
                                                            onClick={() => attachExistingSubtask(st)}
                                                        >
                                                            <span className="task-detail__subtask-ac-title">{st.title}</span>
                                                            {st.statusTitle && (
                                                                <span className="task-detail__subtask-ac-status">
                                                                    {st.statusTitle}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                    {autocompleteResults.length === 0 && (
                                                        <div className="task-detail__subtask-ac-empty">
                                                            {t.noMatches}
                                                        </div>
                                                    )}
                                                    {autocompleteResults.length > 0 && (
                                                        <button
                                                            type="button"
                                                            className="task-detail__subtask-ac-create"
                                                            onClick={addPendingSubtask}
                                                        >
                                                            {t.createNew(subtaskInput.trim())}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {subtaskError && (
                                            <div className="modal__error" style={{ marginTop: 8 }}>
                                                {subtaskError}
                                            </div>
                                        )}

                                        <div className="task-detail__subtasks">
                                            {existingSubtasks.length === 0 && pendingSubtasks.length === 0 && (
                                                <div className="task-detail__empty">{t.noSubtasks}</div>
                                            )}

                                            {existingSubtasks.map(st => {
                                                const stDone = st.statusCategoryCode === 'DONE'
                                                    || st.statusCode === 'DONE'
                                                    || st.statusCategoryCode === 'CANCELLED'

                                                return (
                                                    <div
                                                        key={st.id}
                                                        className="subtask-card"
                                                        style={{ '--accent': task.statusAccentCode
                                                                ? `var(--accent-${task.statusAccentCode})`
                                                                : 'var(--primary)' }}
                                                        onClick={() => openSubtask(st.id)}
                                                    >
                                                        <div className="subtask-card__head">
                                                            <span
                                                                className={`subtask-card__check ${stDone ? 'subtask-card__check--done' : ''}`}
                                                            />
                                                            <span className={`subtask-card__title ${stDone ? 'subtask-card__title--done' : ''}`}>
                                                                {st.title}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="subtask-card__btn"
                                                                onClick={(e) => { e.stopPropagation(); moveExistingSubtask(st.id, -1) }}
                                                                disabled={existingSubtasks[0]?.id === st.id}
                                                                title={t.moveUp}
                                                            >↑</button>
                                                            <button
                                                                type="button"
                                                                className="subtask-card__btn"
                                                                onClick={(e) => { e.stopPropagation(); moveExistingSubtask(st.id, 1) }}
                                                                disabled={existingSubtasks[existingSubtasks.length - 1]?.id === st.id}
                                                                title={t.moveDown}
                                                            >↓</button>
                                                            <button
                                                                type="button"
                                                                className="subtask-card__btn"
                                                                onClick={(e) => { e.stopPropagation(); detachSubtask(st.id) }}
                                                                title={t.makeStandalone}
                                                            >↗</button>
                                                            <button
                                                                type="button"
                                                                className="subtask-card__btn subtask-card__btn--danger"
                                                                onClick={(e) => { e.stopPropagation(); deleteExistingSubtask(st.id) }}
                                                                title={t.deleteSubtask}
                                                            >🗑</button>
                                                        </div>

                                                        <div className="subtask-card__meta">
                                                            {st.priority > 0 && (
                                                                <PriorityStars
                                                                    priority={st.priority}
                                                                    className="subtask-card__priority"
                                                                />
                                                            )}
                                                            {st.deadline && (
                                                                <span className="subtask-card__deadline">
                                                                    📅 {formatDeadline(st.deadline)}
                                                                </span>
                                                            )}
                                                            {st.subtaskTotal > 0 && (
                                                                <span className="subtask-card__subtask-count">
                                                                    {st.subtaskDone}/{st.subtaskTotal}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            {pendingSubtasks.map((ps, idx) => (
                                                <div key={`pending-${idx}`} className="subtask-card subtask-card--pending">
                                                    <div className="subtask-card__head">
                                                        <span className="subtask-card__check" />
                                                        <span className="subtask-card__title">{ps.title}</span>
                                                        <span className="subtask-card__pending-badge">{t.newBadge}</span>
                                                        <button
                                                            type="button"
                                                            className="subtask-card__btn subtask-card__btn--danger"
                                                            onClick={(e) => { e.stopPropagation(); removePendingSubtask(idx) }}
                                                            title={t.removeFromList}
                                                        >×</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="task-detail__group">
                                    <div className="task-detail__label">
                                        {t.attachmentsLabel} {
                                        (
                                            (task.attachments?.length || 0)
                                            - pendingRemovals.length
                                            + pendingAttachments.length
                                        ) > 0
                                            ? `(${(task.attachments?.length || 0) - pendingRemovals.length + pendingAttachments.length})`
                                            : ''
                                    }
                                    </div>
                                    <div className="task-detail__attachments">
                                        {/* Уже привязанные вложения, кроме помеченных на удаление */}
                                        {(task.attachments || [])
                                            .filter(a => !pendingRemovals.includes(a.id))
                                            .map(a => {
                                                const url = resolveUrl(a.url)
                                                const isImage = a.mimeCode?.startsWith('image/')
                                                return (
                                                    <div key={a.id} className="task-detail__attachment">
                                                        {isImage && url ? (
                                                            <img
                                                                src={url}
                                                                alt={a.originalName || ''}
                                                                onClick={() => handleAttachmentClick(a)}
                                                                style={{ cursor: 'zoom-in' }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none'
                                                                    e.target.parentNode.classList.add('task-detail__attachment--broken')
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="task-detail__file"
                                                                onClick={() => handleAttachmentClick(a)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                📎 {a.originalName}
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="task-detail__attachment-remove"
                                                            onClick={() => detachAttachment(a.id)}
                                                        >×</button>
                                                    </div>
                                                )
                                            })}

                                        {/* Помеченные на удаление — показываем с бейджем «на удаление» и кнопкой отмены */}
                                        {(task.attachments || [])
                                            .filter(a => pendingRemovals.includes(a.id))
                                            .map(a => {
                                                const url = resolveUrl(a.url)
                                                const isImage = a.mimeCode?.startsWith('image/')
                                                return (
                                                    <div
                                                        key={`removed-${a.id}`}
                                                        className="task-detail__attachment task-detail__attachment--removing"
                                                    >
                                                        {isImage && url ? (
                                                            <img
                                                                src={url}
                                                                alt={a.originalName || ''}
                                                                style={{ opacity: 0.5 }}
                                                            />
                                                        ) : (
                                                            <div className="task-detail__file">
                                                                📎 {a.originalName}
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="task-detail__attachment-remove task-detail__attachment-remove--undo"
                                                            onClick={() => undoRemoveAttachment(a.id)}
                                                            title={t.cancelRemoval}
                                                        >↺</button>
                                                        <span className="task-detail__attachment-badge task-detail__attachment-badge--removing">
                                                            {t.pendingRemovalBadge}
                                                        </span>
                                                    </div>
                                                )
                                            })}

                                        {/* Новые черновики */}
                                        {pendingAttachments.map(a => {
                                            const url = resolveUrl(a.url)
                                            const isImage = a.mimeCode?.startsWith('image/')
                                            return (
                                                <div
                                                    key={`pending-${a.id}`}
                                                    className="task-detail__attachment task-detail__attachment--pending"
                                                >
                                                    {isImage && url ? (
                                                        <img
                                                            src={url}
                                                            alt={a.originalName || ''}
                                                            onClick={() => setPreviewAttachment({ ...a, url })}
                                                            style={{ cursor: 'zoom-in' }}
                                                        />
                                                    ) : (
                                                        <div className="task-detail__file">
                                                            📎 {a.originalName}
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="task-detail__attachment-remove"
                                                        onClick={() => detachAttachment(a.id)}
                                                    >×</button>
                                                    <span className="task-detail__attachment-badge">{t.draftBadge}</span>
                                                </div>
                                            )
                                        })}

                                        <label className="task-detail__attachment-add">
                                            {uploading ? '...' : t.addAttachment}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                style={{ display: 'none' }}
                                                onChange={uploadAttachment}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal>

            {editingTag && (
                <div className="modal-overlay" onClick={() => setEditingTag(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal__head">
                            <h3 className="modal__title">{t.editTagModal}</h3>
                            <button className="modal__close" onClick={() => setEditingTag(null)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div className="modal__field">
                                <label className="modal__label">{t.titleLabel}</label>
                                <input
                                    className="input"
                                    value={editingTag.title}
                                    onChange={(e) => setEditingTag(f => ({ ...f, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">{t.iconLabel}</label>
                                <select
                                    className="input"
                                    value={editingTag.icon}
                                    onChange={(e) => setEditingTag(f => ({ ...f, icon: e.target.value }))}
                                >
                                    {TAG_ICONS.map(ic => (
                                        <option key={ic} value={ic}>
                                            {ic ? `${ic}` : t.noIcon}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal__field">
                                <label className="modal__label">{t.colorLabel}</label>
                                <div className="color-picker">
                                    {TAG_ACCENTS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            data-accent={c}
                                            className={`color-picker__item ${editingTag.accentCode === c ? 'color-picker__item--active' : ''}`}
                                            onClick={() => setEditingTag(f => ({ ...f, accentCode: c }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal__foot">
                            <button className="btn btn-ghost" onClick={() => setEditingTag(null)}>{t.cancel}</button>
                            <button className="btn btn-primary" onClick={saveTagEdit}>{t.save}</button>
                        </div>
                    </div>
                </div>
            )}

            <AttachmentPreview
                attachment={previewAttachment}
                onClose={() => setPreviewAttachment(null)}
            />

            <ConfirmModal {...modalProps} />

            <ConfirmModal
                open={!!discardAction}
                title={t.discardTitle}
                text={discardAction?.type === 'subtask'
                    ? t.discardToSubtask
                    : t.discardOnClose}
                confirmLabel={discardAction?.type === 'subtask' ? t.discardGoToSubtask : t.discardClose}
                cancelLabel={t.discardKeepEditing}
                danger
                onConfirm={confirmDiscard}
                onClose={() => setDiscardAction(null)}
            />
        </>
    )
}