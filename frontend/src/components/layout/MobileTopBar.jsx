import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useAuth } from '../../context/AuthContext'
import { useUiStore } from '../../store/useUiStore'
import useT from '../../hooks/useT'
import { useIsMobile } from '../../hooks/useMediaQuery'
import ConfirmModal from '../common/ConfirmModal'

/**
 * Мобильный TopBar + служебное меню.
 *
 * Задач у шапки на телефоне четыре:
 *   1) открыть сайдбар (☰ слева) — весь состав десктопного Sidebar;
 *   2) сказать, где пользователь (заголовок и «назад»);
 *   3) дать быстрый поиск в один тап (поле разворачивается на всю ширину);
 *   4) служебное меню (⋮) — настройки, помощь, выход.
 *
 * Гамбургер стоит слева, как в нативных приложениях: панель выезжает
 * именно с этой стороны. Сам сайдбар — MobileDrawer, здесь только кнопки
 * и нижний лист «ещё» (настройки, помощь, выход).
 *
 * Почему ☰ и ⋮ — разные кнопки: раньше обе открывали один и тот же
 * флаг (ui.mobileMenuOpen), и тап по ☰ поднимал поверх сайдбара ещё и
 * нижний лист, из-за чего было непонятно, что вообще открылось, а пункты
 * вроде «помощи» уводили со страницы вместо сайдбара.
 */

const MENU_LINKS = {
    // Основные разделы (доски, календарь, магазин и т. д.) живут в
    // выезжающем сайдбаре (MobileDrawer, кнопка ☰). В нижнем листе —
    // только служебное и профиль, чтобы не повторять всю навигацию.
    extra: [
        { to: '/profile', icon: '👤', label: 'Профиль' },
    ],
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
    // В auth-сторе имя может прийти и плоско (displayName), и внутри
    // profile — читаем оба варианта, иначе шапка листа пустеет.
    const userName = user?.profile?.displayName || user?.displayName
        || user?.username || user?.name
    const isAdmin = Boolean(user?.isAdmin ?? (user?.role === 'admin'))
    const isMobile = useIsMobile()

    const title = headerTitleFor(location.pathname, t)
    const drawerOpen = ui.mobileMenuOpen
    const sheetOpen = ui.mobileSheetOpen
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

    // Лист «ещё» закрывается системной кнопкой «назад», а не уводит со
    // страницы, — тот же приём с искусственной записью истории, что у
    // поиска. Раньше этого не было: «назад» с открытым листом выходил из
    // приложения.
    const sheetOpenRef = useRef(false)
    sheetOpenRef.current = sheetOpen
    useEffect(() => {
        if (!sheetOpen) return undefined
        window.history.pushState({ mobileSheet: true }, '')
        const onPop = () => ui.closeMobileSheet()
        window.addEventListener('popstate', onPop)
        return () => {
            window.removeEventListener('popstate', onPop)
            // Ушли по ссылке из листа, не закрыв его: запись истории
            // нужно убрать, иначе «назад» вернёт пустую страницу.
            if (sheetOpenRef.current && window.history.state?.mobileSheet) {
                window.history.back()
            }
        }
    }, [sheetOpen, ui])

    // Закрытие поиска снимает и «пустую» запись истории — иначе кнопка
    // «назад» после закрытия возвращала бы поиск снова.
    const closeSearch = () => {
        setSearchOpen(false)
        setQuery('')
        if (window.history.state?.mobileSearch) window.history.back()
    }

    // Открытие поиска/сайдбара: если была открыта «пустая» запись от
    // поиска, её нужно снять, иначе в истории копится мусор.
    const resetSearch = () => {
        setSearchOpen(false)
        setQuery('')
        if (window.history.state?.mobileSearch) window.history.replaceState({}, '')
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
        ui.closeMobileSheet()
        nav(to)
    }

    const openMenu = () => {
        // Поиск в шапке — временное состояние: при открытии сайдбара его
        // закрываем, иначе он «останется» в шапке под затемнением.
        if (searchOpen) resetSearch()
        ui.openMobileMenu()
    }

    // Кнопка «⋮» — только служебное (настройки, помощь, выход).
    // Раньше она открывала тот же флаг, что и ☰, и поверх сайдбара
    // выезжал нижний лист — теперь это отдельный слой.
    const openSheet = () => {
        if (searchOpen) resetSearch()
        ui.openMobileSheet()
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
                            aria-expanded={drawerOpen}
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

                        {/* Служебное меню (настройки, помощь, выход) —
                            отдельная кнопка, чтобы не смешивать его с
                            сайдбаром по ☰. */}
                        <button
                            type="button"
                            className="mobile-icon-btn mobile-topbar__more"
                            onClick={openSheet}
                            aria-label="Ещё"
                            aria-expanded={sheetOpen}
                        >
                            ⋮
                        </button>
                    </>
                )}
            </header>

            {/* Нижний лист «ещё»: только служебные пункты. Всё основное —
                в выезжающем сайдбаре слева (MobileDrawer). */}
            {sheetOpen && (
                <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Ещё">
                    <button
                        type="button"
                        className="mobile-menu__scrim"
                        onClick={() => ui.closeMobileSheet()}
                        aria-label="Закрыть меню"
                    />
                    <div className="mobile-menu__sheet">
                        <div className="mobile-menu__grip" aria-hidden="true" />
                        <div className="mobile-menu__user">
                            <div className="mobile-menu__name">{userName}</div>
                            <div className="mobile-menu__role">
                                {isAdmin ? 'Администратор' : 'Участник'}
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
                            {isAdmin && (
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
                    ui.closeMobileSheet()
                    logout()
                }}
                onClose={() => setShowLogout(false)}
            />
        </>
    )
})
