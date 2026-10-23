import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { taskTemplatesApi, guidesApi } from '../api/api'
import TemplatePlanner, { DAY_HOURS, QUICK_HOURS } from '../components/templates/TemplatePlanner'
import { PriorityPicker } from '../components/task/PriorityStars'
import ConfirmModal from '../components/common/ConfirmModal'

const ACCENTS = ['blue', 'indigo', 'violet', 'purple', 'pink', 'red', 'coral', 'orange', 'green', 'teal', 'cyan', 'gray']
const STATUSES = [
    { code: 'ACTIVE', label: 'В работе' },
    { code: 'FROZEN', label: 'Заморожена' },
    { code: 'DONE', label: 'Готова' },
    { code: 'CANCELLED', label: 'Отменена' },
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

let uid = 0
const nextKey = () => `tplan-task-${++uid}`

function emptyTask(offset = null, startTime = null) {
    return {
        key: nextKey(),
        title: '',
        description: '',
        priority: 0,
        deadlineOffsetDays: offset,
        statusCategoryCode: 'ACTIVE',
        estimatedMinutes: '',
        startTime,
        subtasks: [],
        subtaskDraft: '',
    }
}

function taskFromApi(item) {
    return {
        key: nextKey(),
        title: item.title || '',
        description: item.description || '',
        priority: item.priority || 0,
        deadlineOffsetDays: item.deadlineOffsetDays ?? null,
        statusCategoryCode: item.statusCategoryCode || 'ACTIVE',
        estimatedMinutes: item.estimatedMinutes ?? '',
        startTime: item.startTime ? String(item.startTime).slice(0, 5) : null,
        subtasks: [...(item.subtasks || [])],
        subtaskDraft: '',
    }
}

function offsetValue(item) {
    if (item.deadlineOffsetDays === '' || item.deadlineOffsetDays == null) return null
    const value = Number(item.deadlineOffsetDays)
    return Number.isFinite(value) && value >= 0 ? value : null
}

function dayLabel(offset) {
    if (offset == null) return null
    const week = Math.floor(offset / 7)
    return `${WEEKDAYS[offset % 7]} · месяц ${Math.floor(week / 4) + 1} · неделя ${(week % 4) + 1}`
}

function timeMinutes(value) {
    if (!value) return Number.POSITIVE_INFINITY
    const [hours, minutes] = String(value).split(':').map(Number)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.POSITIVE_INFINITY
    return hours * 60 + minutes
}

function sortByTime(entries) {
    return [...entries].sort((a, b) => {
        const timeA = timeMinutes(a.item.startTime)
        const timeB = timeMinutes(b.item.startTime)
        if (timeA !== timeB) return timeA - timeB
        return a.index - b.index
    })
}

/**
 * Снимок сохраняемого содержимого шаблона для сравнения «изменено / нет».
 * Ключи (key), черновик подзадачи и раскрытие карточки в снимок не входят:
 * это состояние интерфейса, а не данные шаблона.
 */
function snapshotOf({ title, description, icon, accent, isPublic, items }) {
    return JSON.stringify({
        title: title || '',
        description: description || '',
        icon: icon || '',
        accent: accent || '',
        isPublic: Boolean(isPublic),
        items: (items || [])
            .filter((item) => item.title.trim())
            .map((item) => ({
                title: item.title.trim(),
                description: item.description || '',
                priority: Number(item.priority) || 0,
                deadlineOffsetDays: item.deadlineOffsetDays === '' || item.deadlineOffsetDays == null
                    ? null
                    : Number(item.deadlineOffsetDays),
                statusCategoryCode: item.statusCategoryCode || 'ACTIVE',
                estimatedMinutes: item.estimatedMinutes === '' || item.estimatedMinutes == null
                    ? null
                    : Number(item.estimatedMinutes),
                startTime: item.startTime || null,
                subtasks: item.subtasks || [],
            })),
    })
}

function buildSideRows(items, viewState) {
    const { view, weekIndex, dayWeekday } = viewState
    const rows = []
    const entries = items.map((item, index) => ({ item, index }))
    const assigned = entries.filter((entry) => offsetValue(entry.item) !== null)
    const unassigned = entries.filter((entry) => offsetValue(entry.item) === null)

    if (unassigned.length > 0) {
        rows.push({
            type: 'group',
            key: 'unassigned',
            label: 'Не на календаре',
            level: 0,
            count: unassigned.length,
        })
        for (const entry of sortByTime(unassigned)) {
            rows.push({ type: 'task', key: entry.item.key, item: entry.item })
        }
    }

    const addDay = (week, weekday, level) => {
        const list = sortByTime(
            assigned.filter((entry) => offsetValue(entry.item) === week * 7 + weekday)
        )
        if (list.length === 0) return
        rows.push({
            type: 'group',
            key: `day-${week}-${weekday}`,
            label: WEEKDAYS[weekday],
            level,
            count: list.length,
        })
        for (const entry of list) {
            rows.push({ type: 'task', key: entry.item.key, item: entry.item })
        }
    }

    if (view === 'day') {
        addDay(weekIndex, dayWeekday, 0)
        return rows
    }

    if (view === 'week') {
        for (let weekday = 0; weekday < 7; weekday += 1) {
            addDay(weekIndex, weekday, 0)
        }
        return rows
    }

    if (view === 'month') {
        const month = Math.floor(weekIndex / 4)
        for (let row = 0; row < 4; row += 1) {
            const week = month * 4 + row
            const weekEntries = assigned.filter(
                (entry) => Math.floor(offsetValue(entry.item) / 7) === week
            )
            if (weekEntries.length === 0) continue
            rows.push({
                type: 'group',
                key: `week-${week}`,
                label: `${row + 1}-я неделя`,
                level: 0,
                count: weekEntries.length,
            })
            for (let weekday = 0; weekday < 7; weekday += 1) {
                addDay(week, weekday, 1)
            }
        }
        return rows
    }

    for (let month = 0; month < 12; month += 1) {
        const monthEntries = assigned.filter(
            (entry) => Math.floor(offsetValue(entry.item) / 28) === month
        )
        if (monthEntries.length === 0) continue
        rows.push({
            type: 'group',
            key: `month-${month}`,
            label: `Месяц ${month + 1}`,
            level: 0,
            count: monthEntries.length,
        })
        for (let row = 0; row < 4; row += 1) {
            const week = month * 4 + row
            const weekEntries = assigned.filter(
                (entry) => Math.floor(offsetValue(entry.item) / 7) === week
            )
            if (weekEntries.length === 0) continue
            rows.push({
                type: 'group',
                key: `week-${week}`,
                label: `${row + 1}-я неделя`,
                level: 1,
                count: weekEntries.length,
            })
            for (let weekday = 0; weekday < 7; weekday += 1) {
                addDay(week, weekday, 2)
            }
        }
    }

    return rows
}

/**
 * Необязательный блокировщик для data-router (createBrowserRouter).
 *
 * useBlocker в приложении на BrowserRouter бросает исключение при рендере,
 * поэтому хук нельзя вызывать «всегда». Хуки условно вызывать тем более
 * нельзя, так что выносим его в отдельный компонент: если дерево уже падает
 * без data-router, этот элемент просто не отрендерится, а страница жива.
 * Внутри ErrorBoundary поддерева ошибка не нужна — поэтому компонент
 * монтируется только под собственным границей.
 */
function LeaveBlocker({ shouldBlock, onBlocked }) {
    const blocker = useBlocker(shouldBlock)

    useEffect(() => {
        if (blocker.state === 'blocked') onBlocked(blocker)
        // blocker пересоздаётся на каждый рендер — следим только за состоянием.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocker.state])

    return null
}

/** Граница для LeaveBlocker: в BrowserRouter хук бросает — гасим молча. */
class BlockerBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { failed: false }
    }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch() {
        // Ожидаемо для BrowserRouter: useBlocker требует data-router.
    }

    render() {
        return this.state.failed ? null : this.props.children
    }
}

export default function TemplateEditorPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const [searchParams] = useSearchParams()
    const isEdit = Boolean(id)

    // ?public=1 — переход с «Создать публичный шаблон» (из гайдов или каталога).
    const wantPublic = searchParams.get('public') === '1'
    // ?from=<guideId> — предзаполнить новый шаблон задачами гайда.
    const fromGuideId = searchParams.get('from')

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('🧩')
    const [accent, setAccent] = useState('blue')
    const [isPublic, setIsPublic] = useState(wantPublic)
    const [items, setItems] = useState([])
    const [expandedKey, setExpandedKey] = useState(null)
    const [dropZone, setDropZone] = useState(null)
    const [plannerState, setPlannerState] = useState({
        view: 'week',
        weekIndex: 0,
        dayWeekday: 0,
    })

    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [loadError, setLoadError] = useState('')

    // «Изменено» и защита от случайного выхода без сохранения.
    const [baseline, setBaseline] = useState(null)
    const [leaveTarget, setLeaveTarget] = useState(null)

    useEffect(() => {
        if (!id) {
            setTitle('')
            setDescription('')
            setIcon('🧩')
            setAccent('blue')
            setIsPublic(wantPublic)
            setItems([])
            setExpandedKey(null)
            setLoadError('')
            // Базовый снимок пустого блока — не пустой объект, а такой же
            // снимок без задач: тогда «изменено» станет true только при
            // реальных правках, а не сразу после открытия формы.
            setBaseline(null)
            if (!fromGuideId) {
                setBaseline(snapshotOf({
                    title: '',
                    description: '',
                    icon: '🧩',
                    accent: 'blue',
                    isPublic: wantPublic,
                    items: [],
                }))
            }

            // Новый шаблон из гайда: переносим задачи, сохраняя порядок по дням.
            if (fromGuideId) {
                setLoading(true)
                guidesApi.get(fromGuideId)
                    .then(({ data }) => {
                        const loaded = (data?.tasks || []).map(task => ({
                            key: nextKey(),
                            title: task.title || '',
                            description: task.description || '',
                            priority: task.priority || 0,
                            deadlineOffsetDays: task.dayOffset ?? null,
                            statusCategoryCode: task.statusCategoryCode || 'ACTIVE',
                            estimatedMinutes: task.estimatedMinutes ?? '',
                            startTime: null,
                            subtasks: [...(task.subtasks || [])],
                            subtaskDraft: '',
                        }))
                        setTitle(data?.title || '')
                        setDescription(data?.subtitle || data?.description || '')
                        setIcon(data?.emoji || '🧩')
                        setAccent(data?.accent || 'blue')
                        setItems(loaded)
                        setBaseline(snapshotOf({
                            title: data?.title || '',
                            description: data?.subtitle || data?.description || '',
                            icon: data?.emoji || '🧩',
                            accent: data?.accent || 'blue',
                            isPublic: wantPublic,
                            items: loaded,
                        }))
                    })
                    .catch((err) => {
                        setLoadError(err.response?.data?.message || 'Не удалось загрузить гайд')
                    })
                    .finally(() => setLoading(false))
                return
            }

            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setLoadError('')
        taskTemplatesApi.get(id)
            .then(({ data }) => {
                if (cancelled) return
                const loaded = (data?.items || []).map(taskFromApi)
                setTitle(data?.title || '')
                setDescription(data?.description || '')
                setIcon(data?.icon || '🧩')
                setAccent(data?.accent || 'blue')
                setIsPublic(Boolean(data?.isPublic))
                setItems(loaded)
                setExpandedKey(null)
                setBaseline(snapshotOf({
                    title: data?.title || '',
                    description: data?.description || '',
                    icon: data?.icon || '🧩',
                    accent: data?.accent || 'blue',
                    isPublic: Boolean(data?.isPublic),
                    items: loaded,
                }))
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoadError(err.response?.data?.message || 'Не удалось загрузить шаблон')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => { cancelled = true }
    }, [id, wantPublic, fromGuideId])

    const assignedCount = useMemo(
        () => items.filter((item) => offsetValue(item) !== null).length,
        [items]
    )

    // Текущий снимок формы и сравнение с состоянием «как было при открытии».
    const currentSnapshot = useMemo(
        () => snapshotOf({ title, description, icon, accent, isPublic, items }),
        [title, description, icon, accent, isPublic, items],
    )
    const dirty = baseline !== null && currentSnapshot !== baseline

    /**
     * Выход со страницы. Если есть несохранённые изменения — сначала
     * модалка по центру, переход выполняется только после подтверждения.
     */
    const requestLeave = (to = '/templates') => {
        if (!dirty) {
            nav(to)
            return
        }
        setLeaveTarget({ navigate: (target) => nav(target), to })
    }

    // Всё, что ведёт прочь со страницы (меню, ссылки, история браузера),
    // перехватывается тем же предупреждением, что и «Отмена».
    //
    // useBlocker есть только в data-router (createBrowserRouter), а приложение
    // на BrowserRouter: там хук бросает «must be used within a data router»
    // прямо в рендере, и страница падает в ErrorBoundary. Поэтому основная
    // защита — свой обработчик кликов (`leaveGuardProps`) и beforeunload
    // ниже; на data-router дополнительно включается useBlocker в отдельном
    // компоненте-стороже (см. LeaveBlocker).
    const dirtyRef = useRef(dirty)
    useEffect(() => { dirtyRef.current = dirty }, [dirty])

    // «Остаться»/Esc — закрыть модалку.
    const cancelLeave = () => {
        setLeaveTarget(null)
    }

    // «Выйти без сохранения» — ведём по адресу из модалки, либо на каталог.
    const confirmLeave = () => {
        const target = leaveTarget
        setLeaveTarget(null)
        if (!target) return
        nav(target.to || '/templates')
    }

    /**
     * Перехват кликов по ссылкам внутри страницы (меню, «← Все шаблоны»):
     * без него с несохранёнными изменениями можно молча уйти с формы.
     * Ctrl/Cmd/Shift + клик и средняя кнопка не трогаем — это новые вкладки.
     */
    const leaveGuardProps = {
        onClickCapture: (e) => {
            if (!dirtyRef.current) return
            if (e.defaultPrevented || e.button !== 0) return
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const anchor = e.target instanceof Element ? e.target.closest('a[href]') : null
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
            const href = anchor.getAttribute('href')
            if (!href || href.startsWith('#')) return
            const url = new URL(anchor.href, window.location.href)
            if (url.origin !== window.location.origin) return
            e.preventDefault()
            e.stopPropagation()
            requestLeave(url.pathname + url.search + url.hash)
        },
    }

    // Перезагрузка/закрытие вкладки — нативное предупреждение браузера.
    useEffect(() => {
        if (!dirty) return undefined
        const onBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = ''
            return ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [dirty])

    // Сторож для data-router: ловит переходы браузерными «назад/вперёд».
    // На BrowserRouter он отвалится внутри BlockerBoundary — это нормально.
    const blockerShouldBlock = useCallback(
        ({ currentLocation, nextLocation }) => dirtyRef.current
            && currentLocation.pathname !== nextLocation.pathname,
        [],
    )
    const handleBlocked = useCallback((blocker) => {
        setLeaveTarget({
            to: blocker.location?.pathname || '/templates',
            navigate: (to) => blocker.proceed(to),
        })
    }, [])

    const sideRows = useMemo(
        () => buildSideRows(items, plannerState),
        [items, plannerState]
    )

    const updatePlanner = (patch) => {
        setPlannerState((prev) => ({ ...prev, ...patch }))
    }

    const patchItem = (key, field, value) => {
        setItems((prev) => prev.map((item) => (
            item.key === key ? { ...item, [field]: value } : item
        )))
    }

    const selectItem = (key) => {
        setExpandedKey(key)
        requestAnimationFrame(() => {
            document.getElementById(`tplan-task-${key}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            })
        })
    }

    const addTask = (offset = null, startTime = null) => {
        const item = emptyTask(offset, startTime)
        setItems((prev) => [...prev, item])
        setExpandedKey(item.key)
        requestAnimationFrame(() => {
            document.getElementById(`tplan-task-${item.key}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            })
        })
    }

    const addTaskForSlot = (week, weekday) => {
        addTask(week * 7 + weekday)
    }

    /** «+ задача» в дневном виде — сразу в конкретный базовый час. */
    const addTaskForSlotAtTime = (week, weekday, hour) => {
        addTask(week * 7 + weekday, hour)
    }

    /**
     * Перетаскивание в день. Если бросили в конкретный час (day view),
     * сразу проставляем время начала.
     */
    const assignTask = (key, offset, startTime) => {
        setItems((prev) => prev.map((item) => {
            if (item.key !== key) return item
            const next = { ...item, deadlineOffsetDays: offset }
            if (startTime) next.startTime = startTime
            return next
        }))
    }

    const unassignTask = (key) => {
        patchItem(key, 'deadlineOffsetDays', null)
    }

    const addSubtask = (key) => {
        setItems((prev) => prev.map((item) => {
            if (item.key !== key) return item
            const title = (item.subtaskDraft || '').trim()
            if (!title) return item
            return { ...item, subtasks: [...item.subtasks, title], subtaskDraft: '' }
        }))
    }

    const removeSubtask = (key, index) => {
        setItems((prev) => prev.map((item) => (
            item.key === key
                ? { ...item, subtasks: item.subtasks.filter((_, i) => i !== index) }
                : item
        )))
    }

    const toggleTime = (key) => {
        const item = items.find((it) => it.key === key)
        // Включаем время — сразу типичный рабочий час; нужный ставится
        // кликом по сетке всех 24 часов.
        patchItem(key, 'startTime', item?.startTime ? null : QUICK_HOURS[0])
    }

    const removeTask = (key) => {
        setItems((prev) => prev.filter((item) => item.key !== key))
        if (expandedKey === key) setExpandedKey(null)
    }

    const handleDropUnassign = (e) => {
        e.preventDefault()
        const key = e.dataTransfer.getData('text/plain')
        setDropZone(null)
        if (key) unassignTask(key)
    }

    const handleDropDelete = (e) => {
        e.preventDefault()
        const key = e.dataTransfer.getData('text/plain')
        setDropZone(null)
        if (key) removeTask(key)
    }

    const zoneHandlers = (name, onDrop) => ({
        onDragOver: (e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
        },
        onDragEnter: () => setDropZone(name),
        onDragLeave: (e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setDropZone((current) => (current === name ? null : current))
            }
        },
        onDrop,
    })

    /**
     * Причины, по которым шаблон не сохранится. Повторяют ограничения
     * бэкенда (SaveTaskTemplateRequest): @Size и типы колонок. Раньше
     * превышение давало 500 «Внутренняя ошибка сервера» — непонятно,
     * что чинить.
     */
    const saveBlockers = () => {
        const list = []
        const t = title.trim()

        if (!t) list.push('Укажите название шаблона')
        else if (t.length > 120) list.push(`Название шаблона длиннее 120 символов (${t.length})`)
        if ((description || '').length > 2000) list.push('Описание шаблона длиннее 2000 символов')
        if ((icon || '').length > 16) list.push('Иконка длиннее 16 символов')

        const named = items.filter((item) => item.title.trim())
        if (named.length === 0) list.push('Добавьте хотя бы одну задачу с названием')

        // Пустые карточки на календаре: без названия бэкенд отклонит весь шаблон.
        const blank = items.filter((item) => !item.title.trim())
        if (blank.length > 0) {
            list.push(`Задач без названия: ${blank.length} — впишите или удалите их`)
        }

        const longTitles = items.filter((item) => item.title.trim().length > 255)
        if (longTitles.length > 0) list.push(`Название задачи длиннее 255 символов (${longTitles.length})`)

        // SMALLINT в базе: priority — 16-битное число.
        const badPriority = items.filter((item) => {
            const p = Number(item.priority) || 0
            return p < -32768 || p > 32767
        })
        if (badPriority.length > 0) list.push('Некорректный приоритет у задачи')

        const badEstimate = items.filter((item) => {
            if (item.estimatedMinutes === '' || item.estimatedMinutes == null) return false
            const n = Number(item.estimatedMinutes)
            return !Number.isFinite(n) || n < 0 || !Number.isInteger(n)
        })
        if (badEstimate.length > 0) list.push('Оценка времени должна быть целым числом ≥ 0')

        // Старые шаблоны могли хранить «24:00» — бэкенд принимает только 00–23.
        const badTime = items.filter((item) => item.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime))
        if (badTime.length > 0) list.push('Время начала должно быть в формате ЧЧ:ММ (00:00–23:59)')

        const draft = items.filter((item) => (item.subtaskDraft || '').trim())
        if (draft.length > 0) list.push('Есть недобавленные подзадачи — нажмите «Добавить»')

        return list
    }

    const save = async () => {
        const blockers = saveBlockers()
        if (blockers.length > 0) {
            setError(blockers[0])
            return
        }

        const payloadItems = items
            .filter((item) => item.title.trim())
            .map((item) => ({
                title: item.title.trim(),
                description: item.description,
                priority: Number(item.priority) || 0,
                deadlineOffsetDays: item.deadlineOffsetDays === '' || item.deadlineOffsetDays == null
                    ? null
                    : Number(item.deadlineOffsetDays),
                statusCategoryCode: item.statusCategoryCode || 'ACTIVE',
                estimatedMinutes: item.estimatedMinutes === '' ? null : Number(item.estimatedMinutes),
                startTime: item.startTime || null,
                subtasks: item.subtasks,
            }))

        setSaving(true)
        setError('')
        try {
            const payload = {
                title: title.trim(),
                description,
                icon: icon || '🧩',
                accent,
                isPublic,
                items: payloadItems,
            }
            if (id) {
                await taskTemplatesApi.update(id, payload)
            } else {
                await taskTemplatesApi.create(payload)
            }
            // Сохранено — шаблон на сервере такой же, как на экране, поэтому
            // сдвигаем базовый снимок и выходим без перехвата useBlocker.
            setBaseline(currentSnapshot)
            nav('/templates')
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось сохранить шаблон')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="loading">Загружаем шаблон…</div>
    }
    if (loadError) {
        return (
            <div className="tplan-page">
                <div className="error">{loadError}</div>
                <Link to="/templates" className="btn btn-ghost">← К шаблонам</Link>
            </div>
        )
    }

    // Причины, по которым «Сохранить» недоступна; пересчитываются на каждом
    // рендере, поэтому подсказка и кнопка не разъезжаются.
    const blockers = saveBlockers()

    return (
        <div className="tplan-page" {...leaveGuardProps}>
            <BlockerBoundary>
                <LeaveBlocker shouldBlock={blockerShouldBlock} onBlocked={handleBlocked} />
            </BlockerBoundary>
            <header className="tplan-head">
                <div className="tplan-head__top">
                    <button
                        type="button"
                        className="tplan-back tplan-back--button"
                        onClick={() => requestLeave('/templates')}
                    >← Все шаблоны</button>
                </div>

                <div className="tplan-head__main">
                    <input
                        className="input tplan-icon"
                        value={icon}
                        maxLength={4}
                        onChange={(e) => setIcon(e.target.value)}
                        title="Иконка шаблона"
                        aria-label="Иконка шаблона"
                    />

                    <div className="tplan-head__identity">
                        <input
                            className="tplan-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Название шаблона"
                            aria-label="Название шаблона"
                            maxLength={120}
                            autoFocus
                        />
                        <input
                            className="tplan-subtitle"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Короткое описание: для каких случаев подходит шаблон"
                            aria-label="Описание шаблона"
                            maxLength={2000}
                        />
                    </div>

                    <div className="tplan-head__side">
                        <span className="tplan-label">Цвет</span>
                        <div className="tplan-accents">
                            {ACCENTS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`tplan-accent ${accent === color ? 'is-active' : ''}`}
                                    style={{ '--swatch': `var(--accent-${color}, #97a0af)` }}
                                    onClick={() => setAccent(color)}
                                    title={color}
                                    aria-label={`Цвет ${color}`}
                                />
                            ))}
                        </div>

                        <label className="tplan-switch" title="Публичный шаблон виден в каталоге всем пользователям">
                            <input
                                type="checkbox"
                                className="tplan-switch__input"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                            <span className="tplan-switch__track" aria-hidden="true">
                                <span className="tplan-switch__thumb" />
                            </span>
                            <span className="tplan-switch__text">
                                <span className="tplan-switch__title">Публичный шаблон</span>
                                <span className="tplan-switch__hint">
                                    {isPublic
                                        ? 'Появится в каталоге «Публичные шаблоны»'
                                        : 'Виден только вам'}
                                </span>
                            </span>
                        </label>
                    </div>
                </div>

                <div className="tplan-head__stats">
                    <span><b>{items.length}</b> задач</span>
                    <span><b>{assignedCount}</b> на календаре</span>
                    <span><b>{items.length - assignedCount}</b> вне календаря</span>
                    {isPublic && <span className="tplan-public-badge">🌍 публичный</span>}
                    <span className="tplan-head__tip">
                        Создавайте задачи справа и перетаскивайте их на нужный день недели.
                    </span>
                </div>
            </header>

            <div className="tplan-workspace">
                <TemplatePlanner
                    items={items}
                    viewState={plannerState}
                    onViewStateChange={updatePlanner}
                    selectedKey={expandedKey}
                    onSelectItem={selectItem}
                    onAssign={assignTask}
                    onAddForSlot={addTaskForSlot}
                    onAddForSlotAtTime={addTaskForSlotAtTime}
                />

                <aside className="tplan-side">
                    <div className="tplan-side__head">
                        <div className="tplan-side__heading">
                            <h2>Задачи шаблона</h2>
                            <span className="tplan-side__count">{items.length}</span>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => addTask()}
                        >+ Задача</button>
                    </div>

                    <p className="tplan-side__hint">
                        Новая задача появляется здесь. Перетащите её на день в календаре,
                        чтобы задать срок. День можно поменять в любой момент.
                    </p>

                    <div className="tplan-side__list">
                        {items.length === 0 && (
                            <div className="tplan-side__empty">
                                Пока пусто. Нажмите «+ Задача», заполните название и перетащите
                                задачу на нужный день.
                            </div>
                        )}

                        {sideRows.map((row) => {
                            if (row.type === 'group') {
                                return (
                                    <div
                                        key={row.key}
                                        className={`tplan-side__group tplan-side__group--l${row.level}`}
                                    >
                                        <span className="tplan-side__group-label">{row.label}</span>
                                        <span className="tplan-side__group-count">{row.count}</span>
                                    </div>
                                )
                            }

                            const item = row.item
                            const open = expandedKey === item.key
                            const assigned = offsetValue(item) !== null
                            return (
                                <div
                                    key={item.key}
                                    id={`tplan-task-${item.key}`}
                                    className={[
                                        'tplan-task',
                                        open ? 'is-open' : '',
                                        assigned ? '' : 'is-unassigned',
                                    ].filter(Boolean).join(' ')}
                                >
                                    <div
                                        className="tplan-task__row"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = 'move'
                                            e.dataTransfer.setData('text/plain', item.key)
                                        }}
                                        onClick={() => setExpandedKey(open ? null : item.key)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setExpandedKey(open ? null : item.key)
                                            }
                                        }}
                                    >
                                        <span className="tplan-task__grip" title="Перетащить на день">⋮⋮</span>
                                        <span className="tplan-task__title">
                                            {item.title || 'Новая задача'}
                                        </span>
                                        <span className={`tplan-task__chevron ${open ? 'is-open' : ''}`}>›</span>
                                    </div>

                                    {open && (
                                        <div className="tplan-task__editor">
                                            <div className="modal__field">
                                                <input
                                                    className="input"
                                                    value={item.title}
                                                    onChange={(e) => patchItem(item.key, 'title', e.target.value)}
                                                    placeholder="Что нужно сделать?"
                                                    maxLength={255}
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="create-task__hint-inline">
                                                📅 {assigned
                                                    ? dayLabel(offsetValue(item))
                                                    : 'Не на календаре — перетащите задачу на день'}
                                            </div>

                                            <div className="modal__field">
                                                <label className="modal__label">Описание</label>
                                                <textarea
                                                    className="input"
                                                    rows={2}
                                                    value={item.description}
                                                    onChange={(e) => patchItem(item.key, 'description', e.target.value)}
                                                    placeholder="Подробности"
                                                    maxLength={5000}
                                                />
                                            </div>

                                            <div className="modal__row">
                                                <div className="modal__field">
                                                    <label className="modal__label">Статус</label>
                                                    <select
                                                        className="input"
                                                        value={item.statusCategoryCode}
                                                        onChange={(e) => patchItem(item.key, 'statusCategoryCode', e.target.value)}
                                                    >
                                                        {STATUSES.map((status) => (
                                                            <option key={status.code} value={status.code}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="modal__field">
                                                    <label className="modal__label">Приоритет</label>
                                                    <PriorityPicker
                                                        value={item.priority}
                                                        onChange={(value) => patchItem(item.key, 'priority', value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="modal__field">
                                                <label className="modal__label">Оценка, мин</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="input"
                                                    value={item.estimatedMinutes}
                                                    onChange={(e) => patchItem(item.key, 'estimatedMinutes', e.target.value)}
                                                    placeholder="—"
                                                />
                                            </div>

                                            <label className="task-detail__toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(item.startTime)}
                                                    onChange={() => toggleTime(item.key)}
                                                />
                                                <span>Указать время начала</span>
                                            </label>

                                            {item.startTime && (
                                                <div className="modal__field">
                                                    <label className="modal__label">Время начала</label>
                                                    {/* Все 24 часа сеткой 6×4 — компактно, без
                                                        длинной прокрутки и без «только базовых». */}
                                                    <div className="tplan-hours" role="group" aria-label="Время начала">
                                                        {DAY_HOURS.map((hour) => (
                                                            <button
                                                                key={hour}
                                                                type="button"
                                                                className={item.startTime === hour ? 'is-active' : ''}
                                                                onClick={() => patchItem(item.key, 'startTime', hour)}
                                                                title={hour === '00:00' ? '00:00 — полночь' : hour}
                                                            >
                                                                {hour}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="create-task__hint-inline">
                                                        Любой час суток. Кнопка ниже — вернуть задачу в «без
                                                        времени».
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => patchItem(item.key, 'startTime', null)}
                                                    >Без времени</button>
                                                </div>
                                            )}

                                            <div
                                                className="task-detail__group"
                                                style={{ paddingBottom: 0, borderBottom: 'none', gap: 12 }}
                                            >
                                                <div className="task-detail__label-row">
                                                    <div className="task-detail__label">
                                                        Подзадачи {item.subtasks.length > 0 ? `(${item.subtasks.length})` : ''}
                                                    </div>
                                                </div>

                                                <div className="create-task__subtask-row">
                                                    <input
                                                        className="input"
                                                        placeholder="Название подзадачи"
                                                        value={item.subtaskDraft}
                                                        onChange={(e) => patchItem(item.key, 'subtaskDraft', e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                addSubtask(item.key)
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="create-task__subtask-add"
                                                        onClick={() => addSubtask(item.key)}
                                                        disabled={!item.subtaskDraft.trim()}
                                                    >Добавить</button>
                                                </div>

                                                {item.subtasks.length > 0 && (
                                                    <div className="create-task__subtasks">
                                                        {item.subtasks.map((subtask, index) => (
                                                            <div key={`${item.key}-subtask-${index}`} className="create-task__subtask">
                                                                <span className="create-task__subtask-title">{subtask}</span>
                                                                <button
                                                                    type="button"
                                                                    className="create-task__subtask-remove"
                                                                    onClick={() => removeSubtask(item.key, index)}
                                                                    title="Убрать из списка"
                                                                >×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="tplan-task__footer">
                                                <div className="tplan-task__footer-actions">
                                                    {assigned && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => unassignTask(item.key)}
                                                        >Снять с дня</button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="tplan-task__delete"
                                                        onClick={() => removeTask(item.key)}
                                                    >Удалить</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="tplan-side__drops">
                        <div
                            className={[
                                'tplan-side__drop',
                                dropZone === 'unassign' ? 'is-over' : '',
                            ].filter(Boolean).join(' ')}
                            {...zoneHandlers('unassign', handleDropUnassign)}
                        >
                            <b>Снять привязку</b>
                            <span>Перетащите сюда задачу, чтобы убрать день</span>
                        </div>

                        <div
                            className={[
                                'tplan-side__drop',
                                'tplan-side__drop--danger',
                                dropZone === 'delete' ? 'is-over' : '',
                            ].filter(Boolean).join(' ')}
                            {...zoneHandlers('delete', handleDropDelete)}
                        >
                            <b>Удалить задачу</b>
                            <span>Перетащите сюда задачу, чтобы удалить её</span>
                        </div>
                    </div>
                </aside>
            </div>

            {error && <div className="tplan-error">{error}</div>}

            {/* Действия под самим шаблоном: список задач — рабочая область
                страницы, поэтому «Сохранить»/«Отмена» стоят после неё,
                а не в шапке. */}
            <footer className="tplan-actions">
                {blockers.length > 0
                    ? <span className="tplan-actions__hint tplan-actions__hint--error" role="alert">
                        ⚠ {blockers[0]}
                        {blockers.length > 1 && <span className="tplan-actions__more"> и ещё {blockers.length - 1}</span>}
                    </span>
                    : dirty
                        ? <span className="tplan-actions__hint" title="Есть несохранённые изменения">
                            • не сохранено
                        </span>
                        : <span className="tplan-actions__hint tplan-actions__hint--clean">
                            {isEdit ? 'Все изменения сохранены' : 'Черновик нового шаблона'}
                        </span>}
                <div className="tplan-actions__buttons">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={save}
                        disabled={saving || blockers.length > 0}
                        title={blockers.length ? blockers.join('\n') : undefined}
                    >{saving ? 'Сохраняем…' : 'Сохранить шаблон'}</button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => requestLeave('/templates')}
                        disabled={saving}
                    >Отмена</button>
                </div>
            </footer>

            <ConfirmModal
                open={Boolean(leaveTarget)}
                title="Выйти без сохранения?"
                text={
                    title.trim()
                        ? `Изменения в шаблоне «${title.trim()}» не сохранены. Если выйти сейчас, они пропадут.`
                        : 'Изменения в шаблоне не сохранены. Если выйти сейчас, они пропадут.'
                }
                confirmLabel="Выйти без сохранения"
                cancelLabel="Остаться"
                danger
                onConfirm={confirmLeave}
                onClose={cancelLeave}
            />
        </div>
    )
}
