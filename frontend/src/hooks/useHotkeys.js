// src/hooks/useHotkeys.js
import { useEffect } from 'react'

/**
 * Сопоставление "человеческого" combo с физической клавишей (e.code).
 * Это позволяет работать на любой раскладке (русской в том числе).
 */
const CODE_MAP = {
    // латиница (используем e.code, не зависит от раскладки)
    'a': 'KeyA', 'b': 'KeyB', 'c': 'KeyC', 'd': 'KeyD', 'e': 'KeyE',
    'f': 'KeyF', 'g': 'KeyG', 'h': 'KeyH', 'i': 'KeyI', 'j': 'KeyJ',
    'k': 'KeyK', 'l': 'KeyL', 'm': 'KeyM', 'n': 'KeyN', 'o': 'KeyO',
    'p': 'KeyP', 'q': 'KeyQ', 'r': 'KeyR', 's': 'KeyS', 't': 'KeyT',
    'u': 'KeyU', 'v': 'KeyV', 'w': 'KeyW', 'x': 'KeyX', 'y': 'KeyY',
    'z': 'KeyZ',
    // цифры
    '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4',
    '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8',
    '9': 'Digit9', '0': 'Digit0',
    // спец
    '/': 'Slash',
    '?': 'Slash',       // с Shift
    'escape': 'Escape',
    'esc': 'Escape',
    'enter': 'Enter',
    'space': 'Space',
    'delete': 'Delete',
    'backspace': 'Backspace',
}

export default function useHotkeys(keys) {
    useEffect(() => {
        const handler = (e) => {
            const target = e.target
            const isInput = target && (
                target.tagName === 'INPUT'
                || target.tagName === 'TEXTAREA'
                || target.isContentEditable
            )

            for (const k of keys) {
                if (k.when && !k.when()) continue
                if (isInput && !k.allowInInput) continue
                if (matches(e, k.combo)) {
                    const result = k.handler(e)
                    if (result !== false) {
                        if (!e.defaultPrevented) e.preventDefault()
                    }
                    return
                }
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [keys])
}

function matches(e, combo) {
    const parts = combo.toLowerCase().split('+')
    const needCtrl = parts.includes('ctrl') || parts.includes('control')
    const needShift = parts.includes('shift')
    const needAlt = parts.includes('alt')
    const needMeta = parts.includes('meta') || parts.includes('cmd')

    const key = parts[parts.length - 1]

    if (needCtrl !== (e.ctrlKey || e.metaKey)) return false
    if (needShift !== e.shiftKey) return false
    if (needAlt !== e.altKey) return false
    if (needMeta && !e.metaKey) return false

    // 1) Пытаемся сопоставить по физической клавише (e.code)
    const mappedCode = CODE_MAP[key]
    if (mappedCode && e.code === mappedCode) {
        // для '?' дополнительно проверим, что это с Shift
        if (key === '?') return e.shiftKey
        return true
    }

    // 2) Fallback — по e.key (для клавиш, у которых нет CODE_MAP)
    const eventKey = (e.key || '').toLowerCase()
    if (key === 'esc') return eventKey === 'escape'
    if (key === 'enter') return eventKey === 'enter'
    if (key === 'space') return eventKey === ' '
    if (key === 'delete') return eventKey === 'delete'
    if (key === 'backspace') return eventKey === 'backspace'
    if (key === '?') return eventKey === '?' || (e.shiftKey && eventKey === '/')

    return eventKey === key
}