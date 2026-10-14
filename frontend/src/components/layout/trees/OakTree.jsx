import { Aura, SparkleRing, seededRandom } from './common'

function OakLeaf({ cx, cy, r = 5, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#a8c66c', vein: '#7a9c40', edge: '#6a8c30' },
        mid:   { fill: '#6b9b3c', vein: '#4a7028', edge: '#3a5a1e' },
        deep:  { fill: '#4a7028', vein: '#2f4d18', edge: '#243c10' },
    }
    const c = palette[tone] || palette.mid
    const d = `M${cx} ${cy - r * 1.4}
        C${cx + r * 0.4} ${cy - r * 1.5} ${cx + r * 0.8} ${cy - r * 1.2} ${cx + r * 0.7} ${cy - r * 0.8}
        C${cx + r * 1.2} ${cy - r * 0.7} ${cx + r * 1.3} ${cy - r * 0.2} ${cx + r * 0.9} ${cy + r * 0.2}
        C${cx + r * 1.2} ${cy + r * 0.6} ${cx + r * 0.9} ${cy + r * 1.1} ${cx + r * 0.4} ${cy + r * 1.1}
        C${cx + r * 0.1} ${cy + r * 1.5} ${cx - r * 0.1} ${cy + r * 1.5} ${cx - r * 0.4} ${cy + r * 1.1}
        C${cx - r * 0.9} ${cy + r * 1.1} ${cx - r * 1.2} ${cy + r * 0.6} ${cx - r * 0.9} ${cy + r * 0.2}
        C${cx - r * 1.3} ${cy - r * 0.2} ${cx - r * 1.2} ${cy - r * 0.7} ${cx - r * 0.7} ${cy - r * 0.8}
        C${cx - r * 0.8} ${cy - r * 1.2} ${cx - r * 0.4} ${cy - r * 1.5} ${cx} ${cy - r * 1.4} Z`
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={d} fill={c.fill} stroke={c.edge} strokeWidth={r * 0.08}/>
            <line x1={cx} y1={cy - r * 1.1} x2={cx} y2={cy + r * 1.1}
                  stroke={c.vein} strokeWidth={r * 0.1} opacity="0.7"/>
            <line x1={cx} y1={cy - r * 0.3} x2={cx + r * 0.6} y2={cy - r * 0.5}
                  stroke={c.vein} strokeWidth={r * 0.07} opacity="0.55"/>
            <line x1={cx} y1={cy - r * 0.3} x2={cx - r * 0.6} y2={cy - r * 0.5}
                  stroke={c.vein} strokeWidth={r * 0.07} opacity="0.55"/>
        </g>
    )
}

function Acorn({ cx, cy, r = 3 }) {
    return (
        <g>
            <ellipse cx={cx} cy={cy + r * 0.4} rx={r * 0.9} ry={r * 1.1} fill="#b8843c"/>
            <ellipse cx={cx} cy={cy - r * 0.3} rx={r * 1.1} ry={r * 0.7} fill="#7a5228"/>
            <line x1={cx} y1={cy - r * 1} x2={cx} y2={cy - r * 1.4}
                  stroke="#4a2f18" strokeWidth={r * 0.2} strokeLinecap="round"/>
        </g>
    )
}

function OakCluster({ cx, cy, radius = 10, count = 18, seed = 0 }) {
    const leaves = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        leaves.push(
            <OakLeaf key={i} cx={lx} cy={ly}
                     r={3.2 + seededRandom(seed, i + 200) * 1.2}
                     rot={seededRandom(seed, i + 300) * 360}
                     tone={tones[i % tones.length]}/>
        )
    }
    if (seededRandom(seed, 500) > 0.6) {
        leaves.push(<Acorn key="ac1" cx={cx + radius * 0.3} cy={cy + radius * 0.5} r={2.4}/>)
    }
    if (seededRandom(seed, 600) > 0.75) {
        leaves.push(<Acorn key="ac2" cx={cx - radius * 0.4} cy={cy + radius * 0.3} r={2.2}/>)
    }
    return <g>{leaves}</g>
}

// ТОЛСТЫЙ МАССИВНЫЙ ствол — фишка дуба
function OakTrunk({ topY = 20 }) {
    const marks = []
    for (let i = 0; i < 10; i++) {
        const y = 90 - i * 8
        const side = i % 2 === 0 ? -1.5 : 1.5
        marks.push(
            <ellipse key={i} cx={50 + side} cy={y} rx={1.2} ry={0.5}
                     fill="#2f1d14" opacity="0.75"/>
        )
    }
    return (
        <g>
            {/* Основной ствол — ТОЛСТЫЙ, массивный, чуть расширяется к земле */}
            <path d={`M50 96 C46 88 48 76 50 64 C52 50 50 36 50 ${topY}`}
                  stroke="#3a2412" strokeWidth="14" strokeLinecap="round" fill="none"/>
            {/* Светлая сторона */}
            <path d={`M45 92 C42 82 44 72 46 62 C48 50 46 38 46 ${topY + 2}`}
                  stroke="#5c3a1e" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75"/>
            {/* Тёмная сторона */}
            <path d={`M56 90 C57 80 55 70 54 60 C53 48 54 36 54 ${topY + 2}`}
                  stroke="#1f1208" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
            {/* Трещины коры */}
            {[88, 78, 68, 58, 48, 38, 28].filter(y => y > topY).map((y, i) => (
                <ellipse key={`b${i}`} cx={50 + ((i % 2 === 0) ? -3 : 3)} cy={y}
                         rx={1.4} ry={0.6}
                         fill="#1f1208" opacity="0.6"/>
            ))}
            {marks}
        </g>
    )
}

// Массивные кривые ветки
function OakBranches({ topY = 18 }) {
    return (
        <g stroke="#3a2412" strokeLinecap="round" fill="none">
            {/* Главные ветки — толстые, кривые */}
            <path d={`M50 ${topY + 20} C40 ${topY + 14} 30 ${topY + 10} 18 ${topY + 16}`} strokeWidth="5"/>
            <path d={`M50 ${topY + 20} C60 ${topY + 14} 70 ${topY + 10} 82 ${topY + 16}`} strokeWidth="5"/>

            <path d={`M50 ${topY + 8} C42 ${topY + 2} 32 ${topY - 2} 22 ${topY + 4}`} strokeWidth="4"/>
            <path d={`M50 ${topY + 8} C58 ${topY + 2} 68 ${topY - 2} 78 ${topY + 4}`} strokeWidth="4"/>

            <path d={`M50 ${topY + 32} C38 ${topY + 28} 24 ${topY + 28} 12 ${topY + 36}`} strokeWidth="4"/>
            <path d={`M50 ${topY + 32} C62 ${topY + 28} 76 ${topY + 28} 88 ${topY + 36}`} strokeWidth="4"/>

            {/* Мелкие веточки */}
            <path d={`M18 ${topY + 16} C12 ${topY + 12} 6 ${topY + 14} 4 ${topY + 22}`} strokeWidth="2.5"/>
            <path d={`M82 ${topY + 16} C88 ${topY + 12} 94 ${topY + 14} 96 ${topY + 22}`} strokeWidth="2.5"/>

            <path d={`M22 ${topY + 4} C18 ${topY - 2} 14 ${topY - 6} 12 ${topY - 2}`} strokeWidth="2"/>
            <path d={`M78 ${topY + 4} C82 ${topY - 2} 86 ${topY - 6} 88 ${topY - 2}`} strokeWidth="2"/>

            <path d={`M12 ${topY + 36} C8 ${topY + 42} 8 ${topY + 50} 12 ${topY + 58}`} strokeWidth="2"/>
            <path d={`M88 ${topY + 36} C92 ${topY + 42} 92 ${topY + 50} 88 ${topY + 58}`} strokeWidth="2"/>
        </g>
    )
}

function OakGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="44" ry="4.5" fill="#4a6b2a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="34" ry="3" fill="#6b8f3a" opacity="0.9"/>
            {/* Мощные корни */}
            <path d="M40 95 C36 94 32 94 28 96" stroke="#3a2412" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M60 95 C64 94 68 94 72 96" stroke="#3a2412" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M42 96 C38 96 34 97 30 98" stroke="#3a2412" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M58 96 C62 96 66 97 70 98" stroke="#3a2412" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M18 95 L16 90 M24 95 L25 89 M30 95 L29 90"
                  stroke="#4e8a3a" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
            <path d="M70 95 L71 89 M76 95 L78 90 M82 95 L81 90"
                  stroke="#4e8a3a" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <OakGround />
            {/* Толстый росток */}
            <path d="M50 94 C48 84 52 74 50 62" stroke="#3a2412" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M50 82 C42 76 38 70 36 64" stroke="#3a2412" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 78 C58 72 62 66 64 60" stroke="#3a2412" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <OakCluster cx={36} cy={62} radius={7} seed={1} count={12}/>
            <OakCluster cx={64} cy={58} radius={7} seed={2} count={12}/>
            <OakCluster cx={50} cy={54} radius={8} seed={3} count={14}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <OakGround />
            <OakTrunk topY={30}/>
            <OakBranches topY={30}/>

            <OakCluster cx={18} cy={46} radius={10} seed={10} count={16}/>
            <OakCluster cx={82} cy={46} radius={10} seed={11} count={16}/>
            <OakCluster cx={22} cy={32} radius={10} seed={12} count={16}/>
            <OakCluster cx={78} cy={32} radius={10} seed={13} count={16}/>
            <OakCluster cx={30} cy={20} radius={9} seed={14} count={14}/>
            <OakCluster cx={70} cy={20} radius={9} seed={15} count={14}/>
            <OakCluster cx={50} cy={16} radius={10} seed={16} count={16}/>
            <OakCluster cx={12} cy={58} radius={8} seed={17} count={12}/>
            <OakCluster cx={88} cy={58} radius={8} seed={18} count={12}/>
            <OakCluster cx={50} cy={40} radius={9} seed={19} count={14}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="oakAura" color1="#a8c66c" color2="#4a6b2a" />
            <circle cx="50" cy="45" r="46" fill="url(#oakAura)" />
            <OakGround />
            <OakTrunk topY={14}/>
            <OakBranches topY={14}/>

            <OakCluster cx={18} cy={30} radius={12} seed={100} count={22}/>
            <OakCluster cx={82} cy={30} radius={12} seed={101} count={22}/>
            <OakCluster cx={12} cy={46} radius={12} seed={102} count={22}/>
            <OakCluster cx={88} cy={46} radius={12} seed={103} count={22}/>
            <OakCluster cx={22} cy={16} radius={11} seed={104} count={20}/>
            <OakCluster cx={78} cy={16} radius={11} seed={105} count={20}/>
            <OakCluster cx={10} cy={62} radius={10} seed={106} count={18}/>
            <OakCluster cx={90} cy={62} radius={10} seed={107} count={18}/>
            <OakCluster cx={30} cy={8} radius={10} seed={108} count={18}/>
            <OakCluster cx={70} cy={8} radius={10} seed={109} count={18}/>
            <OakCluster cx={50} cy={6} radius={11} seed={110} count={20}/>
            <OakCluster cx={50} cy={22} radius={12} seed={111} count={22}/>
            <OakCluster cx={50} cy={38} radius={12} seed={112} count={22}/>
            <OakCluster cx={50} cy={52} radius={10} seed={113} count={18}/>
            <OakCluster cx={22} cy={54} radius={10} seed={114} count={18}/>
            <OakCluster cx={78} cy={54} radius={10} seed={115} count={18}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}