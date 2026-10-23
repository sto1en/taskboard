import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import store from './store/store'
import { StoreProvider } from './store/StoreContext'
import { useUiStore } from './store/useUiStore'
import MobileTopBar from './components/layout/MobileTopBar'
import MobileDrawer from './components/layout/MobileDrawer'
import MobileNav from './components/layout/MobileNav'
import TaskCard from './components/task/TaskCard'

// ============================================================
// Песочница мобильной вёрстки (mobile-preview.html).
//
// Десктопные страницы тянут API и требуют токен, поэтому в песочнице
// рисуются те же компоненты, что и в приложении, но на статичных данных:
//   ?screen=boards   — сетка досок (BoardsPage — cards вручную)
//   ?screen=kanban   — канбан-колонки с TaskCard (главный сценарий)
//   ?screen=modal    — карточка задачи как нижняя шторка
//   ?screen=menu     — нижний лист «ещё» (настройки, помощь, выход)
//   ?screen=drawer   — выезжающий сайдбар слева//   ?screen=dashboard — дашборд (hero + виджеты)
//   ?screen=login    — экран входа
//
// Смысл не в пиксель-в-пиксель копии страниц, а в проверке каркаса
// (шапка, таб-бар, безопасные зоны), канбана-карусели, шторки и меню —
// это то, что mobile.css меняет.
// ============================================================

import './styles/index.css'
import './styles/login.css'
import './styles/auth.css'
import './styles/register.css'
import './styles/layout.css'
import './styles/boards.css'
import './styles/board-detail.css'
import './styles/board-toolbar.css'
import './styles/board-settings.css'
import './styles/calendar.css'
import './styles/stats.css'
import './styles/achievements.css'
import './styles/tasks-list.css'
import './styles/modal.css'
import './styles/projects.css'
import './styles/views.css'
import './styles/profile.css'
import './styles/info-page.css'
import './styles/hotkeys.css'
import './styles/search.css'
import './styles/shop.css'
import './styles/dashboard.css'
import './styles/recurrence.css'
import './styles/create-task.css'
import './styles/admin.css'
import './styles/group.css'
import './styles/leaderboard.css'
import './styles/user-groups.css'
import './styles/templates.css'
import './styles/mobile.css'

const params = new URLSearchParams(window.location.search)
const SCREEN = params.get('screen') || 'kanban'

const TASKS = {
    todo: [
        { id: 1, title: 'Сверстать мобильный канбан со снапом колонок', priority: 2, deadline: '2026-10-25' },
        { id: 2, title: 'Проверить шапку и нижний таб-бар на iPhone SE', priority: 1 },
        { id: 3, title: 'Добавить safe-area для жестовой полоски' },
    ],
    doing: [
        { id: 4, title: 'Нижняя шторка для детали задачи', priority: 3, deadline: '2026-10-24' },
        { id: 5, title: 'Поиск в один тап из шапки', priority: 1 },
    ],
    done: [
        { id: 6, title: 'Скрыть десктопный сайдбар на узких экранах' },
    ],
}

const COLUMNS = [
    { statusId: 1, title: 'К выполнению', accentCode: 'blue', count: TASKS.todo.length, tasks: TASKS.todo },
    { statusId: 2, title: 'В работе', accentCode: 'orange', count: TASKS.doing.length, tasks: TASKS.doing },
    { statusId: 3, title: 'Готово', accentCode: 'green', count: TASKS.done.length, tasks: TASKS.done },
]

function PageHead({ title, sub }) {
    return (
        <div className="board-detail__head">
            <button className="btn btn-ghost board-detail__back">↑ К доске</button>
            <div className="board-detail__title-wrap">
                <div className="board-detail__title-row">
                    <div className="board-detail__title board-detail__title-text">{title}</div>
                </div>
                <span className="board-detail__subtitle">{sub}</span>
            </div>
            <div className="board-detail__toolbar">
                <button className="btn btn-primary board-detail__new-task">+ Задача</button>
                <div className="view-switcher">
                    <div className="view-switcher__segmented">
                        <button className="view-switcher__option view-switcher__option--active" aria-label="Канбан">▦</button>
                        <button className="view-switcher__option" aria-label="Список">☰</button>
                        <button className="view-switcher__option" aria-label="Календарь">📅</button>
                    </div>
                </div>
                <button className="reorder-btn" title="Перестановка"><span className="reorder-btn__icon">↔</span></button>
            </div>
        </div>
    )
}

function KanbanScreen() {
    return (
        <>
            <PageHead title="Мобильная версия" sub="Проект · 3 колонки, 6 задач" />
            <div className="board-detail__scroll board-detail__scroll--kanban">
                <div className="kanban">
                    {COLUMNS.map((col) => (
                        <div
                            className="kanban-col"
                            key={col.statusId}
                            style={{ '--accent': `var(--accent-${col.accentCode})` }}
                        >
                            <div className="kanban-col__head" style={{ borderBottomColor: `var(--accent-${col.accentCode})` }}>
                                <div className="kanban-col__title-wrap">
                                    <div className="kanban-col__title">{col.title}</div>
                                </div>
                                <span className="kanban-col__count">{col.count}</span>
                                <button className="kanban-col__add-top" aria-label="Добавить задачу">+</button>
                            </div>
                            <div className="kanban-col__body">
                                {col.tasks.map((task) => (
                                    <TaskCard key={task.id} task={task} onOpenTask={() => {}} />
                                ))}
                                {col.tasks.length === 0 && (
                                    <button className="kanban-col__empty-add"><span>＋</span> Добавить задачу</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

function BoardsScreen() {
    const cards = [
        { title: 'Личные проекты', letter: 'Л', color: 'blue', meta: '4 проекта · 18 задач' },
        { title: 'Учётная практика', letter: 'У', color: 'orange', meta: '2 проекта · 7 задач' },
        { title: 'Групповая доска', letter: '👥', color: 'teal', meta: '5 участников' },
    ]
    return (
        <div className="boards">
            <div className="boards__hero">
                <div>
                    <h1 className="boards__hero-title">Мои доски</h1>
                    <p className="boards__hero-sub">Всё, что вы ведёте: личные, учебные и групповые доски</p>
                </div>
                <button className="btn btn-primary">+ Новая доска</button>
            </div>
            <div className="boards__grid">
                {cards.map((c) => (
                    <button className="board-card" key={c.title}>
                        <div className={`board-card__cover board-card__cover--${c.color}`}>
                            <div className="board-card__cover-letter">{c.letter}</div>
                        </div>
                        <div className="board-card__body">
                            <div className="board-card__title">{c.title}</div>
                            <div className="board-card__meta">
                                <span className="board-card__meta-item">{c.meta}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

function DashboardScreen() {
    return (
        <div className="dashboard">
            <div className="dashboard__hero">
                <div className="dashboard__hero-main">
                    <div className="dashboard__date">пятница, 23 октября</div>
                    <h1 className="dashboard__hello">Доброе утро, Илья!</h1>
                    <p className="dashboard__sub">Сегодня отличный день, чтобы закрыть пару задач.</p>
                    <div className="dashboard__chips">
                        <span className="dashboard__chip">✅ Сегодня выполнено: <b>3</b></span>
                        <span className="dashboard__chip">📌 В планах: <b>5</b></span>
                    </div>
                </div>
                <div className="dashboard__hero-actions">
                    <button className="btn btn-ghost">Архив</button>
                    <button className="btn btn-ghost">Настроить</button>
                </div>
            </div>
            <div className="dashboard__grid">
                <section className="dw-card dw-card--small">
                    <header className="dw-card__head">
                        <div className="dw-card__title"><span className="dw-card__icon">✅</span><span>Выполнено сегодня</span></div>
                    </header>
                    <div className="dw-card__body">3 из 5 до цели</div>
                </section>
                <section className="dw-card dw-card--wide">
                    <header className="dw-card__head">
                        <div className="dw-card__title"><span className="dw-card__icon">📌</span><span>В планах сегодня</span></div>
                    </header>
                    <div className="dw-card__body">Сверстать мобильный канбан…</div>
                </section>
            </div>
        </div>
    )
}

function ModalScreen() {
    return (
        <>
            <PageHead title="Мобильная версия" sub="Шторка детали задачи" />
            <div className="board-detail__scroll board-detail__scroll--kanban">
                <div className="kanban">
                    {COLUMNS.slice(0, 1).map((col) => (
                        <div className="kanban-col" key={col.statusId} style={{ '--accent': 'var(--accent-blue)' }}>
                            <div className="kanban-col__head"><div className="kanban-col__title">{col.title}</div></div>
                            <div className="kanban-col__body">
                                {col.tasks.map((task) => <TaskCard key={task.id} task={task} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="modal-overlay">
                <div className="modal task-detail-modal">
                    <div className="modal__head">
                        <h3 className="modal__title">Задача</h3>
                        <button className="modal__close">×</button>
                    </div>
                    <div className="modal__body">
                        <div className="task-detail-tabs">
                            <button className="task-detail-tab task-detail-tab--active">Детали</button>
                            <button className="task-detail-tab">Чат</button>
                            <button className="task-detail-tab">История</button>
                        </div>
                        <div className="task-detail" style={{ paddingTop: 12 }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Сверстать мобильный канбан</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                Колонки ездят по горизонтали со снапом, шторка снизу,
                                таб-бар с safe-area.
                            </p>
                        </div>
                    </div>
                    <div className="modal__foot">
                        <button className="btn btn-icon btn-icon--danger">🗑</button>
                        <div className="modal__foot-spacer" />
                        <button className="btn btn-ghost">Закрыть</button>
                        <button className="btn btn-primary">Сохранить</button>
                    </div>
                </div>
            </div>
        </>
    )
}

function LoginScreen() {
    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__logo">TaskBoard</h1>
                <p className="auth__subtitle">Войдите в рабочий аккаунт</p>
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="auth__field">
                        <label className="auth__label">Логин</label>
                        <input className="input" placeholder="andrew" />
                    </div>
                    <div className="auth__field">
                        <label className="auth__label">Пароль</label>
                        <input className="input" type="password" placeholder="••••••••" />
                    </div>
                    <button className="btn btn-primary" type="submit">Войти</button>
                </form>
            </div>
        </div>
    )
}

const Shell = observer(function Shell() {
    const ui = useUiStore()

    // Панель открыта по умолчанию для screen=drawer (сайдбар) и
    // screen=menu (нижний лист «ещё») — иначе пришлось бы «нажимать» её
    // в headless-браузере.
    useEffect(() => {
        if (SCREEN === 'menu' || SCREEN === 'drawer') ui.openMobileMenu()
        return () => ui.closeMobileMenu()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    let body = null
    if (SCREEN === 'boards') body = <BoardsScreen />
    else if (SCREEN === 'dashboard') body = <DashboardScreen />
    else if (SCREEN === 'modal') body = <ModalScreen />
    else if (SCREEN === 'menu' || SCREEN === 'drawer') body = <KanbanScreen />
    else if (SCREEN === 'login') return <LoginScreen />
    else body = <KanbanScreen />

    // В песочнице нет десктопного Sidebar (он тянет закрепы и дерево из
    // API). На широком экране показываем его заглушку — чтобы можно было
    // убедиться, что мобильная панель на десктопе не появляется.
    return (
        <div className="layout">
            <aside className="sidebar" aria-hidden="true">
                <div className="sidebar__user">
                    <div className="sidebar__user-avatar" />
                    <div className="sidebar__user-meta">
                        <div className="sidebar__name">andrew</div>
                    </div>
                </div>
            </aside>
            <div className="layout__main">
                <MobileTopBar />
                <MobileDrawer />
                <div className="layout__content">{body}</div>
            </div>
            <MobileNav />
        </div>
    )
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <StoreProvider>
                <BrowserRouter>
                    <div data-accent="blue">
                        <Shell />
                    </div>
                </BrowserRouter>
            </StoreProvider>
        </Provider>
    </StrictMode>,
)
