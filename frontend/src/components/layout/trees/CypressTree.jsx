import { Aura, SparkleRing, seededRandom } from './common'

// Мелкие плотные иглы (треугольники)
function CypressNeedle({ cx, cy, len = 2.5, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#4a7a2a', edge: '#2f5a18' },
        mid:   { fill: '#2f5a18', edge: '#1c3c0c' },
        deep:  { fill: '#1f4a10', edge: '#0f2f06' },
    }
    const c = palette[tone] || palette.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - len} L${cx + len * 0.4} ${cy + len * 0.4} L${cx - len * 0.4} ${cy + len * 0.4} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth="0.2"/>
        </g>
    )
}

// Кластер игл — плотная тёмная масса
function CypressCluster({ cx, cy, radius = 6, count = 20, seed = 0 }) {
    const needles = []
    const tones = ['light', 'mid', 'deep', 'mid', 'deep', 'mid']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.1 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const nx = cx + Math.cos(a) * d
        const ny = cy + Math.sin(a) * d * 0.9
        needles.push(
            <CypressNeedle key={i} cx={nx} cy={ny}
                           len={1.8 + seededRandom(seed, i + 200) * 0.8}
                           rot={seededRandom(seed, i + 300) * 360}
                           tone={tones[i % tones.length]}/>
        )
    }
    return <g>{needles}</g>
}

// Прямой тонкий ствол
function CypressTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 L50 ${topY}`}
                  stroke="#4a3018" strokeWidth="3.6" strokeLinecap="round" fill="none"/>
            <path d={`M48.5 96 L48.5 ${topY + 2}`}
                  stroke="#6b4a2b" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.7"/>
            {/* Полоски */}
            {[88, 78, 68, 58, 48, 38, 28].filter(y => y > topY).map((y, i) => (
                <line key={i} x1={49 + (i % 2) * 0.5} y1={y}
                      x2={50 + (i % 2) * 0.5} y2={y + 1}
                      stroke="#2a1a08" strokeWidth="0.5" strokeLinecap="round" opacity="0.6"/>
            ))}
        </g>
    )
}

function CypressGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="32" ry="3.5" fill="#6b5a3a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="22" ry="2.2" fill="#8a7550" opacity="0.9"/>
            <path d="M34 96 L33 92 M38 96 L39 91 M42 96 L41 92"
                  stroke="#5c8f4a" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
            <path d="M58 96 L59 91 M62 96 L64 92 M66 96 L65 91"
                  stroke="#5c8f4a" strokeWidth="0.6" strokeLinecap="round" fill="none"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CypressGround />
            <path d="M50 94 L50 62" stroke="#4a3018" strokeWidth="2" strokeLinecap="round" fill="none"/>
            {/* Маленький конус из игл */}
            <CypressCluster cx={50} cy={72} radius={7} seed={1} count={16}/>
            <CypressCluster cx={50} cy={62} radius={6} seed={2} count={14}/>
            <CypressCluster cx={50} cy={54} radius={5} seed={3} count={10}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <CypressGround />
            <CypressTrunk topY={28}/>
            {/* Узкая колонна из игл */}
            <CypressCluster cx={50} cy={80} radius={8} seed={10} count={18}/>
            <CypressCluster cx={50} cy={72} radius={8} seed={11} count={18}/>
            <CypressCluster cx={50} cy={64} radius={7} seed={12} count={16}/>
            <CypressCluster cx={50} cy={56} radius={7} seed={13} count={16}/>
            <CypressCluster cx={50} cy={48} radius={6} seed={14} count={14}/>
            <CypressCluster cx={50} cy={40} radius={5} seed={15} count={12}/>
            <CypressCluster cx={50} cy={34} radius={4} seed={16} count={10}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="cypressAura" color1="#4a7a2a" color2="#1c3c0c" />
            <circle cx="50" cy="45" r="40" fill="url(#cypressAura)" />
            <CypressGround />
            <CypressTrunk topY={10}/>

            {/* Высокая узкая колонна — 14 кластеров вверх */}
            <CypressCluster cx={50} cy={90} radius={9}  seed={100} count={20}/>
            <CypressCluster cx={50} cy={82} radius={9}  seed={101} count={20}/>
            <CypressCluster cx={50} cy={74} radius={9}  seed={102} count={20}/>
            <CypressCluster cx={50} cy={66} radius={8}  seed={103} count={18}/>
            <CypressCluster cx={50} cy={58} radius={8}  seed={104} count={18}/>
            <CypressCluster cx={50} cy={50} radius={8}  seed={105} count={18}/>
            <CypressCluster cx={50} cy={42} radius={7}  seed={106} count={16}/>
            <CypressCluster cx={50} cy={34} radius={7}  seed={107} count={16}/>
            <CypressCluster cx={50} cy={26} radius={6}  seed={108} count={14}/>
            <CypressCluster cx={50} cy={18} radius={5}  seed={109} count={12}/>
            <CypressCluster cx={50} cy={10} radius={4}  seed={110} count={10}/>

            {/* Пара тонких боковых побегов у основания */}
            <CypressCluster cx={40} cy={88} radius={4}  seed={111} count={8}/>
            <CypressCluster cx={60} cy={88} radius={4}  seed={112} count={8}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}