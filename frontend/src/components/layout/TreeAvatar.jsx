import { useEffect, useRef, useState, useCallback } from 'react'
import * as Sakura from './trees/SakuraTree'
import * as Birch from './trees/BirchTree'
import * as Palm from './trees/PalmTree'
import * as Apple from './trees/AppleTree.jsx'
import useT from '../../hooks/useT'

const STAGES = {
    sprout: { min: 0,  max: 2,   label: 'Росток' },
    young:  { min: 3,  max: 9,   label: 'Молодое дерево' },
    mature: { min: 10, max: 999, label: 'Взрослое дерево' },
}

const TREES = {
    sakura: Sakura,
    birch:  Birch,
    palm:   Palm,
    apple:  Apple,
}

const LEAVES_BY_KIND = {
    sakura: {
        sprout: ['🌱', '🍃'],
        young:  ['🌸', '💮', '🍃'],
        mature: ['🌸', '💮', '🌷', '🌺'],
    },
    birch: {
        sprout: ['🌱', '🍃'],
        young:  ['🍃', '🌿'],
        mature: ['🍃', '🌿', '🍂'],
    },
    palm: {
        sprout: ['🌱', '🌿'],
        young:  ['🌴', '🍃'],
        mature: ['🌴', '🍃', '🌿'],
    },
    apple: {
        sprout: ['🌱', '🍃'],
        young:  ['🍎', '🍏', '🍃'],
        mature: ['🍎', '🍏', '🌸', '🍃'],
    },
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

function ProgressBar({ done, target, label }) {
    const segments = 10
    const filled = Math.min(segments, Math.round((done / target) * segments))
    const accent = 'var(--accent, #4c9aff)'

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                maxWidth: 220,
                marginTop: 4,
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    opacity: 1,
                }}
            >
                {label}
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 0,
                    width: '100%',
                    padding: 2,
                    background: 'var(--bg)',
                    borderRadius: 3,
                    border: '1px solid var(--border)',
                    boxSizing: 'border-box',
                    height: 14,
                    overflow: 'hidden',
                }}
            >
                {Array.from({ length: segments }).map((_, i) => {
                    const isFilled = i < filled
                    return (
                        <span
                            key={i}
                            style={{
                                flex: 1,
                                height: '100%',
                                background: isFilled
                                    ? accent
                                    : 'rgba(127,127,127,0.18)',
                                filter: isFilled
                                    ? 'brightness(1.25) saturate(1.3)'
                                    : 'none',
                                boxShadow: isFilled
                                    ? `0 0 8px ${accent}, 0 0 14px ${accent}`
                                    : 'none',
                                borderRight:
                                    i < segments - 1 ? '1px solid var(--bg)' : 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    )
                })}
            </div>

            <div
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--text)',
                    opacity: 0.9,
                    letterSpacing: '0.3px',
                }}
            >
                {done} / {target}
            </div>
        </div>
    )
}

export default function TreeAvatar({ done = 0, kind = 'sakura', maxHeight = 400 }) {
    const t = useT()
    const stage = getStage(done)
    const progress = getProgress(done)
    const treeModule = TREES[kind] || TREES.sakura

    const [grown, setGrown] = useState(false)
    const [bounce, setBounce] = useState(false)
    const [leaves, setLeaves] = useState([])
    const prevDoneRef = useRef(done)
    const prevKindRef = useRef(kind)
    const nextLeafId = useRef(0)

    useEffect(() => {
        const id = requestAnimationFrame(() => setGrown(true))
        return () => cancelAnimationFrame(id)
    }, [])

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
            const t2 = setTimeout(() => setBounce(false), 600)
            prevDoneRef.current = done
            return () => clearTimeout(t2)
        }
        prevDoneRef.current = done
    }, [done, kind])

    const handleTreeClick = useCallback(() => {
        const byKind = LEAVES_BY_KIND[kind] || LEAVES_BY_KIND.sakura
        const pool = byKind[stage] || byKind.mature
        const count = stage === 'sprout' ? 5 : stage === 'young' ? 10 : 18

        const newLeaves = Array.from({ length: count }).map(() => {
            const id = ++nextLeafId.current
            const leaf = pool[Math.floor(Math.random() * pool.length)]
            const left = 15 + Math.random() * 70
            const duration = 1800 + Math.random() * 1600
            const delay = Math.random() * 300
            const size = 12 + Math.random() * 10
            const rotate = (Math.random() - 0.5) * 360
            const drift = (Math.random() - 0.5) * 60
            return { id, leaf, left, duration, delay, size, rotate, drift }
        })

        setLeaves(prev => [...prev, ...newLeaves])

        setTimeout(() => {
            setLeaves(prev => prev.filter(l => !newLeaves.some(nl => nl.id === l.id)))
        }, 3800)
    }, [kind, stage])

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
        <div className="tree-avatar-wrap">
            <div
                className={`tree-avatar tree-avatar--${stage} ${bounce ? 'tree-avatar--bounce' : ''}`}
                style={{
                    width: size,
                    height: size,
                    transform: `scale(${scale})`,
                    opacity: grown ? 1 : 0,
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                    transformOrigin: 'bottom center',
                    cursor: 'pointer',
                }}
                onClick={handleTreeClick}
                title={`Выполнено: ${done} (${STAGES[stage].label})`}
            >
                <Comp />

                {leaves.map(l => (
                    <span
                        key={l.id}
                        className="tree-leaf"
                        style={{
                            left: `${l.left}%`,
                            animationDuration: `${l.duration}ms`,
                            animationDelay: `${l.delay}ms`,
                            fontSize: `${l.size}px`,
                            '--leaf-rotate': `${l.rotate}deg`,
                            '--leaf-drift': `${l.drift}px`,
                        }}
                    >
                        {l.leaf}
                    </span>
                ))}
            </div>

            <ProgressBar done={done} target={10} label={t.progressTree} />
        </div>
    )
}