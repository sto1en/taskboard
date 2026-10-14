import { Aura, SparkleRing, seededRandom } from './common'

const WILLOW_TONES = {
    light: { fill: '#a8d97b', vein: '#7ab048', edge: '#5c8f3a' },
    mid:   { fill: '#6fb03d', vein: '#4a8a24', edge: '#3f7a2a' },
    deep:  { fill: '#4e8a3a', vein: '#2f6b22', edge: '#255c1a' },
}

// Длинный узкий лист ивы (ланцетовидный)
function WillowLeaf({ cx, cy, size = 4, rot = 0, tone = 'mid' }) {
    const c = WILLOW_TONES[tone] || WILLOW_TONES.mid
    const s = size
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - s * 2.2}
                     C${cx + s * 0.5} ${cy - s * 1.2} ${cx + s * 0.6} ${cy + s * 0.4} ${cx} ${cy + s * 2.2}
                     C${cx - s * 0.6} ${cy + s * 0.4} ${cx - s * 0.5} ${cy - s * 1.2} ${cx} ${cy - s * 2.2} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={s * 0.08}/>
            <line x1={cx} y1={cy - s * 1.8} x2={cx} y2={cy + s * 1.8}
                  stroke={c.vein} strokeWidth={s * 0.08} opacity="0.6"/>
        </g>
    )
}

// Свисающая ветка — цепочка листьев вдоль ниспадающей линии
function DroopingBranch({ x1, y1, x2, y2, leafCount = 8, seed = 0 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']

    // Невидимая нить (стебель) — тонкая линия
    items.push(
        <path key="stem" d={`M${x1} ${y1} Q${(x1 + x2) / 2 + (seededRandom(seed, 999) - 0.5) * 4} ${(y1 + y2) / 2} ${x2} ${y2}`}
              stroke="#5c8f3a" strokeWidth="0.5" fill="none" opacity="0.6"/>
    )

    // Листья вдоль ветки
    for (let i = 0; i < leafCount; i++) {
        const t = (i + 1) / (leafCount + 1)
        const px = x1 + (x2 - x1) * t
        const py = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 1.5
        const leafRot = 90 + (seededRandom(seed, i) - 0.5) * 40
        items.push(
            <WillowLeaf key={i} cx={px} cy={py}
                        size={2 + seededRandom(seed, i + 100) * 0.8}
                        rot={leafRot}
                        tone={tones[i % tones.length]}/>
        )
    }
    return <g>{items}</g>
}

// Кластер — пучок свисающих веток
function WillowCascade({ cx, cy, length = 20, count = 5, seed = 0 }) {
    const branches = []
    for (let i = 0; i < count; i++) {
        const spreadX = (seededRandom(seed, i) - 0.5) * 12
        const len = length * (0.7 + seededRandom(seed, i + 50) * 0.6)
        branches.push(
            <DroopingBranch key={i}
                            x1={cx + spreadX * 0.3} y1={cy}
                            x2={cx + spreadX} y2={cy + len}
                            leafCount={6 + Math.floor(seededRandom(seed, i + 100) * 4)}
                            seed={seed + i * 10}/>
        )
    }
    return <g>{branches}</g>
}

// Толстый изогнутый ствол — плакучая форма
function WillowTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C48 86 54 74 50 60 C46 48 54 38 50 ${topY}`}
                  stroke="#4a3a2a" strokeWidth="8" strokeLinecap="round" fill="none"/>
            <path d="M47 90 C46 80 51 70 48 58"
                  stroke="#6b5340" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M53 76 C52 66 55 58 52 50"
                  stroke="#2f1d14" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
            {/* Кора */}
            <path d="M45 82 C44 76 47 70 49 66" stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M52 60 C51 54 53 48 51 42" stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
        </g>
    )
}

// Верхние прямые ветки, от которых свисают каскады
function WillowBranches({ topY = 18 }) {
    return (
        <g stroke="#4a3a2a" strokeLinecap="round" fill="none">
            {/* Раздваивающиеся верхние ветки */}
            <path d={`M50 ${topY + 4} C42 ${topY - 2} 32 ${topY} 22 ${topY + 6}`} strokeWidth="3.4"/>
            <path d={`M50 ${topY + 4} C58 ${topY - 2} 68 ${topY} 78 ${topY + 6}`} strokeWidth="3.4"/>

            <path d={`M22 ${topY + 6} C16 ${topY + 4} 10 ${topY + 4} 4 ${topY + 8}`} strokeWidth="2.4"/>
            <path d={`M78 ${topY + 6} C84 ${topY + 4} 90 ${topY + 4} 96 ${topY + 8}`} strokeWidth="2.4"/>

            <path d={`M50 ${topY + 12} C42 ${topY + 8} 32 ${topY + 8} 22 ${topY + 14}`} strokeWidth="3"/>
            <path d={`M50 ${topY + 12} C58 ${topY + 8} 68 ${topY + 8} 78 ${topY + 14}`} strokeWidth="3"/>

            <path d={`M22 ${topY + 14} C14 ${topY + 14} 8 ${topY + 16} 2 ${topY + 20}`} strokeWidth="2"/>
            <path d={`M78 ${topY + 14} C86 ${topY + 14} 92 ${topY + 16} 98 ${topY + 20}`} strokeWidth="2"/>

            {/* Тонкие ветки */}
            <path d={`M4 ${topY + 8} C2 ${topY + 12} 2 ${topY + 18} 4 ${topY + 22}`} strokeWidth="1.4"/>
            <path d={`M96 ${topY + 8} C98 ${topY + 12} 98 ${topY + 18} 96 ${topY + 22}`} strokeWidth="1.4"/>

            <path d={`M50 ${topY} C48 ${topY - 4} 46 ${topY - 6} 44 ${topY - 8}`} strokeWidth="1.6"/>
            <path d={`M50 ${topY} C52 ${topY - 4} 54 ${topY - 6} 56 ${topY - 8}`} strokeWidth="1.6"/>
        </g>
    )
}

function WillowGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="42" ry="4.5" fill="#7a6b52" opacity="0.8"/>
            <ellipse cx="50" cy="95" rx="32" ry="2.8" fill="#9a8a6a" opacity="0.85"/>
            <path d="M18 95 L16 90 M22 95 L23 90 M26 95 L25 90"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M74 95 L75 90 M78 95 L80 90 M82 95 L81 90"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <WillowGround />
            <path d="M50 94 C49 82 51 72 50 60" stroke="#4a3a2a" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C44 74 40 72 36 70" stroke="#4a3a2a" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 72 C56 70 60 68 64 66" stroke="#4a3a2a" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <WillowCascade cx={36} cy={70} length={14} count={3} seed={1}/>
            <WillowCascade cx={64} cy={66} length={14} count={3} seed={2}/>
            <WillowCascade cx={50} cy={60} length={16} count={4} seed={3}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <WillowGround />
            <WillowTrunk topY={30}/>
            <WillowBranches topY={30}/>

            {/* Каскады по веткам */}
            <WillowCascade cx={22} cy={36} length={22} count={4} seed={10}/>
            <WillowCascade cx={78} cy={36} length={22} count={4} seed={11}/>
            <WillowCascade cx={4} cy={38} length={20} count={3} seed={12}/>
            <WillowCascade cx={96} cy={38} length={20} count={3} seed={13}/>
            <WillowCascade cx={2} cy={52} length={18} count={3} seed={14}/>
            <WillowCascade cx={98} cy={52} length={18} count={3} seed={15}/>
            <WillowCascade cx={50} cy={34} length={24} count={5} seed={16}/>
            <WillowCascade cx={34} cy={32} length={20} count={4} seed={17}/>
            <WillowCascade cx={66} cy={32} length={20} count={4} seed={18}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="willowAura" color1="#a8d97b" color2="#4e8a3a" />
            <circle cx="50" cy="45" r="48" fill="url(#willowAura)" />
            <WillowGround />
            <WillowTrunk topY={14}/>
            <WillowBranches topY={14}/>

            {/* Много каскадов — плакучая ива */}
            <WillowCascade cx={22} cy={20} length={30} count={5} seed={100}/>
            <WillowCascade cx={78} cy={20} length={30} count={5} seed={101}/>
            <WillowCascade cx={4} cy={22} length={28} count={4} seed={102}/>
            <WillowCascade cx={96} cy={22} length={28} count={4} seed={103}/>
            <WillowCascade cx={2} cy={36} length={26} count={4} seed={104}/>
            <WillowCascade cx={98} cy={36} length={26} count={4} seed={105}/>
            <WillowCascade cx={14} cy={20} length={32} count={5} seed={106}/>
            <WillowCascade cx={86} cy={20} length={32} count={5} seed={107}/>

            <WillowCascade cx={50} cy={18} length={34} count={6} seed={108}/>
            <WillowCascade cx={34} cy={18} length={30} count={5} seed={109}/>
            <WillowCascade cx={66} cy={18} length={30} count={5} seed={110}/>
            <WillowCascade cx={28} cy={30} length={28} count={4} seed={111}/>
            <WillowCascade cx={72} cy={30} length={28} count={4} seed={112}/>
            <WillowCascade cx={10} cy={52} length={24} count={4} seed={113}/>
            <WillowCascade cx={90} cy={52} length={24} count={4} seed={114}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}