import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__head">
                    <h3 className="modal__title">{title}</h3>
                    <button className="modal__close" onClick={onClose} title="Закрыть">×</button>
                </div>

                <div className="modal__body">
                    {children}
                </div>

                {footer && <div className="modal__foot">{footer}</div>}
            </div>
        </div>
    )
}