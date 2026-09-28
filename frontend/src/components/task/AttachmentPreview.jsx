import { useEffect, useState } from 'react'

export default function AttachmentPreview({ attachment, onClose }) {
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (!attachment) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [attachment, onClose])

    if (!attachment) return null

    const url = attachment.url?.startsWith('http')
        ? attachment.url
        : `/uploads/${attachment.url}`

    const isImage = attachment.mimeCode?.startsWith('image/')

    const handleDownload = async (e) => {
        e.preventDefault()
        setDownloading(true)
        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error('Download failed')
            const blob = await res.blob()
            const objUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = objUrl
            a.download = attachment.originalName || 'file'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(objUrl), 1000)
        } catch (err) {
            console.error('Download error:', err)
            // fallback — открыть в новой вкладке
            window.open(url, '_blank', 'noopener,noreferrer')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="attachment-preview" onClick={onClose}>
            <div className="attachment-preview__inner" onClick={(e) => e.stopPropagation()}>
                <div className="attachment-preview__head">
                    <div className="attachment-preview__title">
                        {attachment.originalName || 'Файл'}
                    </div>
                    <div className="attachment-preview__actions">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="btn btn-ghost attachment-preview__btn"
                        >
                            {downloading ? '...' : '⬇ Скачать'}
                        </button>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost attachment-preview__btn"
                        >
                            ↗ Открыть
                        </a>
                        <button
                            className="attachment-preview__close"
                            onClick={onClose}
                            title="Закрыть"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="attachment-preview__body">
                    {isImage ? (
                        <img
                            src={url}
                            alt={attachment.originalName || ''}
                            className="attachment-preview__img"
                        />
                    ) : (
                        <div className="attachment-preview__file">
                            <div className="attachment-preview__file-icon">📎</div>
                            <div className="attachment-preview__file-name">
                                {attachment.originalName}
                            </div>
                            <div className="attachment-preview__file-mime">
                                {attachment.mimeCode}
                            </div>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary attachment-preview__open"
                            >
                                Открыть в новой вкладке
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}