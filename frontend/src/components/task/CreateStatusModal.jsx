import { useState, useEffect } from 'react'
import { statusesApi } from '../../api/api'
import Modal from '../Modal/Modal'
import useT from '../../hooks/useT'
import { localizeCategoryLabel } from '../../utils/statusNames'

const CATEGORIES = ['ACTIVE', 'FROZEN', 'DONE', 'EXPIRED', 'CANCELLED', 'ARCHIVED']

const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'gray', 'teal', 'navy', 'olive']

export default function CreateStatusModal({ open, onClose, boardId, onCreated }) {
    const t = useT()
    const [title, setTitle] = useState('')
    const [categoryCode, setCategoryCode] = useState('ACTIVE')
    const [accentCode, setAccentCode] = useState('blue')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (open) {
            setTitle('')
            setCategoryCode('ACTIVE')
            setAccentCode('blue')
            setError(null)
        }
    }, [open])

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) {
            setError(t.titleLabel)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const { data } = await statusesApi.create(boardId, {
                scope: 'task',
                categoryCode,
                title: title.trim(),
                accentCode,
            })
            onCreated && onCreated(data)
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t.newStatusModal}
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        {t.cancel}
                    </button>
                    <button
                        type="submit"
                        form="create-status-form"
                        className="btn btn-primary"
                        disabled={loading || !title.trim()}
                    >
                        {loading ? '...' : t.create}
                    </button>
                </>
            }
        >
            <form id="create-status-form" onSubmit={onSubmit} style={{ display: 'contents' }}>
                <div className="modal__field">
                    <label className="modal__label">{t.titleLabel}</label>
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.statusNamePlaceholder}
                        maxLength={60}
                        autoFocus
                        required
                    />
                </div>

                <div className="modal__field">
                    <label className="modal__label">{t.categoryLabel}</label>
                    <select
                        className="input"
                        value={categoryCode}
                        onChange={(e) => setCategoryCode(e.target.value)}
                    >
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>
                                {localizeCategoryLabel(c, t)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="modal__field">
                    <label className="modal__label">{t.colorLabel}</label>
                    <div className="color-picker">
                        {ACCENTS.map(c => (
                            <button
                                key={c}
                                type="button"
                                data-accent={c}
                                className={`color-picker__item ${accentCode === c ? 'color-picker__item--active' : ''}`}
                                onClick={() => setAccentCode(c)}
                            />
                        ))}
                    </div>
                </div>

                {error && <div className="modal__error">{error}</div>}
            </form>
        </Modal>
    )
}