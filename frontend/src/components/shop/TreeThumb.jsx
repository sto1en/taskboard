// frontend/src/components/shop/TreeThumb.jsx

/**
 * Миниатюра дерева для карточки магазина.
 *
 * Полное SVG-дерево — тяжёлое (сотни элементов), поэтому:
 *   1. рендерим его только когда карточка реально попала в вьюпорт
 *      (IntersectionObserver + запас 200px);
 *   2. показываем одну взрослую стадию (MatureSVG) — этого достаточно,
 *      чтобы отличать скины по цвету и форме.
 *
 * Раньше в сетке была только кнопка «🌳», и все деревья выглядели
 * одинаково. Теперь в центре превью — настоящая миниатюра скина.
 */

import { useEffect, useRef, useState } from 'react'
import { TREE_COMPONENTS } from '../layout/TreeAvatar'

export default function TreeThumb({ kind, size = 118 }) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (visible) return
        const el = ref.current
        if (!el) return

        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true)
            return
        }

        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some(e => e.isIntersecting)) {
                    setVisible(true)
                    io.disconnect()
                }
            },
            { rootMargin: '200px 0px' },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [visible])

    const tree = TREE_COMPONENTS[kind]
    const Mature = tree?.MatureSVG

    return (
        <div ref={ref} className="tree-thumb__art" style={{ width: size, height: size }}>
            {visible && Mature
                ? <Mature/>
                : <span className="tree-thumb__placeholder" aria-hidden="true">🌳</span>}
        </div>
    )
}
