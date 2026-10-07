import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import useHotkeys from '../../hooks/useHotkeys'
import { useHotkeysContext } from '../../context/HotkeysContext'
import api from '../../api/api'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import RescheduleBanner from '../Task/RescheduleBanner'

export default function AppLayout() {
    const nav = useNavigate()
    const location = useLocation()
    const { openHelp, helpOpen } = useHotkeysContext()
    const [gPressed, setGPressed] = useState(false)

    const focusSearch = () => {
        const input = document.querySelector('.topbar__search')
        if (input) input.focus()
    }

    const toggleTree = () => {
        const current = localStorage.getItem('tree_enabled')
        const next = current === 'false' ? 'true' : 'false'
        localStorage.setItem('tree_enabled', next)
        window.dispatchEvent(new CustomEvent('tree:toggle', { detail: next === 'true' }))
    }

    const openPinned = async (index) => {
        try {
            const { data: boards } = await api.get('/boards')

            const projectsArrays = await Promise.all(
                boards.map(b =>
                    api.get(`/boards/${b.id}/projects`)
                        .then(({ data }) => [b.id, data])
                        .catch(() => [b.id, []])
                )
            )
            const projectsByBoard = Object.fromEntries(projectsArrays)

            const visibleBoards = boards
                .filter(b => {
                    const projs = projectsByBoard[b.id] || []
                    return b.isPinned || projs.some(p => p.isPinned)
                })
                .sort((a, b) => {
                    const pa = a.position ?? 0
                    const pb = b.position ?? 0
                    if (pa !== pb) return pa - pb
                    return (a.id || 0) - (b.id || 0)
                })

            const pins = []
            for (const b of visibleBoards) {
                const projs = (projectsByBoard[b.id] || [])
                    .filter(p => p.isPinned)
                    .sort((a, b2) => {
                        const pa = a.position ?? 0
                        const pb = b2.position ?? 0
                        if (pa !== pb) return pa - pb
                        return (a.id || 0) - (b2.id || 0)
                    })

                if (projs.length > 0) {
                    for (const p of projs) {
                        pins.push({ type: 'project', boardId: b.id, projectId: p.id })
                    }
                } else {
                    pins.push({ type: 'board', boardId: b.id })
                }
            }

            const pin = pins[index - 1]
            if (!pin) return

            if (pin.type === 'project') {
                nav(`/boards/${pin.boardId}/projects/${pin.projectId}`)
            } else {
                nav(`/boards/${pin.boardId}`)
            }
        } catch (err) {
            console.error('openPinned failed:', err)
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

        if (modalOverlay || attachmentPreview || attachmentsModal || inlinePreview) {
            return false
        }

        const anyOpenPanel = document.querySelector(
            '.filters-bar__panel, .view-switcher__menu, .sort-switcher__menu, .search-filters__panel'
        )
        if (anyOpenPanel) {
            window.dispatchEvent(new CustomEvent('toolbar:close', { detail: null }))
            return false
        }

        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
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

    useHotkeys([
        {
            combo: 'escape',
            when: () => !helpOpen,
            handler: handleEscape,
            allowInInput: true,
        },

        { combo: 'h', handler: () => openHelp() },
        { combo: '/', handler: focusSearch },
        { combo: 'ctrl+k', handler: focusSearch, allowInInput: true },

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
    ])

    return (
        <div className="layout">
            <Sidebar />
            <div className="layout__main">
                <TopBar />
                <div className="layout__content">
                    <Outlet />
                </div>
                <RescheduleBanner />
            </div>
        </div>
    )
}