// src/hooks/useClickOutside.js
import { useEffect } from 'react'

/**
 * Закрывает панель по клику вне элемента.
 *
 * @param {React.RefObject} ref — ссылка на корневой элемент панели
 * @param {Function} onClose — вызывается при клике вне
 * @param {boolean} active — слушать ли сейчас (обычно `open`)
 */
export default function useClickOutside(ref, onClose, active = true) {
    useEffect(() => {
        if (!active) return

        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose()
            }
        }

        // mousedown — чтобы успеть до клика по кнопке внутри
        window.addEventListener('mousedown', handler)
        return () => window.removeEventListener('mousedown', handler)
    }, [ref, onClose, active])
}