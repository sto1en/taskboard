import { useEffect, useState } from 'react'
import Modal from '../Modal/Modal'

export default function ConfirmModal({
                                         open,
                                         title,
                                         text,
                                         confirmLabel = 'OK',
                                         cancelLabel = 'Отмена',
                                         danger = false,
                                         loading = false,
                                         showDontAsk = false,
                                         dontAskLabel = 'Больше не спрашивать',
                                         onConfirm,
                                         onClose,
                                     }) {
    const [dontAsk, setDontAsk] = useState(false)

    useEffect(() => {
        if (open) setDontAsk(false)
    }, [open])

    const handleConfirm = () => {
        onConfirm && onConfirm({ dontAsk: showDontAsk && dontAsk })
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? '...' : confirmLabel}
                    </button>
                </>
            }
        >
            <div className="confirm-modal__text">{text}</div>

            {showDontAsk && (
                <label className="confirm-modal__dont-ask">
                    <input
                        type="checkbox"
                        checked={dontAsk}
                        onChange={(e) => setDontAsk(e.target.checked)}
                    />
                    <span>{dontAskLabel}</span>
                </label>
            )}
        </Modal>
    )
}