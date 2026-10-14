import { Aura, SparkleRing, seededRandom } from './common'

// Округлый яблоневый лист с прожилкой
function AppleLeaf({ cx, cy, r = 5, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#8fc55e', vein: '#5e8f36', edge: '#4a7a28' },
        mid:   { fill: '#5a9f3a', vein: '#3a7520', edge: '#2c5f18' },
        deep:  { fill: '#3f7a2a', vein: '#265418', edge: '#1c4610' },
    }
    const c = palette[tone] || palette.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx={r * 0.75} ry={r * 1.1}
                     fill={c.fill} stroke={c.edge} strokeWidth={r * 0.08}/>
            <line x1={cx} y1={cy - r * 0.9} x2={cx} y2={cy + r * 0.9}
                  stroke={c.vein} strokeWidth={r * 0.09} opacity="0.6"/>
            <line x1={cx} y1={cy - r * 0.3} x2={cx + r * 0.5} y2={cy - r * 0.5}
                  stroke={c.vein} strokeWidth={r * 0.06} opacity="0.45"/>
            <line x1={cx} y1={cy - r * 0.3} x2={cx - r * 0.5} y2={cy - r * 0.5}
                  stroke={c.vein} strokeWidth={r * 0.06} opacity="0.45"/>
        </g>
    )
}

// Крупное красное яблоко
function Apple({ cx, cy, r = 3.5 }) {
    return (
        <g>
            <ellipse cx={cx} cy={cy} rx={r * 1.1} ry={r} fill="#d0342c"/>
            <ellipse cx={cx + r * 0.2} cy={cy + r * 0.25} rx={r * 0.7} ry={r * 0.65} fill="#8a1a14" opacity="0.7"/>
            <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.35} ry={r * 0.25} fill="#f47b72" opacity="0.85"/>
            <circle cx={cx - r * 0.4} cy={cy - r * 0.5} r={r * 0.1} fill="#ffd9d4"/>
            {/* Хвостик с листиком */}
            <line x1={cx} y1={cy - r} x2={cx + r * 0.1} y2={cy - r * 1.4}
                  stroke="#4d3a2a" strokeWidth={r * 0.15} strokeLinecap="round"/>
            <path d={`M${cx + r * 0.1} ${cy - r * 1.3}
                     C${cx + r * 0.6} ${cy - r * 1.5} ${cx + r * 0.9} ${cy - r * 1.2} ${cx + r * 1} ${cy - r * 0.9}
                     C${cx + r * 0.6} ${cy - r * 0.85} ${cx + r * 0.3} ${cy - r * 0.9} ${cx + r * 0.1} ${cy - r * 1.3} Z`}
                  fill="#5a9f3a" stroke="#3a7520" strokeWidth={r * 0.06}/>
        </g>
    )
}

// ПЛОТНЫЙ кластер с двумя слоями листвы
function AppleCluster({ cx, cy, radius = 10, count = 16, seed = 0, withApple = true }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']

    // Основной слой — крупные листья по краю
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <AppleLeaf key={i} cx={lx} cy={ly}
                       r={3.2 + seededRandom(seed, i + 200) * 1.3}
                       rot={seededRandom(seed, i + 300) * 360}
                       tone={tones[i % tones.length]}/>
        )
    }

    // Второй плотный слой — мелкие листья в середине (заполняет просветы)
    const innerCount = Math.round(count * 0.6)
    for (let i = 0; i < innerCount; i++) {
        const a = seededRandom(seed, i + 1000) * Math.PI * 2
        const d = radius * (0.05 + seededRandom(seed, i + 1100) * 0.55)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <AppleLeaf key={`x${i}`} cx={lx} cy={ly}
                       r={2.6 + seededRandom(seed, i + 1200) * 1}
                       rot={seededRandom(seed, i + 1300) * 360}
                       tone={tones[i % tones.length]}/>
        )
    }

    // Яблоки
    if (withApple && seededRandom(seed, 400) > 0.4) {
        items.push(
            <Apple key="a1" cx={cx + radius * 0.3} cy={cy + radius * 0.3}
                   r={2.6 + seededRandom(seed, 500) * 1}/>
        )
    }
    if (withApple && seededRandom(seed, 600) > 0.65) {
        items.push(
            <Apple key="a2" cx={cx - radius * 0.4} cy={cy + radius * 0.2}
                   r={2.4 + seededRandom(seed, 700) * 0.8}/>
        )
    }
    return <g>{items}</g>
}

// РАСКИДИСТЫЙ ствол — раздваивается у земли
function AppleTrunk({ topY = 20 }) {
    return (
        <g>
            <path d={`M50 96 C47 86 48 76 50 66`}
                  stroke="#5c3a1e" strokeWidth="9" strokeLinecap="round" fill="none"/>
            <path d={`M50 66 C44 60 38 56 32 ${topY + 8}`}
                  stroke="#5c3a1e" strokeWidth="6.5" strokeLinecap="round" fill="none"/>
            <path d={`M50 66 C56 60 62 56 68 ${topY + 8}`}
                  stroke="#5c3a1e" strokeWidth="6.5" strokeLinecap="round" fill="none"/>
            <path d={`M50 66 C50 56 50 46 50 ${topY}`}
                  stroke="#5c3a1e" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
            <path d="M46 90 C44 82 45 74 47 68"
                  stroke="#7a5233" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75"/>
            <path d="M52 60 C54 54 54 48 53 42"
                  stroke="#7a5233" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
        </g>
    )
}

// Раскидистые ветки
function AppleBranches({ topY = 18 }) {
    return (
        <g stroke="#5c3a1e" strokeLinecap="round" fill="none">
            <path d={`M32 ${topY + 8} C22 ${topY + 6} 14 ${topY + 8} 8 ${topY + 14}`} strokeWidth="4"/>
            <path d={`M68 ${topY + 8} C78 ${topY + 6} 86 ${topY + 8} 92 ${topY + 14}`} strokeWidth="4"/>

            <path d={`M32 ${topY + 8} C28 ${topY - 2} 22 ${topY - 8} 16 ${topY - 10}`} strokeWidth="3"/>
            <path d={`M68 ${topY + 8} C72 ${topY - 2} 78 ${topY - 8} 84 ${topY - 10}`} strokeWidth="3"/>

            <path d={`M50 ${topY} C46 ${topY - 6} 42 ${topY - 12} 38 ${topY - 16}`} strokeWidth="3.5"/>
            <path d={`M50 ${topY} C54 ${topY - 6} 58 ${topY - 12} 62 ${topY - 16}`} strokeWidth="3.5"/>

            <path d={`M8 ${topY + 14} C4 ${topY + 18} 4 ${topY + 24} 6 ${topY + 28}`} strokeWidth="1.8"/>
            <path d={`M92 ${topY + 14} C96 ${topY + 18} 96 ${topY + 24} 94 ${topY + 28}`} strokeWidth="1.8"/>

            <path d={`M16 ${topY - 10} C12 ${topY - 14} 10 ${topY - 18} 12 ${topY - 22}`} strokeWidth="1.6"/>
            <path d={`M84 ${topY - 10} C88 ${topY - 14} 90 ${topY - 18} 88 ${topY - 22}`} strokeWidth="1.6"/>

            <path d={`M8 ${topY + 14} C6 ${topY + 6} 4 ${topY} 4 ${topY - 6}`} strokeWidth="1.4"/>
            <path d={`M92 ${topY + 14} C94 ${topY + 6} 96 ${topY} 96 ${topY - 6}`} strokeWidth="1.4"/>
        </g>
    )
}

function AppleGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="42" ry="4" fill="#6b8f3a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="32" ry="2.6" fill="#87ab4a" opacity="0.9"/>
            <path d="M18 95 L16 90 M22 95 L23 90 M26 95 L25 90"
                  stroke="#4e8a3a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <path d="M74 95 L75 90 M78 95 L80 90 M82 95 L81 90"
                  stroke="#4e8a3a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <Apple cx={22} cy={96} r={1.8}/>
            <Apple cx={78} cy={96} r={1.6}/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <AppleGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#5c3a1e" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#5c3a1e" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#5c3a1e" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <AppleCluster cx={36} cy={62} radius={7} seed={1} count={12}/>
            <AppleCluster cx={64} cy={58} radius={7} seed={2} count={12}/>
            <AppleCluster cx={50} cy={54} radius={8} seed={3} count={14}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <AppleGround />
            <AppleTrunk topY={28}/>
            <AppleBranches topY={28}/>

            <AppleCluster cx={10} cy={40} radius={8} seed={10} count={16}/>
            <AppleCluster cx={90} cy={40} radius={8} seed={11} count={16}/>
            <AppleCluster cx={16} cy={24} radius={8} seed={12} count={16}/>
            <AppleCluster cx={84} cy={24} radius={8} seed={13} count={16}/>
            <AppleCluster cx={28} cy={10} radius={8} seed={14} count={16}/>
            <AppleCluster cx={72} cy={10} radius={8} seed={15} count={16}/>
            <AppleCluster cx={50} cy={8} radius={9} seed={16} count={18}/>
            <AppleCluster cx={50} cy={24} radius={8} seed={17} count={16}/>
            <AppleCluster cx={50} cy={40} radius={8} seed={18} count={16}/>
            <AppleCluster cx={32} cy={36} radius={7} seed={19} count={14}/>
            <AppleCluster cx={68} cy={36} radius={7} seed={20} count={14}/>
            <AppleCluster cx={14} cy={52} radius={7} seed={21} count={14}/>
            <AppleCluster cx={86} cy={52} radius={7} seed={22} count={14}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="appleAura" color1="#f4b942" color2="#6fb03d" />
            <circle cx="50" cy="45" r="46" fill="url(#appleAura)" />
            <AppleGround />
            <AppleTrunk topY={14}/>
            <AppleBranches topY={14}/>

            {/* Плотная крона — 20 кластеров */}
            <AppleCluster cx={8} cy={22} radius={11} seed={100} count={20}/>
            <AppleCluster cx={92} cy={22} radius={11} seed={101} count={20}/>
            <AppleCluster cx={14} cy={8} radius={10} seed={102} count={18}/>
            <AppleCluster cx={86} cy={8} radius={10} seed={103} count={18}/>
            <AppleCluster cx={6} cy={38} radius={10} seed={104} count={18}/>
            <AppleCluster cx={94} cy={38} radius={10} seed={105} count={18}/>
            <AppleCluster cx={26} cy={-2} radius={9} seed={106} count={16}/>
            <AppleCluster cx={74} cy={-2} radius={9} seed={107} count={16}/>
            <AppleCluster cx={50} cy={-4} radius={10} seed={108} count={18}/>
            <AppleCluster cx={50} cy={14} radius={11} seed={109} count={20}/>
            <AppleCluster cx={50} cy={30} radius={11} seed={110} count={20}/>
            <AppleCluster cx={50} cy={46} radius={10} seed={111} count={18}/>
            <AppleCluster cx={28} cy={24} radius={10} seed={112} count={18}/>
            <AppleCluster cx={72} cy={24} radius={10} seed={113} count={18}/>
            <AppleCluster cx={32} cy={10} radius={9} seed={114} count={16}/>
            <AppleCluster cx={68} cy={10} radius={9} seed={115} count={16}/>
            <AppleCluster cx={20} cy={16} radius={9} seed={116} count={16}/>
            <AppleCluster cx={80} cy={16} radius={9} seed={117} count={16}/>
            <AppleCluster cx={10} cy={56} radius={9} seed={118} count={16}/>
            <AppleCluster cx={90} cy={56} radius={9} seed={119} count={16}/>

            <SparkleRing colorScheme="yellow" />
        </svg>
    )
}