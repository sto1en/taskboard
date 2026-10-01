import Modal from '../Modal/Modal'

export default function ConfirmModal({
                                         open,
                                         title,
                                         text,
                                         confirmLabel = 'OK',
                                         cancelLabel = 'Отмена',
                                         danger = false,
                                         loading = false,
                                         onConfirm,
                                         onClose,
                                     }) {
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
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? '...' : confirmLabel}
                    </button>
                </>
            }
        >
            <div className="confirm-modal__text">{text}</div>
        </Modal>
    )
}