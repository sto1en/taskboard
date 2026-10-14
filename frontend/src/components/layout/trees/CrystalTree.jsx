// frontend/src/components/layout/trees/CrystalTree.jsx

import { Aura, SparkleRing, seededRandom } from './common'

// ============================================================
// ПАЛИТРА (на основе фото)
// ============================================================
const CRYSTAL_PALETTE = {
        light: { top: '#e6d9f5', left: '#c9b8e8', right: '#a995d1', edge: '#8a71b8', glow: '#d9c8f0' },
        mid:   { top: '#d0bff0', left: '#b8a2db', right: '#907ac0', edge: '#7059a8', glow: '#c0a8e8' },
        deep:  { top: '#b8a2db', left: '#9a83c4', right: '#7a62ad', edge: '#5a4290', glow: '#a890d0' },
        clear: { top: '#f0e6fa', left: '#e0d0f5', right: '#c0b0e0', edge: '#a090c0', glow: '#e8d8f8' },
        dark:  { top: '#8870b0', left: '#68509a', right: '#504080', edge: '#382860', glow: '#7058a0' },
}

// ============================================================
// БАЗОВЫЙ КРИСТАЛЛ (ромбовидный, многослойный)
// ============================================================
function CrystalGem({ cx, cy, size = 6, rot = 0, tone = 'mid', opacity = 1 }) {
        const c = CRYSTAL_PALETTE[tone] || CRYSTAL_PALETTE.mid
        const w = size * 0.5
        const h = size

        return (
            <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={opacity}>
                    {/* Мягкое свечение */}
                    <ellipse cx={cx} cy={cy} rx={w * 1.8} ry={h * 1.6}
                             fill={c.glow} opacity="0.25"/>
                    {/* Правая грань (тень) */}
                    <polygon
                        points={`${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx},${cy - h}`}
                        fill={c.right}
                        stroke={c.edge}
                        strokeWidth="0.2"
                    />
                    {/* Левая грань (свет) */}
                    <polygon
                        points={`${cx},${cy - h} ${cx - w},${cy} ${cx},${cy + h} ${cx},${cy - h}`}
                        fill={c.left}
                        stroke={c.edge}
                        strokeWidth="0.2"
                    />
                    {/* Верхняя светлая грань */}
                    <polygon
                        points={`${cx},${cy - h} ${cx + w * 0.5},${cy - h * 0.3} ${cx},${cy - h * 0.1} ${cx - w * 0.5},${cy - h * 0.3}`}
                        fill={c.top}
                        stroke={c.edge}
                        strokeWidth="0.15"
                    />
                    {/* Нижний тёмный кончик */}
                    <polygon
                        points={`${cx},${cy + h} ${cx + w * 0.35},${cy + h * 0.6} ${cx},${cy + h * 0.5} ${cx - w * 0.35},${cy + h * 0.6}`}
                        fill={c.right}
                        opacity="0.7"
                        stroke={c.edge}
                        strokeWidth="0.15"
                    />
                    {/* Блик */}
                    <polygon
                        points={`${cx - w * 0.3},${cy - h * 0.5} ${cx - w * 0.1},${cy - h * 0.2} ${cx - w * 0.3},${cy - h * 0.1} ${cx - w * 0.5},${cy - h * 0.3}`}
                        fill="#ffffff"
                        opacity="0.85"
                    />
            </g>
        )
}

// ============================================================
// КРИСТАЛЛИЧЕСКОЕ ОСНОВАНИЕ (как на фото)
// ============================================================
function CrystalBase() {
        const gems = []
        const count = 40
        const seed = 777

        for (let i = 0; i < count; i++) {
                const angle = seededRandom(seed, i) * Math.PI * 2
                const dist = 6 + seededRandom(seed, i + 100) * 26
                const cx = 50 + Math.cos(angle) * dist
                const cy = 96 - seededRandom(seed, i + 200) * 6
                const size = 4 + seededRandom(seed, i + 300) * 8
                const rot = (seededRandom(seed, i + 400) - 0.5) * 60
                const tones = ['light', 'mid', 'deep', 'clear', 'dark']
                const tone = tones[i % tones.length]

                gems.push(
                    <CrystalGem key={i} cx={cx} cy={cy} size={size} rot={rot} tone={tone} />
                )
        }
        return <g>{gems}</g>
}

// ============================================================
// СВИСАЮЩИЙ КРИСТАЛЛ (сосулька)
// ============================================================
function HangingCrystal({ x, y, length = 10, width = 2, tone = 'mid' }) {
        const c = CRYSTAL_PALETTE[tone] || CRYSTAL_PALETTE.mid
        const halfW = width / 2
        return (
            <g>
                    <polygon
                        points={`${x - halfW},${y} ${x + halfW},${y} ${x},${y + length}`}
                        fill={c.left}
                        stroke={c.edge}
                        strokeWidth="0.1"
                        opacity="0.9"
                    />
                    <polygon
                        points={`${x},${y} ${x + halfW},${y} ${x},${y + length}`}
                        fill={c.right}
                        stroke={c.edge}
                        strokeWidth="0.1"
                        opacity="0.9"
                    />
                    {/* Блик */}
                    <line x1={x - halfW * 0.3} y1={y + length * 0.2} x2={x - halfW * 0.1} y2={y + length * 0.8}
                          stroke="#fff" strokeWidth="0.3" opacity="0.6" />
            </g>
        )
}

// ============================================================
// ВЕТКА С СОСУЛЬКАМИ
// ============================================================
function BranchWithIcicles({ path, seed = 0, icicleCount = 5 }) {
        const items = []
        // Сама ветка (тонкая, светлая)
        items.push(
            <path key="branch" d={path} stroke="#d0c0e8" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        )

        // Сосульки вдоль ветки
        for (let i = 0; i < icicleCount; i++) {
                const t = (i + 1) / (icicleCount + 1)
                // Упрощенный расчет точки на кривой (для Q кривых)
                // Это приближение, но для визуального эффекта достаточно
                const approxX = 50 + (seededRandom(seed, i) - 0.5) * 30
                const approxY = 20 + seededRandom(seed, i + 100) * 40
                const length = 6 + seededRandom(seed, i + 200) * 14
                const width = 1 + seededRandom(seed, i + 300) * 1.5
                const tones = ['light', 'mid', 'clear']
                const tone = tones[i % tones.length]

                items.push(
                    <HangingCrystal key={i} x={approxX} y={approxY} length={length} width={width} tone={tone} />
                )
        }
        return <g>{items}</g>
}

// ============================================================
// МРАМОРНЫЙ СТВОЛ (светлый, как на фото)
// ============================================================
function MarbleTrunk() {
        return (
            <g>
                    {/* Основа ствола — светлая, полупрозрачная */}
                    <path d="M50 96
                     C42 88 40 78 44 68
                     C48 58 52 52 50 42
                     C48 34 44 26 46 18
                     L54 18
                     C52 26 56 34 54 42
                     C52 52 48 58 52 68
                     C56 78 58 88 56 96 Z"
                          fill="#e8e0f0"
                          stroke="#b8a8d0"
                          strokeWidth="0.4"/>
                    {/* Тени */}
                    <path d="M52 96
                     C50 88 50 80 52 72
                     C54 62 54 52 52 42
                     C50 34 50 26 50 18
                     L54 18
                     C52 26 56 34 54 42
                     C52 52 48 58 52 68
                     C56 78 58 88 56 96 Z"
                          fill="#c0b0d8"
                          opacity="0.55"/>
                    {/* Светлая сторона */}
                    <path d="M46 96
                     C42 86 42 78 46 68
                     C50 58 52 52 50 42
                     C48 34 46 26 47 18
                     L49 18
                     C48 26 50 34 52 42
                     C54 52 52 58 48 68
                     C44 78 46 86 48 96 Z"
                          fill="#f8f0ff"
                          opacity="0.7"/>
                    {/* Прожилки (фиолетовые) */}
                    <path d="M44 88 C42 82 44 76 46 72" stroke="#9a80b8" strokeWidth="0.5" fill="none" opacity="0.7"/>
                    <path d="M50 78 C48 72 50 66 52 60" stroke="#9a80b8" strokeWidth="0.5" fill="none" opacity="0.7"/>
                    <path d="M46 62 C44 56 46 50 48 46" stroke="#9a80b8" strokeWidth="0.5" fill="none" opacity="0.6"/>
                    <path d="M50 48 C48 42 48 36 48 32" stroke="#9a80b8" strokeWidth="0.4" fill="none" opacity="0.6"/>
                    <path d="M52 70 C54 64 54 58 52 52" stroke="#9a80b8" strokeWidth="0.4" fill="none" opacity="0.5"/>
            </g>
        )
}

// ============================================================
// ВЕТКИ (с сосульками)
// ============================================================
function BranchesWithIcicles() {
        const branches = [
                { path: "M46 62 C40 56 32 54 24 56", seed: 1, icicles: 4 },
                { path: "M54 60 C60 54 68 54 76 58", seed: 2, icicles: 4 },
                { path: "M46 46 C40 42 32 40 24 42", seed: 3, icicles: 3 },
                { path: "M54 44 C60 40 68 40 76 42", seed: 4, icicles: 3 },
                { path: "M48 32 C44 28 38 26 32 26", seed: 5, icicles: 3 },
                { path: "M52 30 C56 26 62 24 68 26", seed: 6, icicles: 3 },
                { path: "M50 22 C50 18 48 14 46 12", seed: 7, icicles: 2 },
                { path: "M24 56 C18 56 14 58 10 60", seed: 8, icicles: 2 },
                { path: "M76 58 C82 58 86 60 90 62", seed: 9, icicles: 2 },
                { path: "M24 42 C18 40 14 38 10 36", seed: 10, icicles: 2 },
                { path: "M76 42 C82 40 86 38 90 36", seed: 11, icicles: 2 },
                { path: "M32 26 C28 22 24 20 20 18", seed: 12, icicles: 2 },
                { path: "M68 26 C72 22 76 20 80 18", seed: 13, icicles: 2 },
        ]

        return (
            <g>
                    {branches.map((b, i) => (
                        <BranchWithIcicles key={i} path={b.path} seed={b.seed} icicleCount={b.icicles} />
                    ))}
            </g>
        )
}

// ============================================================
// КРОНА (кластеры кристаллов)
// ============================================================
function CrystalCrown() {
        const clusters = [
                // Верхние
                { cx: 50, cy: 6, r: 10, count: 12, seed: 100 },
                { cx: 40, cy: 10, r: 8, count: 10, seed: 101 },
                { cx: 60, cy: 10, r: 8, count: 10, seed: 102 },
                { cx: 30, cy: 18, r: 8, count: 10, seed: 103 },
                { cx: 70, cy: 18, r: 8, count: 10, seed: 104 },
                // Средние
                { cx: 20, cy: 30, r: 10, count: 12, seed: 105 },
                { cx: 80, cy: 30, r: 10, count: 12, seed: 106 },
                { cx: 14, cy: 44, r: 9, count: 10, seed: 107 },
                { cx: 86, cy: 44, r: 9, count: 10, seed: 108 },
                { cx: 50, cy: 30, r: 12, count: 14, seed: 109 },
                { cx: 35, cy: 38, r: 9, count: 10, seed: 110 },
                { cx: 65, cy: 38, r: 9, count: 10, seed: 111 },
                // Нижние
                { cx: 12, cy: 58, r: 8, count: 10, seed: 112 },
                { cx: 88, cy: 58, r: 8, count: 10, seed: 113 },
                { cx: 26, cy: 52, r: 9, count: 10, seed: 114 },
                { cx: 74, cy: 52, r: 9, count: 10, seed: 115 },
        ]

        return (
            <g>
                    {clusters.map((c, i) => {
                            const items = []
                            for (let j = 0; j < c.count; j++) {
                                    const angle = seededRandom(c.seed, j) * Math.PI * 2
                                    const dist = c.r * (0.1 + Math.sqrt(seededRandom(c.seed, j + 100)) * 0.9)
                                    const cx = c.cx + Math.cos(angle) * dist
                                    const cy = c.cy + Math.sin(angle) * dist * 0.85
                                    const size = 3 + seededRandom(c.seed, j + 200) * 4
                                    const rot = (seededRandom(c.seed, j + 300) - 0.5) * 60
                                    const tones = ['light', 'mid', 'deep', 'clear']
                                    const tone = tones[j % tones.length]

                                    items.push(
                                        <CrystalGem key={j} cx={cx} cy={cy} size={size} rot={rot} tone={tone} />
                                    )
                            }
                            return <g key={i}>{items}</g>
                    })}
            </g>
        )
}

// ============================================================
// SPROUT
// ============================================================
export function SproutSVG() {
        return (
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                    <CrystalBase />
                    {/* Тонкий мраморный росток */}
                    <path d="M50 94 C48 86 52 78 50 70 C48 64 50 58 50 54"
                          stroke="#e8e0f0" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M49 90 C48 84 51 78 50 72"
                          stroke="#b8a8d0" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
                    {/* Веточки */}
                    <path d="M50 78 C44 74 40 70 38 64" stroke="#e8e0f0" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    <path d="M50 74 C56 70 60 66 62 60" stroke="#e8e0f0" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    {/* Кристаллы на концах */}
                    <CrystalGem cx={38} cy={62} size={6} rot={-20} tone="mid"/>
                    <CrystalGem cx={62} cy={58} size={6} rot={25} tone="light"/>
                    <CrystalGem cx={50} cy={50} size={7} rot={0} tone="mid"/>
                    {/* Мелкие кристаллы */}
                    <CrystalGem cx={44} cy={70} size={3} rot={-10} tone="light"/>
                    <CrystalGem cx={56} cy={68} size={3.2} rot={15} tone="mid"/>
            </svg>
        )
}

// ============================================================
// YOUNG
// ============================================================
export function YoungSVG() {
        return (
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                    <CrystalBase />
                    <MarbleTrunk />
                    <BranchesWithIcicles />

                    {/* Кристаллы на ветках */}
                    <CrystalGem cx={10} cy={58} size={7} rot={-25} tone="mid"/>
                    <CrystalGem cx={90} cy={60} size={7} rot={25} tone="light"/>
                    <CrystalGem cx={14} cy={46} size={6} rot={-15} tone="deep"/>
                    <CrystalGem cx={88} cy={48} size={6} rot={15} tone="mid"/>
                    <CrystalGem cx={10} cy={34} size={6} rot={-20} tone="mid"/>
                    <CrystalGem cx={90} cy={34} size={6} rot={20} tone="light"/>
                    <CrystalGem cx={20} cy={16} size={5} rot={-25} tone="light"/>
                    <CrystalGem cx={80} cy={16} size={5} rot={25} tone="mid"/>
                    <CrystalGem cx={32} cy={24} size={6} rot={-10} tone="mid"/>
                    <CrystalGem cx={68} cy={24} size={6} rot={10} tone="light"/>
                    <CrystalGem cx={46} cy={10} size={6} rot={0} tone="deep"/>
            </svg>
        )
}

// ============================================================
// MATURE (как на фото)
// ============================================================
export function MatureSVG() {
        return (
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                    <Aura id="crystalAura" color1="#d9c8f0" color2="#a995d1" />
                    <circle cx="50" cy="45" r="46" fill="url(#crystalAura)" />

                    <CrystalBase />
                    <MarbleTrunk />
                    <BranchesWithIcicles />
                    <CrystalCrown />

                    <SparkleRing colorScheme="green" />
            </svg>
        )
}