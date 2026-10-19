// frontend/src/components/layout/TreeAvatar.jsx

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as Sakura from './trees/SakuraTree'
import * as Birch from './trees/BirchTree'
import * as Palm from './trees/PalmTree'
import * as Apple from './trees/AppleTree.jsx'
import * as Oak from './trees/OakTree'
import * as Cherry from './trees/CherryTree'
import * as Xmas from './trees/XmasTree'
import * as Neon from './trees/NeonTree'
import * as Crystal from './trees/CrystalTree'
import * as Maple from './trees/MapleTree'
import * as Willow from './trees/WillowTree'
import * as Coconut from './trees/CoconutTree'
import * as Mango from './trees/MangoTree'
import * as Orange from './trees/OrangeTree'
import * as Lemon from './trees/LemonTree'
import * as Cypress from './trees/CypressTree'
import * as Banyan from './trees/BanyanTree'
import * as Jacaranda from './trees/JacarandaTree'
import * as Fir from './trees/FirTree'
import * as Eucalyptus from './trees/EucalyptusTree'
import useT from '../../hooks/useT'

const STAGES = {
    sprout: { min: 0, max: 2,   label: 'Росток' },
    young:  { min: 3, max: 9,   label: 'Молодое дерево' },
    mature: { min: 10, max: 999, label: 'Взрослое дерево' },
}

const TREES = {
    sakura:     Sakura,
    birch:      Birch,
    palm:       Palm,
    apple:      Apple,
    oak:        Oak,
    cherry:     Cherry,
    xmas:       Xmas,
    neon:       Neon,
    crystal:    Crystal,
    maple:      Maple,
    willow:     Willow,
    coconut:    Coconut,
    mango:      Mango,
    orange:     Orange,
    lemon:      Lemon,
    cypress:    Cypress,
    banyan:     Banyan,
    jacaranda:  Jacaranda,
    fir:        Fir,
    eucalyptus: Eucalyptus,
}

// Скины деревьев доступны и снаружи (TreeThumb в магазине): там нужен
// только MatureSVG, без всей логики роста/тултипов TreeAvatar.
export const TREE_COMPONENTS = TREES

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
    oak: {
        sprout: ['🌱', '🍃'],
        young:  ['🍃', '🌿', '🌰'],
        mature: ['🍃', '🌿', '🌰', '🍂'],
    },
    cherry: {
        sprout: ['🌱', '🍃'],
        young:  ['🌸', '🌷', '🍃'],
        mature: ['🌸', '🌷', '💮', '🍃'],
    },
    xmas: {
        sprout: ['🌱', '🍃'],
        young:  ['🎄', '⭐', '🍃'],
        mature: ['🎄', '⭐', '🎁', '❄️'],
    },
    neon: {
        sprout: ['✨', '💫'],
        young:  ['✨', '💫', '⚡'],
        mature: ['✨', '💫', '⚡', '🌟', '💠'],
    },
    crystal: {
        sprout: ['💎', '✨'],
        young:  ['💎', '✨', '💠'],
        mature: ['💎', '✨', '💠', '🔮', '❄️'],
    },
    maple: {
        sprout: ['🌱', '🍂'],
        young:  ['🍁', '🍂', '🍃'],
        mature: ['🍁', '🍂', '🍃', '🌰'],
    },
    willow: {
        sprout: ['🌱', '🍃'],
        young:  ['🍃', '🌿'],
        mature: ['🍃', '🌿', '🍂'],
    },
    coconut: {
        sprout: ['🌱', '🍃'],
        young:  ['🌴', '🥥', '🍃'],
        mature: ['🌴', '🥥', '🥥', '🍃'],
    },
    mango: {
        sprout: ['🌱', '🍃'],
        young:  ['🥭', '🍃'],
        mature: ['🥭', '🥭', '🍃'],
    },
    orange: {
        sprout: ['🌱', '🍃'],
        young:  ['🍊', '🍃'],
        mature: ['🍊', '🍊', '🍃'],
    },
    lemon: {
        sprout: ['🌱', '🍃'],
        young:  ['🍋', '🍃'],
        mature: ['🍋', '🍋', '🍃'],
    },
    cypress: {
        sprout: ['🌱', '🍃'],
        young:  ['🌲', '🍃'],
        mature: ['🌲', '🌲', '🍃'],
    },
    banyan: {
        sprout: ['🌱', '🍃'],
        young:  ['🌳', '🍃'],
        mature: ['🌳', '🍃', '🍂'],
    },
    jacaranda: {
        sprout: ['🌱', '🍃'],
        young:  ['💜', '🌸', '🍃'],
        mature: ['💜', '🌸', '🌺', '🍃'],
    },
    fir: {
        sprout: ['🌱', '🍃'],
        young:  ['🌲', '🍃'],
        mature: ['🌲', '🍃', '❄️'],
    },
    eucalyptus: {
        sprout: ['🌱', '🍃'],
        young:  ['🌿', '🍃'],
        mature: ['🌿', '🍃', '🍂'],
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

// Компактный индикатор стадии (используется, если превью просит полосу).
// В попапе превью стадию показывает подпись под рисунком, поэтому там
// noStageBar=true и этот блок не рендерится.
function StageBar({ done, label }) {
    const accent = 'var(--accent, #4c9aff)'
    return (
        <div className="tree-stage-bar" style={{ width: '100%', maxWidth: 150 }}>
            <div className="tree-stage-bar__label">{label}</div>
            <div className="tree-stage-bar__track">
                <span style={{ width: `${Math.min(100, (done / 10) * 100)}%`, background: accent }}/>
            </div>
            <div className="tree-stage-bar__count">{done} / 10</div>
        </div>
    )
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
                                background: isFilled ? accent : 'rgba(127,127,127,0.18)',
                                filter: isFilled ? 'brightness(1.25) saturate(1.3)' : 'none',
                                boxShadow: isFilled ? `0 0 8px ${accent}, 0 0 14px ${accent}` : 'none',
                                borderRight: i < segments - 1 ? '1px solid var(--bg)' : 'none',
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

export default function TreeAvatar({
    done = 0,
    kind = 'apple',
    maxHeight = 400,
    demo = false,
    noStageBar = false,
    demoSize = 200,
}) {
    const t = useT()
    const stage = getStage(done)
    const progress = getProgress(done)
    const treeModule = TREES[kind] || TREES.apple

    const [grown, setGrown] = useState(false)
    const [bounce, setBounce] = useState(false)
    const [leaves, setLeaves] = useState([])
    const [tipOpen, setTipOpen] = useState(false)
    const [tipCoords, setTipCoords] = useState(null)

    const prevDoneRef = useRef(done)
    const prevKindRef = useRef(kind)
    const nextLeafId = useRef(0)

    // Растёт от нуля и «прыгает» при росте только настоящее дерево в сайдбаре;
    // в режиме demo (превью товара) оно статично.
    useEffect(() => {
        if (demo) {
            setGrown(true)
            return
        }
        const id = requestAnimationFrame(() => setGrown(true))
        return () => cancelAnimationFrame(id)
    }, [demo])

    useEffect(() => {
        if (demo) return
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
    }, [done, kind, demo])

    const handleTreeClick = useCallback(() => {
        if (stage !== 'mature') return

        const byKind = LEAVES_BY_KIND[kind] || LEAVES_BY_KIND.apple
        const pool = byKind[stage] || byKind.mature
        const count = 18

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

    // ============================================================
    // Тултип "?" — позиционируется через getBoundingClientRect,
    // рендерится через портал в document.body, поверх всего
    // ============================================================
    const handleTipEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTipCoords({
            top: rect.top + rect.height / 2,
            left: rect.right + 10,
        })
        setTipOpen(true)
    }

    const handleTipLeave = () => {
        setTipOpen(false)
        setTipCoords(null)
    }

    const handleTipClick = (e) => {
        e.stopPropagation()
        if (tipOpen) {
            handleTipLeave()
        } else {
            handleTipEnter(e)
        }
    }

    const cap = Math.min(maxHeight, Math.floor(window.innerHeight * 0.5))

    let size
    let box = size
    if (stage === 'sprout') {
        size = 40 + progress * 30
    } else if (stage === 'young') {
        size = 100 + progress * 80
    } else {
        size = 220 + progress * (cap - 220)
    }

    // В превью (demo) три стадии стоят рядом, и росток при сайдбарных размерах
    // выглядел бы пустым квадратом: нормализуем по высоте картинки, а рамку
    // держим общей, чтобы деревья «сидели» на одной линии земли.
    if (demo) {
        const share = stage === 'sprout' ? 0.42 : stage === 'young' ? 0.7 : 1
        box = demoSize
        size = Math.round(demoSize * share)
    }

    const Comp = stage === 'sprout'
        ? treeModule.SproutSVG
        : stage === 'young'
            ? treeModule.YoungSVG
            : treeModule.MatureSVG

    const scale = demo || grown ? 1 : 0.1

    return (
        <div className={`tree-avatar-wrap ${demo ? 'tree-avatar-wrap--demo' : ''}`}>

            {/* Кнопка «?» — при наведении/клике открывает тултип.
                В превью товара не нужна: там нет дневного прогресса. */}
            {!demo && (
                <div
                    className="tree-help"
                    onClick={handleTipClick}
                    onMouseEnter={handleTipEnter}
                    onMouseLeave={handleTipLeave}
                    role="button"
                    tabIndex={0}
                    aria-label="Что такое дерево прогресса"
                >
                    ?
                </div>
            )}

            <div
                className={`tree-avatar tree-avatar--${stage} ${bounce ? 'tree-avatar--bounce' : ''} ${demo ? 'tree-avatar--demo' : ''}`}
                style={{
                    width: demo ? box : size,
                    height: demo ? box : size,
                    transform: `scale(${scale})`,
                    opacity: demo || grown ? 1 : 0,
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
                    transformOrigin: 'bottom center',
                    cursor: stage === 'mature' ? 'pointer' : 'default',
                }}
                onClick={demo ? undefined : handleTreeClick}
                title={demo ? undefined : (stage === 'mature' ? 'Кликни — посыпятся листья' : undefined)}
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

            {demo
                ? (noStageBar ? null : <StageBar done={done} label="Взрослое дерево"/>)
                : <ProgressBar done={done} target={10} label={t.progressTree} />}

            {/* Тултип — рендерится через портал в document.body */}
            {!demo && tipOpen && tipCoords && createPortal(
                <div
                    className="tree-help__tip"
                    style={{
                        position: 'fixed',
                        top: tipCoords.top,
                        left: tipCoords.left,
                        transform: 'translateY(-50%)',
                        zIndex: 99999,
                        pointerEvents: 'none',
                    }}
                    role="tooltip"
                >
                    <div className="tree-help__tip-title">Дерево прогресса 🌱</div>
                    <div className="tree-help__tip-text">
                        Оно растёт, пока ты закрываешь задачи. Каждая выполненная
                        сегодня — новый росток.
                    </div>
                    <div className="tree-help__tip-text">
                        Выполни 10 — и дерево станет взрослым. Тогда можно{' '}
                        <b>кликнуть</b> по нему, и с него посыпятся листья ✨
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}