import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useAuth } from '../../context/AuthContext'
import { useUiStore } from '../../store/useUiStore'
import useT from '../../hooks/useT'
import { useIsMobile } from '../../hooks/useMediaQuery'
import ConfirmModal from '../common/ConfirmModal'

/**
 * Мобильный TopBar + выдвижное меню.
 *
 * Задач у шапки на телефоне три:
 *   1) открыть сайдбар (☰ слева) — весь состав десктопного Sidebar;
 *   2) сказать, где пользователь (заголовок и «назад»);
 *   3) дать быстрый поиск в один тап (поле разворачивается на всю ширину).
 *
 * Гамбургер стоит слева, как в нативных приложениях: панель выезжает
 * именно с этой стороны. Сам сайдбар — MobileDrawer, здесь только кнопка
 * и нижний лист «ещё» (настройки, помощь, выход).
 */

const MENU_LINKS = {
    // Основные разделы (доски, календарь, магазин, профиль и т. д.) живут
    // в выезжающем сайдбаре (MobileDrawer, кнопка ☰). В нижнем листе —
    // только служебное, чтобы не дублировать сайдбар.
    extra: [],
    bottom: [
        { to: '/settings', icon: '⚙', labelKey: 'settings' },
        { to: '/help', icon: '❓', labelKey: 'help' },
    ],
}

/** Заголовок шапки: контекст важнее пути — на телефоне имя доски и проекта
 *  пользователю полезнее, чем «Главная» и «Boards». */
function headerTitleFor(path, t) {
    if (path === '/') return t.dashboard || 'Главная'
    if (path.startsWith('/boards/')) return t.project || t.boards || 'Доски'
    if (path.startsWith('/boards')) return t.boards || 'Доски'
    if (path.startsWith('/calendar')) return t.calendar || 'Календарь'
    if (path.startsWith('/stats')) return t.stats || 'Статистика'
    if (path.startsWith('/leaderboard')) return 'Лидерборд'
    if (path.startsWith('/shop')) return 'Магазин'
    if (path.startsWith('/templates')) return t.templates || 'Шаблоны'
    if (path.startsWith('/guides')) return 'Гайды'
    if (path.startsWith('/group')) return 'Группы'
    if (path.startsWith('/profile') || path.startsWith('/users')) return 'Профиль'
    if (path.startsWith('/settings')) return t.settings || 'Настройки'
    if (path.startsWith('/help')) return t.help || 'Помощь'
    if (path.startsWith('/search')) return t.search || 'Поиск'
    if (path.startsWith('/admin')) return 'Админка'
    return 'TaskBoard'
}

export default observer(function MobileTopBar() {
    const t = useT()
    const nav = useNavigate()
    const location = useLocation()
    const ui = useUiStore()
    const { user, logout } = useAuth()
    const isMobile = useIsMobile()

    const title = headerTitleFor(location.pathname, t)
    const menuOpen = ui.mobileMenuOpen
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [showLogout, setShowLogout] = useState(false)
    const inputRef = useRef(null)
    // Открыт ли сейчас поиск — нужен вне замыкания эффекта: эффект
    // размонтирования не знает о последнем рендере.
    const searchOpenRef = useRef(false)
    searchOpenRef.current = searchOpen

    useEffect(() => {
        if (!searchOpen) return undefined
        window.history.pushState({ mobileSearch: true }, '')
        const onPop = () => setSearchOpen(false)
        window.addEventListener('popstate', onPop)
        return () => {
            window.removeEventListener('popstate', onPop)
            // Ушли со страницы, не закрыв поиск (открыли задачу из
            // результата): искусственная запись истории должна исчезнуть,
            // иначе «назад» вернёт пустую страницу.
            if (searchOpenRef.current && window.history.state?.mobileSearch) {
                window.history.back()
            }
        }
    }, [searchOpen])

    useEffect(() => {
        if (!searchOpen) return
        // Фокус — после кадра, иначе iOS не ставит курсор в только что
        // отрисованное поле и клавиатура не поднимается.
        const id = requestAnimationFrame(() => inputRef.current?.focus())
        return () => cancelAnimationFrame(id)
    }, [searchOpen])

    // Закрытие поиска снимает и «пустую» запись истории — иначе кнопка
    // «назад» после закрытия возвращала бы поиск снова.
    const closeSearch = () => {
        setSearchOpen(false)
        setQuery('')
        if (window.history.state?.mobileSearch) window.history.back()
    }

    const submitSearch = (e) => {
        e.preventDefault()
        const q = query.trim()
        if (!q) return
        // Маршрут — после снятия искусственной записи: иначе «назад» с
        // результатов поиска вернул бы пустую запись, а не страницу.
        const hadHistoryEntry = Boolean(window.history.state?.mobileSearch)
        setSearchOpen(false)
        setQuery('')
        nav(`/search?q=${encodeURIComponent(q)}`)
        if (hadHistoryEntry) window.history.replaceState({}, '')
    }

    const go = (to) => {
        ui.closeMobileMenu()
        nav(to)
    }

    const openMenu = () => {
        // Поиск в шапке — временное состояние: при открытии сайдбара его
        // закрываем, иначе он «останется» в шапке под затемнением.
        if (searchOpen) {
            setSearchOpen(false)
            setQuery('')
        }
        ui.openMobileMenu()
    }

    const isRoot = ['/', '/boards', '/calendar', '/shop', '/profile', '/stats',
        '/leaderboard', '/templates', '/guides', '/group', '/settings', '/help']
        .includes(location.pathname)

    // «Назад»: на корневых экранах кнопки нет — там идёт таб-бар, и
    // кнопка в никуда только путает.
    const goBack = () => {
        if (window.history.length > 1) nav(-1)
        else nav('/')
    }

    // Десктоп не должен получать ни шапку, ни выдвижное меню в DOM.
    if (!isMobile) return null

    return (
        <>
            <header className={`mobile-topbar mobile-topbar--phone ${searchOpen ? 'mobile-topbar--search' : ''}`}>
                {searchOpen ? (
                    <form className="mobile-topbar__search-row" onSubmit={submitSearch}>
                        <button
                            type="button"
                            className="mobile-icon-btn"
                            onClick={closeSearch}
                            aria-label="Закрыть поиск"
                        >
                            ←
                        </button>
                        <input
                            ref={inputRef}
                            className="mobile-topbar__search"
                            type="search"
                            inputMode="search"
                            enterKeyHint="search"
                            placeholder={t.searchPlaceholder || 'Поиск…'}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </form>
                ) : (
                    <>
                        <button
                            type="button"
                            className="mobile-icon-btn mobile-topbar__menu"
                            onClick={openMenu}
                            aria-label="Меню"
                            aria-expanded={menuOpen}
                        >
                            ☰
                        </button>
                        {/* «Назад» — только когда он есть: на корневых экранах
                            идёт таб-бар, и кнопка в никуда только путает. */}
                        {!isRoot && (
                            <button
                                type="button"
                                className="mobile-icon-btn mobile-topbar__back"
                                onClick={goBack}
                                aria-label="Назад"
                            >
                                ←
                            </button>
                        )}
                        <div className="mobile-topbar__title">{title}</div>

                        <button
                            type="button"
                            className="mobile-icon-btn"
                            onClick={() => setSearchOpen(true)}
                            aria-label={t.search || 'Поиск'}
                        >
                            🔍
                        </button>
                    </>
                )}
            </header>

            {/* Нижний лист «ещё»: только служебные пункты. Всё основное —
                в выезжающем сайдбаре слева (MobileDrawer). */}
            {menuOpen && (
                <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Ещё">
                    <button
                        type="button"
                        className="mobile-menu__scrim"
                        onClick={() => ui.closeMobileMenu()}
                        aria-label="Закрыть меню"
                    />
                    <div className="mobile-menu__sheet">
                        <div className="mobile-menu__grip" aria-hidden="true" />
                        <div className="mobile-menu__user">
                            <div className="mobile-menu__name">{user?.displayName || user?.username}</div>
                            <div className="mobile-menu__role">
                                {user?.isAdmin ? 'Администратор' : 'Участник'}
                            </div>
                        </div>

                        <div className="mobile-menu__section">
                            {MENU_LINKS.extra.map((item) => (
                                <button
                                    key={item.to}
                                    type="button"
                                    className="mobile-menu__row"
                                    onClick={() => go(item.to)}
                                >
                                    <span className="mobile-menu__row-icon" aria-hidden="true">{item.icon}</span>
                                    <span>{item.label || t[item.labelKey] || item.labelKey}</span>
                                    <span className="mobile-menu__row-chevron" aria-hidden="true">›</span>
                                </button>
                            ))}
                            {user?.isAdmin && (
                                <button
                                    type="button"
                                    className="mobile-menu__row"
                                    onClick={() => go('/admin/shop')}
                                >
                                    <span className="mobile-menu__row-icon" aria-hidden="true">🛠</span>
                                    <span>Админка магазина</span>
                                    <span className="mobile-menu__row-chevron" aria-hidden="true">›</span>
                                </button>
                            )}
                        </div>

                        <div className="mobile-menu__section">
                            {MENU_LINKS.bottom.map((item) => (
                                <button
                                    key={item.to}
                                    type="button"
                                    className="mobile-menu__row"
                                    onClick={() => go(item.to)}
                                >
                                    <span className="mobile-menu__row-icon" aria-hidden="true">{item.icon}</span>
                                    <span>{t[item.labelKey] || item.labelKey}</span>
                                    <span className="mobile-menu__row-chevron" aria-hidden="true">›</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                className="mobile-menu__row mobile-menu__row--danger"
                                onClick={() => setShowLogout(true)}
                            >
                                <span className="mobile-menu__row-icon" aria-hidden="true">⎋</span>
                                <span>{t.logout || 'Выйти'}</span>
                            </button>
                        </div>

                        <Link to="/profile" className="mobile-menu__profile" onClick={() => ui.closeMobileMenu()}>
                            Открыть профиль →
                        </Link>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={showLogout}
                title={t.confirmLogoutTitle}
                text={t.confirmLogoutText}
                confirmLabel={t.yesLogout}
                cancelLabel={t.cancel}
                danger
                onConfirm={() => {
                    setShowLogout(false)
                    ui.closeMobileMenu()
                    logout()
                }}
                onClose={() => setShowLogout(false)}
            />
        </>
    )
})
