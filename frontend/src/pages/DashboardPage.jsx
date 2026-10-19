// frontend/src/pages/DashboardPage.jsx

/**
 * Стартовая страница сайта.
 *
 * Пользователь сам собирает её из виджетов: добавление/удаление, порядок
 * и ширина (узкий/широкий) хранятся в localStorage отдельно для каждого
 * аккаунта. Данные приходят одним пакетом из useDashboardData.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/format'
import useDashboardData from '../components/dashboard/useDashboardData'
import {
    WIDGET_COMPONENTS,
    WIDGET_LIBRARY,
    greeting,
} from '../components/dashboard/DashboardWidgets'
import WidgetCard from '../components/dashboard/WidgetCard'
import AddWidgetModal from '../components/dashboard/AddWidgetModal'

const STORAGE_PREFIX = 'taskboard.dashboard.layout.v1'

const DEFAULT_LAYOUT = [
    { type: 'todayPlan', size: 'wide' },
    { type: 'doneToday', size: 'small' },
    { type: 'coopBoard', size: 'small' },
    { type: 'achievements', size: 'small' },
    { type: 'shopNew', size: 'small' },
    { type: 'stats', size: 'wide' },
    { type: 'week', size: 'wide' },
    { type: 'note', size: 'small' },
]

let seq = 0
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`

const storageKey = (userId) => `${STORAGE_PREFIX}.${userId || 'guest'}`

const makeDefault = () => DEFAULT_LAYOUT.map(w => ({ id: uid(), ...w }))

function readLayout(userId) {
    try {
        const raw = localStorage.getItem(storageKey(userId))
        if (!raw) return makeDefault()

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return makeDefault()

        const cleaned = parsed
            .filter(w => w && WIDGET_LIBRARY[w.type])
            .map(w => ({
                id: w.id || uid(),
                type: w.type,
                size: w.size === 'wide' ? 'wide' : 'small',
            }))

        // Пустая раскладка — осознанный выбор пользователя (убрал все
        // виджеты), её сохраняем. А вот если в storage лежали только
        // неизвестные типы — откатываемся к стандартной.
        if (parsed.length > 0 && cleaned.length === 0) return makeDefault()
        return cleaned
    } catch {
        return makeDefault()
    }
}

function saveLayout(userId, layout) {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify(layout))
    } catch {
        /* приватный режим / переполнение — не критично */
    }
}

function todayLabel() {
    const text = new Date().toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
    return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function DashboardPage() {
    const nav = useNavigate()
    const { user } = useAuth()
    const data = useDashboardData()

    const [layout, setLayout] = useState(() => readLayout(user?.id))
    const [addOpen, setAddOpen] = useState(false)
    // Первый прогон эффекта сохранения (и каждый переход на другой аккаунт)
    // пропускаем: иначе гостевая/прошлая раскладка успела бы записаться в
    // localStorage нового пользователя до применения прочитанной.
    const skipSave = useRef(true)

    // Смена аккаунта — своя раскладка.
    useEffect(() => {
        skipSave.current = true
        setLayout(readLayout(user?.id))
    }, [user?.id])

    // Любое изменение раскладки сразу сохраняем.
    useEffect(() => {
        if (skipSave.current) {
            skipSave.current = false
            return
        }
        saveLayout(user?.id, layout)
    }, [layout, user?.id])

    const todayTasks = useMemo(() => {
        const day = (data.days || []).find(d => d.date === data.today)
        return day?.tasks || []
    }, [data.days, data.today])

    const widgetData = useMemo(
        () => ({ ...data, todayTasks }),
        [data, todayTasks],
    )

    const doneToday = data.statsDay?.done ?? 0
    const plannedToday = todayTasks.filter(
        t => !['DONE', 'CANCELLED', 'ARCHIVED'].includes(t.statusCategoryCode),
    ).length
    const leaves = data.shop?.leaves ?? 0

    const name = user?.profile?.displayName || user?.username || 'друг'

    const addWidget = (type) => {
        const meta = WIDGET_LIBRARY[type]
        if (!meta) return
        setLayout(prev => [
            ...prev,
            { id: uid(), type, size: meta.defaultSize || 'small' },
        ])
    }

    const removeWidget = (id) => {
        setLayout(prev => prev.filter(w => w.id !== id))
    }

    const moveWidget = (index, delta) => {
        setLayout(prev => {
            const next = [...prev]
            const target = index + delta
            if (target < 0 || target >= next.length) return prev
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    const resizeWidget = (id) => {
        setLayout(prev => prev.map(w => (
            w.id === id
                ? { ...w, size: w.size === 'wide' ? 'small' : 'wide' }
                : w
        )))
    }

    const resetLayout = () => setLayout(makeDefault())

    return (
        <div className="dashboard">
            <div className="dashboard__hero">
                <div className="dashboard__hero-main">
                    <div className="dashboard__date">{todayLabel()}</div>
                    <h1 className="dashboard__hello">
                        {greeting()}, {name}!
                    </h1>
                    <p className="dashboard__sub">
                        {doneToday > 0
                            ? `Сегодня уже закрыто ${doneToday}. Продолжай в том же духе.`
                            : 'Начни день с одной небольшой задачи — остальное подтянется.'}
                    </p>

                    <div className="dashboard__chips">
                        <span className="dashboard__chip">
                            ✅ <b>{doneToday}</b> сегодня
                        </span>
                        <span className="dashboard__chip">
                            📌 <b>{plannedToday}</b> в планах
                        </span>
                        <span className="dashboard__chip">
                            🍃 <b>{formatPrice(leaves)}</b> листьев
                        </span>
                    </div>
                </div>

                <div className="dashboard__hero-actions">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => nav('/calendar')}
                    >
                        📅 Календарь
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setAddOpen(true)}
                    >
                        ＋ Добавить виджет
                    </button>
                </div>
            </div>

            {data.error && <div className="error dashboard__error">{data.error}</div>}

            <div className="dashboard__grid">
                {layout.map((widget, index) => {
                    const meta = WIDGET_LIBRARY[widget.type]
                    const Component = WIDGET_COMPONENTS[widget.type]
                    if (!meta || !Component) return null

                    return (
                        <WidgetCard
                            key={widget.id}
                            meta={meta}
                            widget={widget}
                            index={index}
                            total={layout.length}
                            onMove={moveWidget}
                            onResize={resizeWidget}
                            onRemove={removeWidget}
                        >
                            <Component data={widgetData} userId={user?.id}/>
                        </WidgetCard>
                    )
                })}

                <button
                    type="button"
                    className="dw-add-tile"
                    onClick={() => setAddOpen(true)}
                >
                    <span className="dw-add-tile__plus" aria-hidden="true">＋</span>
                    <span className="dw-add-tile__title">Добавить виджет</span>
                    <span className="dw-add-tile__hint">
                        выполнено сегодня, планы, кооп, ачивки, статистика, магазин…
                    </span>
                </button>
            </div>

            <AddWidgetModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                layout={layout}
                onAdd={addWidget}
                onReset={resetLayout}
            />
        </div>
    )
}
