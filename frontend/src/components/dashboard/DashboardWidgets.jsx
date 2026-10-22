// frontend/src/components/dashboard/DashboardWidgets.jsx

/**
 * Набор виджетов стартовой страницы.
 *
 * Каждый виджет — самостоятельный компонент, который получает уже
 * загруженные данные (см. useDashboardData.js) и ничего не запрашивает сам.
 * Так один и тот же ответ /calendar используется и «Планами на сегодня»,
 * и «Кооп-доской», и «Неделей».
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { shopApi } from '../../api/api'
import { formatPrice, resolveUrl } from '../../utils/format'
import TreeThumb from '../shop/TreeThumb'

// ============================================================
// Метаданные библиотеки виджетов
// ============================================================

export const WIDGET_LIBRARY = {
    doneToday: {
        title: 'Выполнено сегодня',
        icon: '✅',
        description: 'Сколько задач закрыто за день и сколько осталось до взрослого дерева.',
        defaultSize: 'small',
    },
    todayPlan: {
        title: 'В планах сегодня',
        icon: '📌',
        description: 'Задачи на сегодня из календаря с переходом в проект.',
        defaultSize: 'wide',
    },
    coopBoard: {
        title: 'Групповая доска',
        icon: '👥',
        description: 'Задачи на сегодня в групповых проектах и общих досках.',
        defaultSize: 'small',
    },
    achievements: {
        title: 'Ачивки',
        icon: '🏆',
        description: 'Прогресс коллекции и последние полученные достижения.',
        defaultSize: 'small',
    },
    news: {
        title: 'Новости',
        icon: '📰',
        description: 'Подарок недели, новинки магазина и последние достижения в одном месте.',
        defaultSize: 'wide',
    },
    stats: {
        title: 'Статистика недели',
        icon: '📊',
        description: 'Создано, закрыто и просрочено за неделю + мини-график.',
        defaultSize: 'wide',
    },
    shopNew: {
        title: 'Магазин: новинки',
        icon: '🛍️',
        description: 'Свежие товары, баланс листьев и быстрый переход в магазин.',
        defaultSize: 'small',
    },
    week: {
        title: 'Неделя',
        icon: '🗓️',
        description: 'Семь дней вперёд: загрузка по задачам и переход в календарь.',
        defaultSize: 'wide',
    },
    boards: {
        title: 'Мои доски',
        icon: '📋',
        description: 'Быстрый доступ к доскам и количество задач в них.',
        defaultSize: 'wide',
    },
    quickLinks: {
        title: 'Быстрые ссылки',
        icon: '⚡',
        description: 'Календарь, статистика, магазин, профиль и помощь в одном месте.',
        defaultSize: 'small',
    },
    pomodoro: {
        title: 'Помодоро',
        icon: '🍅',
        description: 'Таймер 25/5 для работы без переключений.',
        defaultSize: 'small',
    },
    note: {
        title: 'Заметка',
        icon: '📝',
        description: 'Липкая заметка, которая сохраняется в браузере.',
        defaultSize: 'small',
    },
}

/** Приветствие по времени суток — используется шапкой дашборда. */
export function greeting(date = new Date()) {
    const hour = date.getHours()
    if (hour < 5) return 'Доброй ночи'
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
}

export const DEFAULT_LAYOUT = [
    { type: 'news', size: 'wide' },
    { type: 'todayPlan', size: 'wide' },
    { type: 'doneToday', size: 'small' },
    { type: 'coopBoard', size: 'small' },
    { type: 'achievements', size: 'small' },
    { type: 'shopNew', size: 'small' },
    { type: 'stats', size: 'wide' },
    { type: 'week', size: 'wide' },
    { type: 'note', size: 'small' },
]

// ============================================================
// Общие хелперы
// ============================================================

const CATEGORY_LABEL = {
    DONE: 'Выполнено',
    EXPIRED: 'Просрочено',
    CANCELLED: 'Отменено',
    FROZEN: 'Отложено',
    ARCHIVED: 'В архиве',
    ACTIVE: 'В работе',
}

const DAILY_TIER_LABEL = {
    none: 'Спокойный день',
    good: 'Хороший день',
    excellent: 'Отличный день',
    legendary: 'Легендарный день',
}

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function plural(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
}

function parseIso(iso) {
    if (!iso) return null
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
}

function isDone(task) {
    return task?.statusCategoryCode === 'DONE'
}

function isClosed(task) {
    return ['DONE', 'CANCELLED', 'ARCHIVED'].includes(task?.statusCategoryCode)
}

function tasksForToday(days, today) {
    const day = (days || []).find(d => d.date === today)
    return day?.tasks || []
}

function itemMeta(type) {
    return {
        avatars: { label: 'Аватарка', icon: '👤' },
        frames: { label: 'Рамка', icon: '🖼️' },
        treeSkins: { label: 'Дерево', icon: '🌳' },
        accents: { label: 'Акцент', icon: '🎨' },
    }[type] || { label: 'Товар', icon: '🛍️' }
}

function isNew(createdAt, days = 7) {
    if (!createdAt) return false
    const t = new Date(createdAt).getTime()
    return Number.isFinite(t) && (Date.now() - t) < days * 24 * 60 * 60 * 1000
}

function Empty({ icon = '🌿', text }) {
    return (
        <div className="dw-empty">
            <span className="dw-empty__icon" aria-hidden="true">{icon}</span>
            <span className="dw-empty__text">{text}</span>
        </div>
    )
}

function Progress({ value, max = 100 }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
    return (
        <div className="dw-progress">
            <span style={{ width: `${pct}%` }}/>
        </div>
    )
}

// ============================================================
// 1. Выполнено сегодня
// ============================================================

export function DoneTodayWidget({ data }) {
    const done = data.statsDay?.done ?? tasksForToday(data.days, data.today).filter(isDone).length
    const weekDone = data.statsWeek?.done ?? 0
    const active = data.statsDay?.active ?? 0
    const overdue = data.statsDay?.overdue ?? 0

    const goal = data.dailyGoal
    const target = goal?.target ?? 10
    const tierLabel = DAILY_TIER_LABEL[goal?.tier] || DAILY_TIER_LABEL.none
    const nextTierLabel = goal?.nextTier ? DAILY_TIER_LABEL[goal.nextTier] : null
    const nextRemaining = goal?.nextTierAt != null
        ? Math.max(0, goal.nextTierAt - done)
        : 0
    const toTree = Math.max(0, 10 - done)
    const pct = Math.min(100, (done / target) * 100)

    return (
        <div className="dw-done">
            <div
                className="dw-done__ring"
                style={{ '--dw-pct': `${pct * 3.6}deg` }}
            >
                <div className="dw-done__ring-inner">
                    <b>{done}</b>
                    <span>{plural(done, ['задача', 'задачи', 'задач'])}</span>
                </div>
            </div>

            <div className="dw-done__meta">
                <div className="dw-done__hint">
                    {goal
                        ? <><b>{tierLabel}</b> · {done} / {target}</>
                        : (toTree > 0
                            ? `Ещё ${toTree} ${plural(toTree, ['задача', 'задачи', 'задач'])} до взрослого дерева 🌳`
                            : 'Дерево взрослое — можно собрать листья 🍃')}
                </div>
                {goal && (
                    <div className="dw-done__hint">
                        {nextTierLabel
                            ? `Ещё ${nextRemaining} ${plural(nextRemaining, ['задача', 'задачи', 'задач'])} до «${nextTierLabel}»`
                            : 'Цель дня выполнена — легендарный день 🏆'}
                    </div>
                )}
                {goal?.canClaim && (
                    <div className="dw-done__hint">
                        🍃 Награда {goal.rewardLeaves} ждёт — кликни по дереву
                    </div>
                )}
                {goal?.claimed && (
                    <div className="dw-done__hint">
                        Награда за сегодня уже получена
                    </div>
                )}
                <div className="dw-done__week">
                    🔥 <b>{active}</b> в работе · 📅 <b>{weekDone}</b> за неделю
                </div>
                {overdue > 0 && (
                    <div className="dw-done__week" style={{ color: 'var(--danger)' }}>
                        ⚠️ <b>{overdue}</b> просрочено
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================
// 2. В планах сегодня
// ============================================================

export function TodayPlanWidget({ data }) {
    const nav = useNavigate()
    const tasks = tasksForToday(data.days, data.today)
        .filter(t => !isClosed(t))
        .sort((a, b) => Number(!!b.isOverdue) - Number(!!a.isOverdue))

    const openTask = (task) => {
        if (!task?.boardId || !task?.projectId) return
        nav(`/boards/${task.boardId}/projects/${task.projectId}`)
    }

    return (
        <div className="dw-plan">
            <div className="dw-plan__summary">
                <span>
                    <b>{tasks.length}</b> {plural(tasks.length, ['задача', 'задачи', 'задач'])} на сегодня
                </span>
                <button
                    type="button"
                    className="dw-link"
                    onClick={() => nav(`/calendar?date=${data.today}`)}
                >
                    Календарь →
                </button>
            </div>

            {tasks.length === 0 ? (
                <Empty icon="🎉" text="Свободный день. Можно заняться тем, что давно откладывал."/>
            ) : (
                <div className="dw-task-list">
                    {tasks.slice(0, 6).map(task => (
                        <button
                            key={task.id}
                            type="button"
                            className={`dw-task ${task.isOverdue ? 'dw-task--overdue' : ''}`}
                            onClick={() => openTask(task)}
                            title={task.title}
                        >
                            <span
                                className="dw-task__dot"
                                title={CATEGORY_LABEL[task.statusCategoryCode] || task.statusTitle || 'Задача'}
                            />
                            <span className="dw-task__title">{task.title}</span>
                            <span className="dw-task__project" title={task.projectTitle}>
                                {task.coop ? '🤝 ' : ''}{task.projectTitle}
                            </span>
                            {task.isOverdue && <span className="dw-task__overdue">просрочено</span>}
                        </button>
                    ))}
                </div>
            )}

            {tasks.length > 6 && (
                <button
                    type="button"
                    className="dw-link dw-more"
                    onClick={() => nav(`/calendar?date=${data.today}`)}
                >
                    Ещё {tasks.length - 6}…
                </button>
            )}
        </div>
    )
}

// ============================================================
// 3. Групповая доска
// ============================================================

export function CoopBoardWidget({ data }) {
    const nav = useNavigate()
    const coopTasks = tasksForToday(data.days, data.today).filter(t => t.coop && !isClosed(t))

    const byProject = useMemo(() => {
        const map = new Map()
        for (const task of coopTasks) {
            const key = `${task.boardId}:${task.projectId}`
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    boardId: task.boardId,
                    projectId: task.projectId,
                    title: task.projectTitle,
                    group: Boolean(task.group),
                    tasks: [],
                })
            }
            map.get(key).tasks.push(task)
        }
        return [...map.values()]
    }, [coopTasks])

    return (
        <div className="dw-coop">
            <div className="dw-coop__head">
                <span className="dw-coop__icon" aria-hidden="true">👥</span>
                <div>
                    <div className="dw-coop__count">{coopTasks.length}</div>
                    <div className="dw-coop__label">задач в групповых проектах сегодня</div>
                </div>
            </div>

            {byProject.length === 0 ? (
                <Empty icon="👥" text="Сегодня групповых задач нет."/>
            ) : (
                <div className="dw-coop__list">
                    {byProject.slice(0, 3).map(group => (
                        <button
                            key={group.key}
                            type="button"
                            className="dw-coop__task"
                            onClick={() => nav(group.group
                                ? `/group/${group.projectId}`
                                : `/boards/${group.boardId}/projects/${group.projectId}`)}
                        >
                            <span className="dw-coop__task-title" title={group.title}>
                                {group.title}
                            </span>
                            <span className="dw-coop__task-project">
                                {group.tasks.length} {plural(group.tasks.length, ['задача', 'задачи', 'задач'])}
                                {' · '}
                                {group.tasks.slice(0, 2).map(t => t.title).join(' · ')}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================
// 4. Ачивки
// ============================================================

export function AchievementsWidget({ data }) {
    const nav = useNavigate()
    const list = data.achievements || []
    const unlocked = list.filter(a => a.unlocked)
    const latest = [...unlocked]
        .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))
        .slice(0, 3)

    const pct = list.length > 0 ? Math.round((unlocked.length / list.length) * 100) : 0

    return (
        <div className="dw-ach">
            <div className="dw-ach__top">
                <div>
                    <div className="dw-ach__value">
                        {unlocked.length}<span>/{list.length}</span>
                    </div>
                    <div className="dw-ach__label">достижений открыто</div>
                </div>
                <span className="dw-ach__pct">{pct}%</span>
            </div>

            <Progress value={unlocked.length} max={list.length || 1}/>

            {latest.length === 0 ? (
                <Empty icon="🏆" text="Пока пусто. Закрой первую задачу — и начнётся коллекция."/>
            ) : (
                <div className="dw-ach__list">
                    {latest.map(a => (
                        <div key={a.code || a.id} className="dw-ach__item" title={a.description}>
                            <span className="dw-ach__icon">{a.icon || '🏆'}</span>
                            <span className="dw-ach__title">{a.title}</span>
                        </div>
                    ))}
                </div>
            )}

            <button type="button" className="dw-link" onClick={() => nav('/stats')}>
                Все достижения →
            </button>
        </div>
    )
}

// ============================================================
// 4b. Новости: подарок недели + свежее из магазина и коллекции
// ============================================================

const NEWS_NEW_DAYS = 7

export function NewsWidget({ data }) {
    const nav = useNavigate()
    const gift = data.weeklyGift
    const [claiming, setClaiming] = useState(false)
    const [claimError, setClaimError] = useState(null)

    const newShopItems = useMemo(() => {
        const shop = data.shop
        if (!shop) return 0
        const all = [
            ...(shop.avatars || []),
            ...(shop.frames || []),
            ...(shop.treeSkins || []),
            ...(shop.accents || []),
        ]
        return all.filter(item => isNew(item.createdAt, NEWS_NEW_DAYS)).length
    }, [data.shop])

    const latestAchievement = useMemo(() => {
        const unlocked = (data.achievements || []).filter(a => a.unlocked)
        return [...unlocked]
            .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))[0] || null
    }, [data.achievements])

    const giftEnabled = Boolean(gift?.configured && gift.enabled)
    const required = gift?.requiredTasks ?? 5
    const done = gift?.doneTasks ?? 0
    const left = Math.max(0, required - done)
    const pct = required > 0 ? Math.min(100, Math.round((done / required) * 100)) : 0

    const claimGift = async () => {
        if (claiming || !gift?.canClaim) return
        setClaiming(true)
        setClaimError(null)
        try {
            await shopApi.claimWeeklyGift()
            // Перезагружаем пакет дашборда: подарок, магазин и баланс листьев.
            await data.reload?.({ silent: true })
            window.dispatchEvent(new CustomEvent('shop:invalidate'))
        } catch (err) {
            setClaimError(err.response?.data?.message || 'Не удалось получить подарок')
        } finally {
            setClaiming(false)
        }
    }

    const giftArt = (() => {
        if (!gift) return null
        const src = resolveUrl(gift.imageUrl)
        if (src) {
            return <img className="dw-news__gift-img" src={src} alt="" loading="lazy"/>
        }
        if (gift.itemType === 'TREE' && gift.itemCode) {
            return <TreeThumb kind={gift.itemCode} size={56}/>
        }
        return <span className="dw-news__gift-emoji">{gift.emoji || '🎁'}</span>
    })()

    const hasNews = giftEnabled || newShopItems > 0 || Boolean(latestAchievement)

    return (
        <div className="dw-news">
            {giftEnabled && (
                <div className={`dw-news__gift dw-news__gift--${gift.state}`}>
                    <div className="dw-news__gift-art">{giftArt}</div>

                    <div className="dw-news__gift-body">
                        <div className="dw-news__eyebrow">🎁 Подарок недели</div>
                        <div className="dw-news__gift-title" title={gift.title}>{gift.title}</div>
                        <div className="dw-news__progress">
                            <span style={{ width: `${pct}%` }}/>
                        </div>
                        <div className="dw-news__progress-text">
                            {gift.state === 'claimed'
                                ? 'Подарок уже в коллекции'
                                : gift.canClaim
                                    ? 'Условие выполнено — забирай!'
                                    : `Закрыто ${Math.min(done, required)} из ${required} задач`}
                        </div>
                    </div>

                    <div className="dw-news__gift-action">
                        {gift.state === 'claimed' ? (
                            <span className="dw-news__claimed">✓ Получено</span>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary dw-news__claim"
                                onClick={claimGift}
                                disabled={!gift.canClaim || claiming}
                            >
                                {claiming
                                    ? '…'
                                    : gift.canClaim
                                        ? 'Забрать'
                                        : `Ещё ${left} ${plural(left, ['задача', 'задачи', 'задач'])}`}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {claimError && <div className="dw-news__error">{claimError}</div>}

            <div className="dw-news__list">
                {newShopItems > 0 && (
                    <button
                        type="button"
                        className="dw-news__item"
                        onClick={() => nav('/shop')}
                    >
                        <span className="dw-news__icon" aria-hidden="true">🛍️</span>
                        <span className="dw-news__body">
                            <span className="dw-news__title">
                                В магазине {newShopItems} {plural(newShopItems, ['новинка', 'новинки', 'новинок'])}
                            </span>
                            <span className="dw-news__text">Свежие предметы за последние 7 дней</span>
                        </span>
                        <span className="dw-news__arrow" aria-hidden="true">→</span>
                    </button>
                )}

                {latestAchievement && (
                    <button
                        type="button"
                        className="dw-news__item"
                        onClick={() => nav('/stats')}
                    >
                        <span className="dw-news__icon" aria-hidden="true">
                            {latestAchievement.icon || '🏆'}
                        </span>
                        <span className="dw-news__body">
                            <span className="dw-news__title">
                                Открыто достижение «{latestAchievement.title}»
                            </span>
                            <span className="dw-news__text">
                                {(data.achievements || []).filter(a => a.unlocked).length} из{' '}
                                {(data.achievements || []).length} в коллекции
                            </span>
                        </span>
                        <span className="dw-news__arrow" aria-hidden="true">→</span>
                    </button>
                )}

                {!hasNews && (
                    <Empty
                        icon="📰"
                        text="Пока тихо: новых подарков и достижений нет. Загляни позже."
                    />
                )}
            </div>

            <button type="button" className="dw-link" onClick={() => nav('/shop')}>
                Все новости магазина →
            </button>
        </div>
    )
}

// ============================================================
// 5. Статистика недели
// ============================================================

export function StatsWidget({ data }) {
    const nav = useNavigate()
    const week = data.statsWeek
    const daily = week?.daily || []

    const maxDone = Math.max(1, ...daily.map(d => d.done || 0))
    const lastDays = daily.slice(-7)

    return (
        <div className="dw-stats">
            <div className="dw-stats__cards">
                <div className="dw-stat">
                    <span className="dw-stat__label">Всего</span>
                    <span className="dw-stat__value">{week?.total ?? 0}</span>
                </div>
                <div className="dw-stat dw-stat--done">
                    <span className="dw-stat__label">Закрыто</span>
                    <span className="dw-stat__value">{week?.done ?? 0}</span>
                </div>
                <div className="dw-stat">
                    <span className="dw-stat__label">В работе</span>
                    <span className="dw-stat__value">{week?.active ?? 0}</span>
                </div>
                <div className="dw-stat dw-stat--overdue">
                    <span className="dw-stat__label">Просрочено</span>
                    <span className="dw-stat__value">{week?.overdue ?? 0}</span>
                </div>
            </div>

            {lastDays.length > 0 ? (
                <div className="dw-chart" role="img" aria-label="Закрытые задачи по дням недели">
                    {lastDays.map(day => {
                        const date = parseIso(day.date)
                        const height = Math.max(6, Math.round(((day.done || 0) / maxDone) * 100))
                        return (
                            <div key={day.date} className="dw-chart__col" title={`${day.date}: ${day.done} закрыто`}>
                                <span className="dw-chart__bar" style={{ height: `${height}%` }}/>
                                <span className="dw-chart__day">
                                    {date ? WEEKDAY_SHORT[date.getDay()] : ''}
                                </span>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <Empty icon="📊" text="Статистика появится, когда будут задачи."/>
            )}

            <button type="button" className="dw-link" onClick={() => nav('/stats')}>
                Подробная статистика →
            </button>
        </div>
    )
}

// ============================================================
// 6. Магазин: новинки
// ============================================================

export function ShopNewWidget({ data }) {
    const nav = useNavigate()
    const shop = data.shop

    const items = useMemo(() => {
        if (!shop) return []
        const groups = [
            ['avatars', shop.avatars],
            ['frames', shop.frames],
            ['treeSkins', shop.treeSkins],
            ['accents', shop.accents],
        ]
        const all = []
        for (const [type, list] of groups) {
            for (const item of list || []) {
                all.push({ ...item, __type: type })
            }
        }
        return all
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5)
    }, [shop])

    return (
        <div className="dw-shop">
            <div className="dw-shop__balance">
                <span className="dw-shop__leaves">🍃 {formatPrice(shop?.leaves ?? 0)}</span>
                <span className="dw-shop__balance-label">листьев на балансе</span>
            </div>

            {items.length === 0 ? (
                <Empty icon="🛍️" text="Магазин пока пуст."/>
            ) : (
                <div className="dw-shop__list">
                    {items.map(item => {
                        const meta = itemMeta(item.__type)
                        const src = resolveUrl(item.imageUrl)
                        return (
                            <div key={`${item.__type}-${item.id}`} className="dw-shop__item">
                                {src ? (
                                    <img className="dw-shop__img" src={src} alt="" loading="lazy"/>
                                ) : item.hexColor ? (
                                    <span
                                        className="dw-shop__color"
                                        style={{
                                            background: item.isGradient && item.hexColorSecondary
                                                ? `linear-gradient(120deg, ${item.hexColor} 0%, ${item.hexColorSecondary} 100%)`
                                                : item.hexColor,
                                        }}
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <span className="dw-shop__emoji" aria-hidden="true">{meta.icon}</span>
                                )}
                                <div className="dw-shop__info">
                                    <span className="dw-shop__title" title={item.title}>{item.title}</span>
                                    <span className="dw-shop__type">
                                        {meta.label}
                                        {isNew(item.createdAt) && ' · новинка'}
                                    </span>
                                </div>
                                <span className="dw-shop__price">
                                    {item.owned ? '✓ есть' : item.price ? `🍃 ${formatPrice(item.price)}` : 'бесплатно'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            <button type="button" className="dw-link" onClick={() => nav('/shop')}>
                В магазин →
            </button>
        </div>
    )
}

// ============================================================
// 7. Неделя
// ============================================================

export function WeekWidget({ data }) {
    const nav = useNavigate()
    const days = data.days || []

    return (
        <div className="dw-week">
            <div className="dw-week__grid">
                {days.slice(0, 7).map(day => {
                    const date = parseIso(day.date)
                    const total = day.tasks?.length || 0
                    const done = (day.tasks || []).filter(isDone).length
                    const isToday = day.date === data.today
                    return (
                        <button
                            key={day.date}
                            type="button"
                            className={`dw-week__day ${isToday ? 'dw-week__day--today' : ''}`}
                            onClick={() => nav(`/calendar?date=${day.date}`)}
                            title={`${day.date}: ${total} задач`}
                        >
                            <span className="dw-week__weekday">
                                {date ? WEEKDAY_SHORT[date.getDay()] : ''}
                            </span>
                            <span className="dw-week__num">
                                {date ? date.getDate() : '—'}
                            </span>
                            <span className="dw-week__count">{total > 0 ? total : '·'}</span>
                            <span className="dw-week__done">{done > 0 ? `✓${done}` : ''}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================================
// 8. Мои доски
// ============================================================

export function BoardsWidget({ data }) {
    const nav = useNavigate()
    const boards = data.boards || []

    if (boards.length === 0) {
        return <Empty icon="📋" text="Досок пока нет. Создай первую на странице «Доски»."/>
    }

    return (
        <div className="dw-boards">
            <div className="dw-boards__list">
                {boards.slice(0, 6).map(board => (
                    <button
                        key={board.id}
                        type="button"
                        className="dw-board"
                        onClick={() => nav(`/boards/${board.id}`)}
                        title={board.title}
                    >
                        <span className="dw-board__dot" style={{ background: `var(--accent-${board.accentCode || 'blue'})` }}/>
                        <span className="dw-board__title">{board.title}</span>
                        <span className="dw-board__meta">
                            {board.taskCount || 0} {plural(board.taskCount || 0, ['задача', 'задачи', 'задач'])}
                        </span>
                    </button>
                ))}
            </div>
            <button type="button" className="dw-link" onClick={() => nav('/boards')}>
                Все доски →
            </button>
        </div>
    )
}

// ============================================================
// 9. Быстрые ссылки
// ============================================================

const QUICK_LINKS = [
    { to: '/calendar', icon: '📅', label: 'Календарь' },
    { to: '/stats', icon: '📊', label: 'Статистика' },
    { to: '/shop', icon: '🛍️', label: 'Магазин' },
    { to: '/profile', icon: '👤', label: 'Профиль' },
    { to: '/boards', icon: '📋', label: 'Доски' },
    { to: '/help', icon: '❓', label: 'Помощь' },
]

export function QuickLinksWidget() {
    const nav = useNavigate()
    return (
        <div className="dw-links">
            {QUICK_LINKS.map(link => (
                <button
                    key={link.to}
                    type="button"
                    className="dw-link-tile"
                    onClick={() => nav(link.to)}
                >
                    <span className="dw-link-tile__icon" aria-hidden="true">{link.icon}</span>
                    <span>{link.label}</span>
                </button>
            ))}
        </div>
    )
}

// ============================================================
// 10. Помодоро
// ============================================================

const POMODORO_WORK = 25 * 60
const POMODORO_BREAK = 5 * 60

export function PomodoroWidget() {
    const [mode, setMode] = useState('work')
    const [left, setLeft] = useState(POMODORO_WORK)
    const [running, setRunning] = useState(false)

    useEffect(() => {
        if (!running) return
        const id = setInterval(() => {
            setLeft(prev => {
                if (prev <= 1) {
                    setRunning(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(id)
    }, [running])

    const switchMode = (next) => {
        setMode(next)
        setRunning(false)
        setLeft(next === 'work' ? POMODORO_WORK : POMODORO_BREAK)
    }

    const total = mode === 'work' ? POMODORO_WORK : POMODORO_BREAK
    const mm = String(Math.floor(left / 60)).padStart(2, '0')
    const ss = String(left % 60).padStart(2, '0')
    const pct = Math.round(((total - left) / total) * 100)

    return (
        <div className={`dw-pomo ${mode === 'break' ? 'dw-pomo--break' : ''}`}>
            <div className="dw-pomo__modes">
                <button
                    type="button"
                    className={`dw-pomo__mode ${mode === 'work' ? 'dw-pomo__mode--active' : ''}`}
                    onClick={() => switchMode('work')}
                >Работа</button>
                <button
                    type="button"
                    className={`dw-pomo__mode ${mode === 'break' ? 'dw-pomo__mode--active' : ''}`}
                    onClick={() => switchMode('break')}
                >Перерыв</button>
            </div>

            <div className="dw-pomo__timer" style={{ '--dw-pct': `${pct * 3.6}deg` }}>
                <div className="dw-pomo__timer-inner">
                    <span className="dw-pomo__time">{mm}:{ss}</span>
                    <span className="dw-pomo__caption">
                        {left === 0 ? 'Готово!' : running ? 'идёт' : 'пауза'}
                    </span>
                </div>
            </div>

            <div className="dw-pomo__actions">
                <button type="button" className="btn btn-primary" onClick={() => setRunning(v => !v)}>
                    {running ? 'Пауза' : left === 0 ? 'Заново' : 'Старт'}
                </button>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setRunning(false); setLeft(total) }}
                >Сброс</button>
            </div>
        </div>
    )
}

// ============================================================
// 11. Заметка
// ============================================================

export function NoteWidget() {
    const { user } = useAuth()
    const key = `taskboard:dashboard:note:${user?.id ?? 'guest'}`
    const [value, setValue] = useState(() => {
        try { return localStorage.getItem(key) || '' } catch { return '' }
    })

    useEffect(() => {
        try {
            if (value) localStorage.setItem(key, value)
            else localStorage.removeItem(key)
        } catch { /* localStorage может быть недоступен */ }
    }, [key, value])

    return (
        <div className="dw-note">
            <textarea
                className="dw-note__input"
                placeholder="Мысль, ссылка или план на день…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={5}
                maxLength={2000}
            />
            <div className="dw-note__foot">
                <span>Сохраняется автоматически в этом браузере</span>
                <span>{value.length}/2000</span>
            </div>
        </div>
    )
}

// ============================================================
// Реестр: тип → компонент
// ============================================================

export const WIDGET_COMPONENTS = {
    doneToday: DoneTodayWidget,
    todayPlan: TodayPlanWidget,
    coopBoard: CoopBoardWidget,
    achievements: AchievementsWidget,
    news: NewsWidget,
    stats: StatsWidget,
    shopNew: ShopNewWidget,
    week: WeekWidget,
    boards: BoardsWidget,
    quickLinks: QuickLinksWidget,
    pomodoro: PomodoroWidget,
    note: NoteWidget,
}
