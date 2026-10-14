import { Aura, SparkleRing, seededRandom } from './common'

function Needle({ cx, cy, len = 3, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#3d8a3a', edge: '#2a6a28' },
        mid:   { fill: '#1f5e1f', edge: '#134013' },
        deep:  { fill: '#0d3a0d', edge: '#082208' },
    }
    const c = palette[tone] || palette.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - len} L${cx + len * 0.4} ${cy + len * 0.3} L${cx - len * 0.4} ${cy + len * 0.3} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={0.2}/>
        </g>
    )
}

function NeedleCluster({ cx, cy, radius = 8, count = 24, seed = 0 }) {
    const needles = []
    const tones = ['light', 'mid', 'deep', 'mid', 'deep']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.1 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const nx = cx + Math.cos(a) * d
        const ny = cy + Math.sin(a) * d * 0.9
        needles.push(
            <Needle key={i} cx={nx} cy={ny}
                    len={2.2 + seededRandom(seed, i + 200) * 1}
                    rot={(a * 180 / Math.PI) + 180}
                    tone={tones[i % tones.length]}/>
        )
    }
    return <g>{needles}</g>
}

// Шар-игрушка
function Ornament({ cx, cy, r = 2.2, color = '#ff1744', lit = true }) {
    return (
        <g>
            {/* Свечение (если lit) */}
            {lit && (
                <circle cx={cx} cy={cy} r={r * 2.2} fill={color} opacity="0.25">
                    <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2.5s" repeatCount="indefinite"/>
                </circle>
            )}
            <circle cx={cx} cy={cy} r={r} fill={color}/>
            <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.35} fill="#ffffff" opacity="0.6"/>
        </g>
    )
}

// Гирлянда из точек
function Garland({ x1, y1, x2, y2, count = 6, seed = 0, lit = false }) {
    const colors = ['#ff1744', '#ffea00', '#00e676', '#29b6f6', '#ff9100', '#e040fb']
    const dots = []
    for (let i = 0; i <= count; i++) {
        const t = i / count
        const cx = x1 + (x2 - x1) * t
        const cy = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 2
        dots.push(
            <circle key={i} cx={cx} cy={cy} r={lit ? 1 : 0.7}
                    fill={colors[(i + seed) % colors.length]}
                    opacity={lit ? 1 : 0.7}>
                {lit && (
                    <animate attributeName="opacity"
                             values="0.6;1;0.6"
                             dur={`${1.5 + (i % 3) * 0.3}s`}
                             repeatCount="indefinite"/>
                )}
            </circle>
        )
    }
    return <g>{dots}</g>
}

// Звезда
function XmasStar({ cx, cy, r = 4, lit = false }) {
    const points = []
    for (let i = 0; i < 10; i++) {
        const a = (i * 36 - 90) * Math.PI / 180
        const rr = i % 2 === 0 ? r : r * 0.45
        points.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`)
    }
    return (
        <g>
            {/* Свечение вокруг звезды (только когда lit) */}
            {lit && (
                <circle cx={cx} cy={cy} r={r * 3.5} fill="#ffea00" opacity="0.2">
                    <animate attributeName="opacity" values="0.1;0.35;0.1" dur="2s" repeatCount="indefinite"/>
                </circle>
            )}
            <polygon points={points.join(' ')}
                     fill={lit ? '#ffea00' : '#c9b88a'}
                     stroke={lit ? '#ff8f00' : '#8a7a4a'}
                     strokeWidth="0.4"/>
            <circle cx={cx} cy={cy} r={r * 0.25}
                    fill={lit ? '#fff59d' : '#e8dca8'}/>
        </g>
    )
}

function XmasTrunk() {
    return (
        <path d="M48 96 L52 96 L51 86 L49 86 Z" fill="#5c3a1e"/>
    )
}

function XmasGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="40" ry="4" fill="#e8e8e8" opacity="0.9"/>
            <ellipse cx="50" cy="95" rx="30" ry="2.6" fill="#ffffff" opacity="0.95"/>
            <circle cx="20" cy="95" r="0.6" fill="#b3e5fc"/>
            <circle cx="35" cy="96" r="0.5" fill="#b3e5fc"/>
            <circle cx="65" cy="95" r="0.6" fill="#b3e5fc"/>
            <circle cx="80" cy="96" r="0.5" fill="#b3e5fc"/>
        </g>
    )
}

// ============================================================
// SPROUT — просто ёлочка, без украшений
// ============================================================
export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <XmasGround />
            <polygon points="50,55 40,75 60,75" fill="#1f5e1f" stroke="#0d3a0d" strokeWidth="0.4"/>
            <polygon points="50,62 38,82 62,82" fill="#2a6a28" stroke="#0d3a0d" strokeWidth="0.4"/>
            <XmasTrunk />
            {/* Украшений НЕТ */}
        </svg>
    )
}

// ============================================================
// YOUNG — взрослая ёлка + ПЕРВЫЕ игрушки (2-3 шара, без гирлянды)
// ============================================================
export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <XmasGround />
            <NeedleCluster cx={50} cy={40} radius={10} seed={1} count={20}/>
            <polygon points="50,25 30,55 70,55" fill="#1f5e1f" stroke="#0d3a0d" strokeWidth="0.5"/>
            <polygon points="50,40 26,72 74,72" fill="#2a6a28" stroke="#0d3a0d" strokeWidth="0.5"/>
            <polygon points="50,55 22,88 78,88" fill="#1f5e1f" stroke="#0d3a0d" strokeWidth="0.5"/>
            <XmasTrunk />

            {/* Только 2-3 игрушки — ПЕРВЫЕ */}
            <Ornament cx={44} cy={52} r={1.8} color="#ff1744" lit={false}/>
            <Ornament cx={56} cy={52} r={1.8} color="#ffea00" lit={false}/>
            <Ornament cx={50} cy={80} r={2} color="#29b6f6" lit={false}/>

            {/* Звезда не горит */}
            <XmasStar cx={50} cy={22} r={3.5} lit={false}/>
        </svg>
    )
}

// ============================================================
// MATURE — гирлянда горит + много игрушек + звезда горит
// ============================================================
export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="xmasAura" color1="#a8e6a3" color2="#2a6a28" />
            <circle cx="50" cy="45" r="46" fill="url(#xmasAura)" />
            <XmasGround />

            <polygon points="50,15 28,48 72,48" fill="#1f5e1f" stroke="#0d3a0d" strokeWidth="0.5"/>
            <polygon points="50,32 24,62 76,62" fill="#2a6a28" stroke="#0d3a0d" strokeWidth="0.5"/>
            <polygon points="50,48 20,78 80,78" fill="#1f5e1f" stroke="#0d3a0d" strokeWidth="0.5"/>
            <polygon points="50,62 16,92 84,92" fill="#2a6a28" stroke="#0d3a0d" strokeWidth="0.5"/>
            <XmasTrunk />

            <NeedleCluster cx={50} cy={20} radius={10} seed={100} count={30}/>
            <NeedleCluster cx={35} cy={35} radius={10} seed={101} count={28}/>
            <NeedleCluster cx={65} cy={35} radius={10} seed={102} count={28}/>
            <NeedleCluster cx={30} cy={55} radius={11} seed={103} count={30}/>
            <NeedleCluster cx={70} cy={55} radius={11} seed={104} count={30}/>
            <NeedleCluster cx={25} cy={75} radius={11} seed={105} count={30}/>
            <NeedleCluster cx={75} cy={75} radius={11} seed={106} count={30}/>
            <NeedleCluster cx={50} cy={55} radius={12} seed={107} count={32}/>
            <NeedleCluster cx={50} cy={75} radius={12} seed={108} count={32}/>
            <NeedleCluster cx={50} cy={88} radius={10} seed={109} count={24}/>

            {/* ГИРЛЯНДА ГОРИТ */}
            <Garland x1={30} y1={50} x2={70} y2={50} count={7} seed={1} lit/>
            <Garland x1={26} y1={65} x2={74} y2={65} count={8} seed={2} lit/>
            <Garland x1={22} y1={80} x2={78} y2={80} count={9} seed={3} lit/>
            <Garland x1={18} y1={90} x2={82} y2={90} count={10} seed={4} lit/>

            {/* МНОГО игрушек */}
            <Ornament cx={38} cy={48} r={2} color="#ff1744" lit/>
            <Ornament cx={62} cy={48} r={2} color="#ffea00" lit/>
            <Ornament cx={30} cy={62} r={2.2} color="#29b6f6" lit/>
            <Ornament cx={50} cy={58} r={2.3} color="#e040fb" lit/>
            <Ornament cx={70} cy={62} r={2.2} color="#ff9100" lit/>
            <Ornament cx={26} cy={78} r={2.3} color="#00e676" lit/>
            <Ornament cx={74} cy={78} r={2.3} color="#ff1744" lit/>
            <Ornament cx={50} cy={72} r={2.4} color="#ffea00" lit/>
            <Ornament cx={36} cy={88} r={2.4} color="#e040fb" lit/>
            <Ornament cx={64} cy={88} r={2.4} color="#29b6f6" lit/>
            <Ornament cx={42} cy={38} r={1.9} color="#00e676" lit/>
            <Ornament cx={58} cy={38} r={1.9} color="#ff9100" lit/>

            {/* ЗВЕЗДА ГОРИТ */}
            <XmasStar cx={50} cy={12} r={5} lit/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}