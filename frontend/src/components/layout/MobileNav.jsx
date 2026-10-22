import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { observer } from 'mobx-react-lite'
import { useAuth } from '../../context/AuthContext'
import { useUiStore } from '../../store/useUiStore'
import { selectActiveAvatar, selectActiveFrame } from '../../store/slices/shopSlice'
import useT from '../../hooks/useT'
import useIsMobile from '../../hooks/useMediaQuery'
import AvatarWithFrame from './AvatarWithFrame'

/**
 * Нижняя навигация на телефоне.
 *
 * Заменяет десктопный сайдбар только на узких экранах (mobile.css прячет
 * .sidebar). Пять пунктов — самое частое: главная, доски, календарь,
 * магазин, профиль. Всё остальное (шаблоны, гайды, статистика, настройки,
 * группы, выход) живёт в «Меню» на TopBar, чтобы не плодить шестой пункт.
 *
 * Почему отдельный компонент, а не переиспользование Sidebar: Sidebar
 * держит дерево, ежедневную цель, закрепы и кнопку свёртывания — на
 * телефоне это превращается в простыню, которую всё равно пришлось бы
 * прятать отдельными правилами.
 */
export default observer(function MobileNav() {
    const t = useT()
    const nav = useNavigate()
    const location = useLocation()
    const ui = useUiStore()
    const { user } = useAuth()
    const isMobile = useIsMobile()
    const activeAvatar = useSelector(selectActiveAvatar)
    const activeFrame = useSelector(selectActiveFrame)

    // Страницы, которых нет в таб-баре, должны подсвечивать «свой» таб:
    // проект живёт внутри досок, лидерборд — внутри статистики и т. д.
    const path = location.pathname
    const inBoards = /^\/boards(\/|$)/.test(path) || /^\/group(\/|$)/.test(path)
    const inCalendar = path.startsWith('/calendar')
    const inShop = path.startsWith('/shop')
    const inProfile = path.startsWith('/profile') || /^\/users\//.test(path)
    const inHome = path === '/' || path.startsWith('/stats') || path.startsWith('/leaderboard')

    const items = [
        { code: 'home', to: '/', icon: '🏠', label: t.home || 'Главная', active: inHome },
        { code: 'boards', to: '/boards', icon: '📋', label: t.boards || 'Доски', active: inBoards },
        { code: 'calendar', to: '/calendar', icon: '📅', label: t.calendar || 'Календарь', active: inCalendar },
        { code: 'shop', to: '/shop', icon: '🛒', label: 'Магазин', active: inShop },
        { code: 'profile', to: '/profile', icon: '👤', label: 'Профиль', active: inProfile },
    ]

    // Тап по активному табу — «наверх»: привычное поведение мобильных
    // приложений, когда пользователь ушёл глубоко (доска → проект → задача).
    const onTab = (e, item) => {
        ui.closeMobileMenu()
        if (item.active && location.pathname !== item.to) {
            e.preventDefault()
            nav(item.to)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Профиль в таб-баре — аватарка пользователя, а не абстрактная иконка:
    // так видно, кто залогинен, без похода в сайдбар.
    const avatarTab = items.map((item) => {
        if (item.code !== 'profile') return item
        return {
            ...item,
            icon: (
                <span className="mobile-nav__avatar" aria-hidden="true">
                    <AvatarWithFrame
                        avatar={activeAvatar}
                        frame={activeFrame}
                        displayName={user?.displayName || user?.username}
                        username={user?.username}
                        size={24}
                    />
                </span>
            ),
        }
    })

    // На десктопе компонент вообще не рендерим: лишняя ссылка в DOM без
    // видимого таба ломает навигацию с клавиатуры и таб-порядок.
    if (!isMobile) return null

    return (
        <nav className="mobile-nav mobile-nav--phone" aria-label="Основная навигация">
            {avatarTab.map((item) => (
                <Link
                    key={item.code}
                    to={item.to}
                    className={`mobile-nav__item ${item.active ? 'mobile-nav__item--active' : ''}`}
                    onClick={(e) => onTab(e, item)}
                    aria-current={item.active ? 'page' : undefined}
                >
                    <span className="mobile-nav__icon" aria-hidden="true">{item.icon}</span>
                    <span className="mobile-nav__label">{item.label}</span>
                </Link>
            ))}
        </nav>
    )
})
