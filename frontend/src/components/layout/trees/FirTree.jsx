import { Aura, SparkleRing, seededRandom } from './common'

function FirNeedle({ cx, cy, len = 3, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#2f6b2a', edge: '#1f4a1c' },
        mid:   { fill: '#1c4a18', edge: '#0f2f0e' },
        deep:  { fill: '#0f2f0e', edge: '#061806' },
    }
    const c = palette[tone] || palette.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <path d={`M${cx} ${cy - len} L${cx + len * 0.4} ${cy + len * 0.4} L${cx - len * 0.4} ${cy + len * 0.4} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth="0.2"/>
        </g>
    )
}

function FirCluster({ cx, cy, radius = 8, count = 24, seed = 0 }) {
    const needles = []
    const tones = ['light', 'mid', 'deep', 'mid', 'deep']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.1 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const nx = cx + Math.cos(a) * d
        const ny = cy + Math.sin(a) * d * 0.9
        needles.push(
            <FirNeedle key={i} cx={nx} cy={ny}
                       len={2 + seededRandom(seed, i + 200) * 0.9}
                       rot={(a * 180 / Math.PI) + 180}
                       tone={tones[i % tones.length]}/>
        )
    }
    return <g>{needles}</g>
}

function FirTrunk() {
    return <path d="M48 96 L52 96 L51 86 L49 86 Z" fill="#4a2f18"/>
}

function FirGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="38" ry="4" fill="#4a5a2a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="28" ry="2.6" fill="#6a7a3a" opacity="0.9"/>
            <circle cx="22" cy="95" r="0.5" fill="#8a9a5a" opacity="0.6"/>
            <circle cx="78" cy="95" r="0.5" fill="#8a9a5a" opacity="0.6"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <FirGround />
            <polygon points="50,60 42,80 58,80" fill="#1c4a18" stroke="#0f2f0e" strokeWidth="0.4"/>
            <polygon points="50,70 40,88 60,88" fill="#2f6b2a" stroke="#0f2f0e" strokeWidth="0.4"/>
            <FirTrunk />
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <FirGround />
            <FirCluster cx={50} cy={45} radius={8} seed={1} count={20}/>
            {/* Три яруса — ровный конус */}
            <polygon points="50,25 34,55 66,55" fill="#1c4a18" stroke="#0f2f0e" strokeWidth="0.5"/>
            <polygon points="50,40 28,72 72,72" fill="#2f6b2a" stroke="#0f2f0e" strokeWidth="0.5"/>
            <polygon points="50,55 22,88 78,88" fill="#1c4a18" stroke="#0f2f0e" strokeWidth="0.5"/>
            <FirTrunk />
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="firAura" color1="#4a7a2a" color2="#0f2f0e" />
            <circle cx="50" cy="45" r="46" fill="url(#firAura)" />
            <FirGround />

            {/* Пять ярусов — строгий конус */}
            <polygon points="50,10 30,38 70,38" fill="#1c4a18" stroke="#0f2f0e" strokeWidth="0.5"/>
            <polygon points="50,26 26,54 74,54" fill="#2f6b2a" stroke="#0f2f0e" strokeWidth="0.5"/>
            <polygon points="50,42 22,68 78,68" fill="#1c4a18" stroke="#0f2f0e" strokeWidth="0.5"/>
            <polygon points="50,56 18,80 82,80" fill="#2f6b2a" stroke="#0f2f0e" strokeWidth="0.5"/>
            <polygon points="50,70 14,94 86,94" fill="#1c4a18" stroke="#0f2f0e" strokeWidth="0.5"/>
            <FirTrunk />

            {/* Плотные кластеры игл */}
            <FirCluster cx={50} cy={12} radius={8} seed={100} count={24}/>
            <FirCluster cx={50} cy={28} radius={9} seed={101} count={26}/>
            <FirCluster cx={50} cy={44} radius={10} seed={102} count={28}/>
            <FirCluster cx={50} cy={58} radius={11} seed={103} count={30}/>
            <FirCluster cx={50} cy={72} radius={12} seed={104} count={32}/>
            <FirCluster cx={50} cy={86} radius={12} seed={105} count={32}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}