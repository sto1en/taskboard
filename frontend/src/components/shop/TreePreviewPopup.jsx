// frontend/src/components/shop/TreePreviewPopup.jsx

/**
 * Окошко превью скина дерева.
 *
 * Зачем отдельный файл: раньше каждая карточка рисовала полноценное SVG-дерево
 * прямо в сетке (20 скинов × листья/цветы = тяжёлый первый рендер магазина).
 * Теперь дерево рендерится ТОЛЬКО когда пользователь нажал «Превью», и только
 * для одного скина за раз.
 *
 * Открывается по клику (работает и на тач-устройствах), закрывается
 * кликом по фону, по крестику или по Esc.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import TreeAvatar from '../layout/TreeAvatar'
import useT from '../../hooks/useT'

const STAGES = [
    { key: 'sprout', done: 0 },
    { key: 'young', done: 5 },
    { key: 'mature', done: 12 },
]

export default function TreePreviewPopup({ item, onClose }) {
    const t = useT()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Небольшая задержка: сначала вставляем портал, потом включаем
        // transition — иначе попап «щёлкает» без анимации.
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)

        // Блокируем прокрутку страницы под попапом.
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [onClose])

    const labels = {
        sprout: t.shopStageSprout,
        young: t.shopStageYoung,
        mature: t.shopStageMature,
    }

    return createPortal(
        <div
            className={`tree-preview-modal ${mounted ? 'tree-preview-modal--open' : ''}`}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
        >
            <div className="tree-preview-dialog">
                <div className="tree-preview-dialog__head">
                    <div>
                        <div className="tree-preview-dialog__title">{item.title}</div>
                        {item.description && (
                            <div className="tree-preview-dialog__desc">{item.description}</div>
                        )}
                    </div>
                    <button
                        type="button"
                        className="tree-preview-dialog__close"
                        onClick={onClose}
                        aria-label="Закрыть"
                        title="Закрыть"
                    >
                        ×
                    </button>
                </div>

                <div className="tree-preview-dialog__stages">
                    {STAGES.map(({ key, done }) => (
                        <div className="tree-preview-stage" key={key}>
                            <div className="tree-preview-stage__art">
                                <TreeAvatar
                                    kind={item.code}
                                    done={done}
                                    demoSize={190}
                                    demo
                                    noStageBar
                                />
                            </div>
                            <div className="tree-preview-stage__label">{labels[key]}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    )
}
