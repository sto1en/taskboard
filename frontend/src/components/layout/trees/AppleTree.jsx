import { Aura, SparkleRing, seededRandom } from './common'

// Крупный лист яблони с прожилками
function AppleLeaf({ cx, cy, r = 5, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#8fc55e', vein: '#5e8f36', edge: '#4a7a28' },
        mid:   { fill: '#5a9f3a', vein: '#3a7520', edge: '#2c5f18' },
        deep:  { fill: '#3f7a2a', vein: '#265418', edge: '#1c4610' },
    }
    const c = palette[tone] || palette.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            {/* овальный лист с острым кончиком */}
            <path d={`M${cx} ${cy - r * 1.4}
                     C${cx + r * 0.9} ${cy - r * 1.1} ${cx + r * 1.1} ${cy - r * 0.3} ${cx + r * 0.7} ${cy + r * 0.5}
                     C${cx + r * 0.4} ${cy + r * 1.2} ${cx + r * 0.1} ${cy + r * 1.4} ${cx} ${cy + r * 1.5}
                     C${cx - r * 0.1} ${cy + r * 1.4} ${cx - r * 0.4} ${cy + r * 1.2} ${cx - r * 0.7} ${cy + r * 0.5}
                     C${cx - r * 1.1} ${cy - r * 0.3} ${cx - r * 0.9} ${cy - r * 1.1} ${cx} ${cy - r * 1.4} Z`}
                  fill={c.fill} stroke={c.edge} strokeWidth={r * 0.1}/>
            <path d={`M${cx} ${cy - r * 1.25} L${cx} ${cy + r * 1.35}`}
                  stroke={c.vein} strokeWidth={r * 0.1} opacity="0.7"/>
            <path d={`M${cx} ${cy - r * 0.4} L${cx + r * 0.6} ${cy - r * 0.8}`}
                  stroke={c.vein} strokeWidth={r * 0.07} opacity="0.55"/>
            <path d={`M${cx} ${cy - r * 0.4} L${cx - r * 0.6} ${cy - r * 0.8}`}
                  stroke={c.vein} strokeWidth={r * 0.07} opacity="0.55"/>
            <path d={`M${cx} ${cy + r * 0.4} L${cx + r * 0.5} ${cy + r * 0.1}`}
                  stroke={c.vein} strokeWidth={r * 0.07} opacity="0.55"/>
            <path d={`M${cx} ${cy + r * 0.4} L${cx - r * 0.5} ${cy + r * 0.1}`}
                  stroke={c.vein} strokeWidth={r * 0.07} opacity="0.55"/>
        </g>
    )
}

// Белый цветок яблони с 5 лепестками и жёлтой серединкой
function AppleBlossom({ cx, cy, r = 5, rot = 0 }) {
    const petals = []
    for (let i = 0; i < 5; i++) {
        const a = i * 72 + rot
        const rad = a * Math.PI / 180
        const px = cx + Math.cos(rad) * r * 0.5
        const py = cy + Math.sin(rad) * r * 0.5
        petals.push(
            <ellipse key={i} cx={px} cy={py} rx={r * 0.5} ry={r * 0.42}
                     transform={`rotate(${a} ${px} ${py})`}
                     fill="#ffffff" stroke="#e8e2cc" strokeWidth={r * 0.06} />
        )
    }
    return (
        <g>
            {petals}
            <circle cx={cx} cy={cy} r={r * 0.22} fill="#ffc93c" />
            <circle cx={cx - r * 0.1} cy={cy - r * 0.1} r={r * 0.06} fill="#a88800"/>
            <circle cx={cx + r * 0.1} cy={cy - r * 0.05} r={r * 0.05} fill="#a88800"/>
            <circle cx={cx - r * 0.05} cy={cy + r * 0.12} r={r * 0.05} fill="#a88800"/>
        </g>
    )
}

// Красное яблоко с бликом и листиком
function AppleFruit({ cx, cy, r = 4 }) {
    return (
        <g>
            <ellipse cx={cx} cy={cy} rx={r * 1.05} ry={r} fill="#d0342c"/>
            <ellipse cx={cx + r * 0.15} cy={cy + r * 0.2} rx={r * 0.75} ry={r * 0.7} fill="#a3241f"/>
            <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.38} ry={r * 0.3} fill="#f47b72" opacity="0.9"/>
            <ellipse cx={cx - r * 0.4} cy={cy - r * 0.5} rx={r * 0.12} ry={r * 0.09} fill="#ffd9d4" opacity="0.95"/>
            {/* стебель + листик */}
            <line x1={cx} y1={cy - r} x2={cx + r * 0.1} y2={cy - r * 1.4}
                  stroke="#4d3a2a" strokeWidth={r * 0.14} strokeLinecap="round"/>
            <path d={`M${cx + r * 0.1} ${cy - r * 1.3}
                     C${cx + r * 0.6} ${cy - r * 1.55} ${cx + r * 0.9} ${cy - r * 1.2} ${cx + r * 1} ${cy - r * 0.9}
                     C${cx + r * 0.6} ${cy - r * 0.85} ${cx + r * 0.3} ${cy - r * 0.9} ${cx + r * 0.1} ${cy - r * 1.3} Z`}
                  fill="#5a9f3a" stroke="#3a7520" strokeWidth={r * 0.05}/>
        </g>
    )
}

// Группа: несколько листьев + цветы + яблоки
function FoliageBunch({ cx, cy, r = 10, seed = 0, withApples = true, withBlossoms = true }) {
    const items = []
    const leafCount = 3
    const tones = ['light', 'mid', 'deep', 'mid']
    const angles = [-70, -20, 30, 80]
    for (let i = 0; i < leafCount; i++) {
        const a = angles[i] + (seededRandom(seed, i) - 0.5) * 30
        const lx = cx + Math.cos((a - 90) * Math.PI / 180) * r * 0.5
        const ly = cy + Math.sin((a - 90) * Math.PI / 180) * r * 0.5
        items.push(
            <AppleLeaf key={`l${i}`} cx={lx} cy={ly}
                       r={r * 0.42 + seededRandom(seed, i + 10) * r * 0.1}
                       rot={a}
                       tone={tones[i % tones.length]} />
        )
    }
    if (withBlossoms && seededRandom(seed, 50) > 0.5) {
        items.push(
            <AppleBlossom key="b1" cx={cx + r * 0.3} cy={cy - r * 0.3}
                          r={r * 0.4} rot={seededRandom(seed, 51) * 360}/>
        )
    }
    if (withApples && seededRandom(seed, 60) > 0.4) {
        items.push(
            <AppleFruit key="a1" cx={cx - r * 0.25} cy={cy + r * 0.2}
                        r={r * 0.38}/>
        )
    }
    return <g>{items}</g>
}

function Ground() {
    return (
        <g>
            <ellipse cx="50" cy="97" rx="42" ry="3.5" fill="#5a8f3a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="34" ry="2.5" fill="#7fb04a" opacity="0.85"/>
            {/* травинки */}
            <path d="M18 95 L16 90 M22 95 L22 89 M26 95 L27 90"
                  stroke="#4e8a3a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <path d="M74 95 L75 90 M78 95 L78 89 M82 95 L83 90"
                  stroke="#4e8a3a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            {/* жёлтые цветочки */}
            <circle cx="20" cy="89" r="1.2" fill="#ffc93c" stroke="#d49a1f" strokeWidth="0.3"/>
            <circle cx="26" cy="88" r="1" fill="#ffc93c" stroke="#d49a1f" strokeWidth="0.3"/>
            <circle cx="78" cy="88" r="1.2" fill="#ffc93c" stroke="#d49a1f" strokeWidth="0.3"/>
            <circle cx="84" cy="89" r="1" fill="#ffc93c" stroke="#d49a1f" strokeWidth="0.3"/>
        </g>
    )
}

// S-образный ствол с ответвлениями
function Trunk() {
    return (
        <g>
            {/* ствол S-образный */}
            <path d="M50 96 C44 88 48 80 46 72 C44 64 50 58 52 50 C54 42 50 36 48 30"
                  stroke="#5c3a1e" strokeWidth="6.5" strokeLinecap="round" fill="none"/>
            {/* блик */}
            <path d="M48 90 C44 84 47 78 47 72 C47 66 50 60 51 54"
                  stroke="#7a5233" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7"/>
            {/* полоски коры */}
            <path d="M45 84 C44 78 46 74 47 70" stroke="#3a2412" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M50 78 C49 72 51 66 52 60" stroke="#3a2412" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M51 52 C51 46 49 42 48 38" stroke="#3a2412" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>

            {/* главные ветки */}
            <path d="M46 72 C38 68 28 62 20 56" stroke="#5c3a1e" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M52 64 C60 58 70 52 78 46" stroke="#5c3a1e" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M52 50 C44 42 36 36 28 30" stroke="#5c3a1e" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
            <path d="M50 44 C58 38 68 32 74 26" stroke="#5c3a1e" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
            <path d="M48 32 C44 26 40 22 36 18" stroke="#5c3a1e" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M49 28 C54 24 58 20 62 16" stroke="#5c3a1e" strokeWidth="2.6" strokeLinecap="round" fill="none"/>

            {/* тонкие веточки */}
            <path d="M20 56 C16 54 12 52 8 50" stroke="#5c3a1e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M78 46 C82 44 86 42 90 42" stroke="#5c3a1e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M28 30 C24 26 20 24 16 22" stroke="#5c3a1e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M74 26 C78 24 82 20 84 16" stroke="#5c3a1e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Ground />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#5c3a1e" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C42 74 38 70 36 64" stroke="#5c3a1e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 70 62 66 64 60" stroke="#5c3a1e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <FoliageBunch cx={36} cy={62} r={7} seed={1}/>
            <FoliageBunch cx={64} cy={58} r={7} seed={2}/>
            <FoliageBunch cx={50} cy={54} r={8} seed={3}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Ground />
            <Trunk />
            <FoliageBunch cx={20} cy={54} r={11} seed={10}/>
            <FoliageBunch cx={78} cy={44} r={11} seed={11}/>
            <FoliageBunch cx={28} cy={28} r={10} seed={12}/>
            <FoliageBunch cx={74} cy={24} r={10} seed={13}/>
            <FoliageBunch cx={36} cy={16} r={9} seed={14}/>
            <FoliageBunch cx={62} cy={14} r={9} seed={15}/>
            <FoliageBunch cx={50} cy={24} r={12} seed={16}/>
            <FoliageBunch cx={10} cy={48} r={8} seed={17}/>
            <FoliageBunch cx={90} cy={40} r={8} seed={18}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="appleAura" color1="#f4b942" color2="#6fb03d" />
            <circle cx="50" cy="45" r="44" fill="url(#appleAura)" />
            <Ground />
            <Trunk />

            {/* плотная шапка из листьев с яблоками и цветами */}
            <FoliageBunch cx={8}  cy={48} r={11} seed={100}/>
            <FoliageBunch cx={20} cy={54} r={13} seed={101}/>
            <FoliageBunch cx={78} cy={44} r={13} seed={102}/>
            <FoliageBunch cx={90} cy={40} r={11} seed={103}/>
            <FoliageBunch cx={28} cy={28} r={12} seed={104}/>
            <FoliageBunch cx={74} cy={24} r={12} seed={105}/>
            <FoliageBunch cx={36} cy={16} r={11} seed={106}/>
            <FoliageBunch cx={62} cy={14} r={11} seed={107}/>
            <FoliageBunch cx={50} cy={22} r={14} seed={108}/>
            <FoliageBunch cx={50} cy={38} r={12} seed={109}/>
            <FoliageBunch cx={18} cy={38} r={10} seed={110}/>
            <FoliageBunch cx={82} cy={30} r={10} seed={111}/>
            <FoliageBunch cx={42} cy={10} r={9}  seed={112}/>
            <FoliageBunch cx={58} cy={8}  r={9}  seed={113}/>
            <FoliageBunch cx={28} cy={48} r={10} seed={114}/>
            <FoliageBunch cx={70} cy={54} r={10} seed={115}/>

            <SparkleRing colorScheme="yellow" />
        </svg>
    )
}