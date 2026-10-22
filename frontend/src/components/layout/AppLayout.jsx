import { useState, useMemo, Suspense } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { observer } from 'mobx-react-lite'
import useHotkeys from '../../hooks/useHotkeys'
import useShopSync from '../../hooks/useShopSync'
import { useHotkeysContext } from '../../context/HotkeysContext'
import { selectSidebarPins } from '../../store/slices/sidebarSlice'
import { useUiStore } from '../../store/useUiStore'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileTopBar from './MobileTopBar'
import MobileNav from './MobileNav'
import RescheduleBanner from '../task/RescheduleBanner'

/**
 * AppLayout — владелец глобальных хоткеев и «шины» локальной UI-логики.
 *
 * После D5 все сигналы, которые раньше шли через window.dispatchEvent,
 * идут через MobX-стор (useUiStore): клавиша T — toggleTree(),
 * Escape — closeAllToolbars(), клавиша N — requestCreate(kind), который
 * забирает активный экран через consumeCreate(). Подписок на кастомные
 * события здесь больше нет.
 */
export default observer(function AppLayout() {
    const nav = useNavigate()
    const location = useLocation()
    const { openHelp, helpOpen } = useHotkeysContext()
    const ui = useUiStore()
    const [gPressed, setGPressed] = useState(false)

    // Пиннутые доски/проекты — серверный стейт из Redux. Хоткеи g1/g2/g3
    // читают готовый производный список вместо собственных 4 запросов.
    const sidebarPins = useSelector(selectSidebarPins)

    // Мост axios -> Redux: реакция на 'shop:invalidate' (см. hooks/useShopSync.js)
    useShopSync()

    const focusSearch = () => {
        const input = document.querySelector('.topbar__search')
        if (input) input.focus()
    }

    const toggleTree = () => {
        ui.toggleTree()
    }

    const openPinned = (index) => {
        const pin = sidebarPins[index - 1]
        if (!pin) return

        if (pin.type === 'project') {
            nav(`/boards/${pin.boardId}/projects/${pin.projectId}`)
        } else {
            nav(`/boards/${pin.boardId}`)
        }
    }

    const isInsideProject = () => {
        const path = window.location.pathname
        return /^\/boards\/\d+\/projects\/\d+/.test(path)
    }

    const handleEscape = () => {
        const modalOverlay = document.querySelector('.modal-overlay')
        const attachmentPreview = document.querySelector('.attachment-preview')
        const attachmentsModal = document.querySelector('.attachments-modal-overlay')
        const inlinePreview = document.querySelector('.attachments-modal__preview')

        // Мобильное меню — верхний слой: Escape должен закрыть именно его,
        // а не уводить пользователя со страницы.
        if (ui.mobileMenuOpen) {
            ui.closeMobileMenu()
            return false
        }

        if (modalOverlay || attachmentPreview || attachmentsModal || inlinePreview) {
            return false
        }

        const anyOpenPanel = document.querySelector(
            '.filters-bar__panel, .view-switcher__menu, .sort-switcher__menu'
        )
        if (anyOpenPanel) {
            ui.closeAllToolbars()
            return false
        }

        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            return false
        }

        // В режиме перестановки Esc должен только выйти из него: клавишу
        // обрабатывает сама страница проекта. Иначе сработал бы ещё и
        // переход назад, и пользователь покидал бы проект.
        if (document.querySelector('.kanban--reorder, .compact-view--reorder')) {
            return false
        }

        const path = location.pathname

        const projectMatch = path.match(/^\/boards\/(\d+)\/projects\/\d+/)
        if (projectMatch) {
            nav(`/boards/${projectMatch[1]}`)
            return
        }

        const settingsMatch = path.match(/^\/boards\/(\d+)\/settings/)
        if (settingsMatch) {
            nav(`/boards/${settingsMatch[1]}`)
            return
        }

        const boardMatch = path.match(/^\/boards\/(\d+)(?:\/|$)/)
        if (boardMatch) {
            nav('/boards')
            return
        }

        return false
    }

    const handleNew = () => {
        if (document.querySelector('.modal-overlay')) return

        const path = location.pathname

        if (path === '/calendar' || path.startsWith('/calendar?')) {
            ui.requestCreate('calendar-day')
            return
        }

        if (/^\/boards\/\d+\/projects\/\d+/.test(path)) {
            ui.requestCreate('task')
            return
        }
        if (/^\/boards\/\d+\/?$/.test(path)) {
            ui.requestCreate('project')
            return
        }
        if (/^\/boards\/?$/.test(path)) {
            ui.requestCreate('board')
            return
        }
    }

    const hotkeys = useMemo(() => [
        {
            combo: 'escape',
            when: () => !helpOpen,
            handler: handleEscape,
            allowInInput: true,
        },
        { combo: 'h', handler: () => openHelp() },
        { combo: '/', handler: focusSearch },
        { combo: 'ctrl+k', handler: focusSearch, allowInInput: true },
        { combo: 'n', handler: handleNew, allowInInput: false },
        { combo: 't', handler: toggleTree },
        {
            combo: 'g',
            handler: () => {
                setGPressed(true)
                setTimeout(() => setGPressed(false), 1200)
            },
            allowInInput: false,
        },
        { combo: 'b', when: () => gPressed, handler: () => nav('/boards') },
        { combo: 'c', when: () => gPressed, handler: () => nav('/calendar') },
        { combo: 's', when: () => gPressed, handler: () => nav('/stats') },
        { combo: 'p', when: () => gPressed, handler: () => nav('/profile') },
        {
            combo: '1',
            when: () => !isInsideProject(),
            handler: () => openPinned(1),
            allowInInput: false,
        },
        {
            combo: '2',
            when: () => !isInsideProject(),
            handler: () => openPinned(2),
            allowInInput: false,
        },
        {
            combo: '3',
            when: () => !isInsideProject(),
            handler: () => openPinned(3),
            allowInInput: false,
        },
        // eslint-disable-next-line
    ], [helpOpen, gPressed, location.pathname])

    useHotkeys(hotkeys)

    return (
        <div className="layout">
            <Sidebar />
            <div className="layout__main">
                {/* На телефоне десктопная шапка прячется целиком
                    (mobile.css), а вместо неё — компактная строка с
                    заголовком, поиском и меню. Обе ветки остаются в DOM:
                    переключение «резиновое», без потери состояния поиска
                    при повороте экрана. */}
                <TopBar />
                <MobileTopBar />
                <div className="layout__content">
                    {/* Свой Suspense: при ленивой загрузке страницы остаётся
                        видимым сайдбар, а не только полноэкранный спиннер. */}
                    <Suspense fallback={<div className="loading">Загрузка…</div>}>
                        <Outlet />
                    </Suspense>
                </div>
                <RescheduleBanner />
            </div>
            <MobileNav />
        </div>
    )
})