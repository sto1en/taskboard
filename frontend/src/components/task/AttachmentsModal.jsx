import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { attachmentsApi, tasksApi } from '../../api/api'
import { resolveUrl } from '../../utils/format'

export default function AttachmentsModal({
                                             open,
                                             attachments,
                                             taskId,
                                             onClose,
                                             onUpdated,
                                             pendingMode = false,
                                             pendingAttachments = [],
                                             onPendingChange,
                                         }) {
    const [preview, setPreview] = useState(null)
    const [items, setItems] = useState([])
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    // Собираем отображаемый список:
    //  - уже привязанные к задаче (attachments)
    //  - плюс «черновики» (pendingAttachments) в pendingMode
    useEffect(() => {
        const already = (attachments || []).map(a => ({
            ...a,
            url: resolveUrl(a.url),
            _pending: false,
        }))
        const pending = (pendingAttachments || []).map(a => ({
            ...a,
            url: resolveUrl(a.url),
            _pending: true,
        }))
        setItems([...already, ...pending])
    }, [attachments, pendingAttachments])

    useEffect(() => {
        if (!open) {
            setPreview(null)
            setError(null)
            return
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (preview) setPreview(null)
                else onClose()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, preview, onClose])

    useEffect(() => {
        if (!open) return

        const onKey = (e) => {
            if (e.code !== 'KeyN') return
            if (e.ctrlKey || e.metaKey || e.altKey) return

            const target = e.target
            const isInput = target && (
                target.tagName === 'INPUT'
                || target.tagName === 'TEXTAREA'
                || target.isContentEditable
            )

            if (isInput && target.type !== 'file') return

            e.preventDefault()
            e.stopPropagation()
            if (!uploading) {
                fileInputRef.current?.click()
            }
        }

        window.addEventListener('keydown', onKey, true)
        return () => window.removeEventListener('keydown', onKey, true)
    }, [open, uploading])

    if (!open) return null

    const handleDownload = async (e, a) => {
        e.stopPropagation()
        const url = a.url
        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error('Download failed')
            const blob = await res.blob()
            const objUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = objUrl
            link.download = a.originalName || 'file'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
        } catch (err) {
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    }

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setError(null)
        try {
            const { data: attachment } = await attachmentsApi.upload(file)

            const newItem = {
                id: attachment.id,
                url: attachment.url,
                originalName: attachment.originalName,
                mimeCode: attachment.mimeCode,
            }

            if (pendingMode) {
                // Не привязываем к задаче — ждём кнопки «Сохранить»
                onPendingChange && onPendingChange([
                    ...(pendingAttachments || []),
                    newItem,
                ])
            } else {
                if (!taskId) {
                    setError('Нельзя загрузить: нет id задачи')
                    return
                }
                await tasksApi.attach(taskId, attachment.id)
                setItems(prev => [...prev, {
                    ...newItem,
                    url: resolveUrl(newItem.url),
                    _pending: false,
                }])
                onUpdated && onUpdated()
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemovePending = (item) => {
        if (!pendingMode || !onPendingChange) return
        onPendingChange((pendingAttachments || []).filter(x => x.id !== item.id))
    }

    const contentEl = typeof document !== 'undefined'
        ? document.querySelector('.layout__content')
        : null

    const previewPortal = preview && contentEl
        ? createPortal(
            <div
                className="attachments-modal__preview"
                onClick={() => setPreview(null)}
            >
                <img
                    src={preview.url}
                    alt={preview.originalName}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="attachments-modal__preview-actions">
                    <button
                        className="attachments-modal__btn"
                        onClick={(e) => handleDownload(e, preview)}
                    >⬇ Скачать</button>
                    <a
                        href={preview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachments-modal__btn"
                    >↗ Открыть</a>
                    <button
                        className="attachments-modal__btn"
                        onClick={() => setPreview(null)}
                    >× Закрыть</button>
                </div>
            </div>,
            contentEl
        )
        : null

    if (preview) {
        return previewPortal
    }

    return (
        <div className="attachments-modal-overlay" onClick={onClose}>
            <div className="attachments-modal" onClick={(e) => e.stopPropagation()}>
                <div className="attachments-modal__head">
                    <h3 className="attachments-modal__title">
                        Вложения ({items.length})
                    </h3>
                    <button className="attachments-modal__close" onClick={onClose}>×</button>
                </div>

                <div className="attachments-modal__body">
                    {error && <div className="attachments-modal__error">{error}</div>}

                    {items.length === 0 ? (
                        <div className="attachments-modal__empty">Нет вложений</div>
                    ) : (
                        <div className="attachments-modal__grid">
                            {items.map(a => {
                                const isImage = a.mimeCode?.startsWith('image/')
                                return (
                                    <div
                                        key={`${a.id}-${a._pending ? 'p' : 'a'}`}
                                        className={`attachments-modal__item ${a._pending ? 'attachments-modal__item--pending' : ''}`}
                                        onClick={() => isImage && setPreview(a)}
                                    >
                                        {isImage ? (
                                            <img
                                                src={a.url}
                                                alt={a.originalName}
                                                className="attachments-modal__thumb"
                                            />
                                        ) : (
                                            <div className="attachments-modal__file">
                                                <div className="attachments-modal__file-icon">📎</div>
                                                <div className="attachments-modal__file-name">
                                                    {a.originalName}
                                                </div>
                                            </div>
                                        )}

                                        <div className="attachments-modal__item-actions">
                                            {a._pending && pendingMode ? (
                                                <button
                                                    type="button"
                                                    className="attachments-modal__btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleRemovePending(a)
                                                    }}
                                                    title="Убрать (не сохранено)"
                                                >×</button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="attachments-modal__btn"
                                                        onClick={(e) => handleDownload(e, a)}
                                                        title="Скачать"
                                                    >⬇</button>
                                                    <a
                                                        href={a.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="attachments-modal__btn"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Открыть в новой вкладке"
                                                    >↗</a>
                                                </>
                                            )}
                                        </div>

                                        {a._pending && (
                                            <span className="attachments-modal__pending-badge">
                                                черновик
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="attachments-modal__foot">
                    <button
                        type="button"
                        className="btn btn-primary attachments-modal__add"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? 'Загрузка...' : '+ Добавить вложение'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </div>
            </div>
        </div>
    )
}