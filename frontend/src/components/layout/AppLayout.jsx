import { useState, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import useHotkeys from '../../hooks/useHotkeys'
import { useHotkeysContext } from '../../context/HotkeysContext'
import api from '../../api/api'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
    const nav = useNavigate()
    const { openHelp, helpOpen } = useHotkeysContext()
    const [gPressed, setGPressed] = useState(false)
    const lastEscRef = useRef(0)

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

    const toggleProfile = () => {
        const current = localStorage.getItem('sidebar_user_hidden')
        const next = current === 'true' ? 'false' : 'true'
        localStorage.setItem('sidebar_user_hidden', next)
        window.dispatchEvent(new CustomEvent('sidebar:toggle-user', { detail: next === 'true' }))
    }

    const openPinned = async (index) => {
        try {
            const { data: boards } = await api.get('/boards')
            const pinnedBoards = boards.filter(b => b.isPinned)
            const pins = []

            for (const b of pinnedBoards) {
                const { data: projects } = await api.get(`/boards/${b.id}/projects`)
                const pinnedProjects = projects.filter(p => p.isPinned)
                if (pinnedProjects.length > 0) {
                    for (const p of pinnedProjects) {
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

    useHotkeys([
        {
            combo: 'escape',
            handler: () => {
                if (helpOpen) return false
                const now = Date.now()
                const doubleTap = now - lastEscRef.current < 500
                if (doubleTap) {
                    lastEscRef.current = 0
                    nav('/boards')
                } else {
                    lastEscRef.current = now
                    nav(-1)
                }
            },
            allowInInput: true,
        },

        { combo: 'h', handler: () => openHelp() },
        { combo: '/', handler: focusSearch },
        { combo: 'ctrl+k', handler: focusSearch, allowInInput: true },

        // Новые горячие клавиши
        { combo: 't', handler: toggleTree },
        { combo: 'p', handler: toggleProfile },
        { combo: 's', handler: focusSearch },

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
            </div>
        </div>
    )
}