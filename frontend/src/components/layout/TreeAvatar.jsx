import { useEffect, useRef, useState } from 'react'
import * as Sakura from './trees/SakuraTree'
import * as Birch from './trees/BirchTree'
import * as Palm from './trees/PalmTree'
import * as Apple from './trees/AppleTree.jsx'

const STAGES = {
    sprout: { min: 0, max: 2, label: 'Росток' },
    young:  { min: 3, max: 9, label: 'Молодое дерево' },
    mature: { min: 10, max: 999, label: 'Взрослое дерево' },
}

const TREES = {
    sakura: Sakura,
    birch:  Birch,
    palm:   Palm,
    apple:  Apple,
}

function getStage(done) {
    if (done >= 10) return 'mature'
    if (done >= 3) return 'young'
    return 'sprout'
}

function getProgress(done) {
    const stage = getStage(done)
    const { min, max } = STAGES[stage]
    if (max === min) return 1
    return Math.min(1, Math.max(0, (done - min) / (max - min)))
}

export default function TreeAvatar({ done = 0, kind = 'sakura', maxHeight = 400 }) {
    const stage = getStage(done)
    const progress = getProgress(done)
    const treeModule = TREES[kind] || TREES.sakura

    const [grown, setGrown] = useState(false)
    const [bounce, setBounce] = useState(false)
    const prevDoneRef = useRef(done)
    const prevKindRef = useRef(kind)

    // Анимация первого появления
    useEffect(() => {
        const id = requestAnimationFrame(() => setGrown(true))
        return () => cancelAnimationFrame(id)
    }, [])

    // Анимация при росте или смене дерева
    useEffect(() => {
        if (prevKindRef.current !== kind) {
            prevKindRef.current = kind
            prevDoneRef.current = done
            setGrown(false)
            requestAnimationFrame(() => setGrown(true))
            return
        }
        if (done > prevDoneRef.current) {
            setBounce(true)
            const t = setTimeout(() => setBounce(false), 600)
            prevDoneRef.current = done
            return () => clearTimeout(t)
        }
        prevDoneRef.current = done
    }, [done, kind])

    const cap = Math.min(maxHeight, Math.floor(window.innerHeight * 0.5))

    let size
    if (stage === 'sprout') {
        size = 40 + progress * 30
    } else if (stage === 'young') {
        size = 100 + progress * 80
    } else {
        size = 220 + progress * (cap - 220)
    }

    const Comp = stage === 'sprout'
        ? treeModule.SproutSVG
        : stage === 'young'
            ? treeModule.YoungSVG
            : treeModule.MatureSVG

    const scale = grown ? 1 : 0.1

    return (
        <div
            className={`tree-avatar tree-avatar--${stage} ${bounce ? 'tree-avatar--bounce' : ''}`}
            style={{
                width: size,
                height: size,
                transform: `scale(${scale})`,
                opacity: grown ? 1 : 0,
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                transformOrigin: 'bottom center',
            }}
            title={`Выполнено сегодня: ${done} (${STAGES[stage].label})`}
        >
            <Comp />
        </div>
    )
}