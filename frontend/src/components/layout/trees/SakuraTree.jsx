import { Aura, SparkleRing, seededRandom } from './common'

const PALETTES = {
    light: { petal: '#ffd9e6', petalEdge: '#f9b8d0', core: '#ffe28a', stamen: '#e85a9a' },
    mid:   { petal: '#f9b0cf', petalEdge: '#eb7cae', core: '#ffd068', stamen: '#c93e7d' },
    deep:  { petal: '#ee88b8', petalEdge: '#d3548e', core: '#f4b942', stamen: '#a12c66' },
    pale:  { petal: '#ffe6f0', petalEdge: '#fcc3db', core: '#fff0c0', stamen: '#eb8fbb' },
}

// Один цветок сакуры — крупный, 5 лепестков с выемкой
function SakuraFlower({ cx, cy, r = 6, rot = 0, hue = 'mid' }) {
    const p = PALETTES[hue] || PALETTES.mid
    const petals = []
    for (let i = 0; i < 5; i++) {
        const angle = i * 72 + rot
        const rad = angle * Math.PI / 180
        const px = cx + Math.cos(rad) * r * 0.55
        const py = cy + Math.sin(rad) * r * 0.55
        // лепесток с выемкой
        const d = `M${px} ${py - r * 0.55}
                   C${px + r * 0.45} ${py - r * 0.5} ${px + r * 0.55} ${py} ${px} ${py + r * 0.3}
                   C${px - r * 0.55} ${py} ${px - r * 0.45} ${py - r * 0.5} ${px} ${py - r * 0.55} Z`
        petals.push(
            <path key={i} d={d}
                  transform={`rotate(${angle} ${px} ${py})`}
                  fill={p.petal} stroke={p.petalEdge} strokeWidth={r * 0.06} />
        )
    }
    return (
        <g>
            {petals}
            <circle cx={cx} cy={cy} r={r * 0.18} fill={p.core} />
            {/* тычинки */}
            <line x1={cx} y1={cy} x2={cx - r * 0.35} y2={cy - r * 0.35} stroke={p.stamen} strokeWidth={r * 0.05} opacity="0.75"/>
            <line x1={cx} y1={cy} x2={cx + r * 0.35} y2={cy - r * 0.3} stroke={p.stamen} strokeWidth={r * 0.05} opacity="0.75"/>
            <line x1={cx} y1={cy} x2={cx + r * 0.3} y2={cy + r * 0.35} stroke={p.stamen} strokeWidth={r * 0.05} opacity="0.75"/>
        </g>
    )
}

// Облако цветов — очень плотная группа (важно для «пышной» кроны)
function FlowerCloud({ cx, cy, r = 16, seed = 0, density = 3 }) {
    const flowers = []
    const count = Math.round(density * 8)
    const variants = ['light', 'mid', 'deep', 'pale', 'light', 'mid']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const dist = r * (0.05 + seededRandom(seed, i + 10) * 0.85)
        const fx = cx + Math.cos(a) * dist
        const fy = cy + Math.sin(a) * dist * 0.85
        flowers.push(
            <SakuraFlower key={i} cx={fx} cy={fy}
                          r={r * 0.35 + seededRandom(seed, i + 20) * r * 0.15}
                          rot={seededRandom(seed, i + 30) * 360}
                          hue={variants[i % variants.length]} />
        )
    }
    return <g>{flowers}</g>
}

// Толстый изогнутый ствол + ветки
function Trunk() {
    return (
        <g>
            {/* ствол — толстый, изогнутый вправо */}
            <path d="M50 95 C46 84 44 74 48 62 C52 52 50 44 47 36"
                  stroke="#4a2f22" strokeWidth="7" strokeLinecap="round" fill="none"/>
            {/* блики на стволе */}
            <path d="M47 90 C44 80 43 72 46 62"
                  stroke="#6b4534" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75"/>
            <path d="M52 82 C50 72 50 62 49 52"
                  stroke="#6b4534" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6"/>
            {/* полоски коры */}
            <path d="M45 78 C44 72 45 66 47 62"
                  stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M52 70 C51 64 51 58 50 52"
                  stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>

            {/* главные ветки — почти горизонтально в стороны */}
            <path d="M48 62 C42 58 34 56 26 58" stroke="#4a2f22" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            <path d="M50 58 C58 54 68 54 76 58" stroke="#4a2f22" strokeWidth="4.5" strokeLinecap="round" fill="none"/>

            <path d="M48 50 C42 44 34 40 26 40" stroke="#4a2f22" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <path d="M50 46 C58 42 68 40 76 42" stroke="#4a2f22" strokeWidth="3.5" strokeLinecap="round" fill="none"/>

            <path d="M48 38 C44 32 38 28 32 26" stroke="#4a2f22" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            <path d="M50 36 C54 30 60 26 66 24" stroke="#4a2f22" strokeWidth="2.8" strokeLinecap="round" fill="none"/>

            {/* тонкие веточки */}
            <path d="M26 58 C20 60 16 62 12 62" stroke="#4a2f22" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M26 58 C22 54 18 52 14 50" stroke="#4a2f22" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M76 58 C82 60 86 62 90 62" stroke="#4a2f22" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M76 58 C80 54 84 52 88 50" stroke="#4a2f22" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

            <path d="M26 40 C20 38 14 36 10 34" stroke="#4a2f22" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M76 42 C82 40 86 38 90 36" stroke="#4a2f22" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </g>
    )
}

// Земля с травой и лепестками
function Ground() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="40" ry="4.5" fill="#8f6f52" opacity="0.7"/>
            <ellipse cx="50" cy="95" rx="30" ry="2.8" fill="#b28c6e" opacity="0.85"/>
            <path d="M22 96 L20 92 M26 96 L27 91 M30 96 L29 92"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            <path d="M70 96 L71 91 M74 96 L76 92 M78 96 L78 91"
                  stroke="#5c8f4a" strokeWidth="0.7" strokeLinecap="round" fill="none"/>
            {/* опавшие лепестки */}
            <ellipse cx="34" cy="94" rx="1.2" ry="0.7" fill="#f9b0cf" opacity="0.8"/>
            <ellipse cx="58" cy="95" rx="1.1" ry="0.6" fill="#f9b0cf" opacity="0.7"/>
            <ellipse cx="44" cy="96" rx="1.3" ry="0.7" fill="#ee88b8" opacity="0.75"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Ground />
            <path d="M50 94 C48 84 52 74 50 64" stroke="#4a2f22" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 82 C44 78 40 74 38 68" stroke="#4a2f22" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M50 78 C56 74 60 70 62 64" stroke="#4a2f22" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <FlowerCloud cx={38} cy={66} r={6} seed={1} density={1.2}/>
            <FlowerCloud cx={62} cy={62} r={6} seed={2} density={1.2}/>
            <FlowerCloud cx={50} cy={56} r={7} seed={3} density={1.5}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Ground />
            <Trunk />
            <FlowerCloud cx={26} cy={58} r={13} seed={10} density={2}/>
            <FlowerCloud cx={76} cy={58} r={13} seed={11} density={2}/>
            <FlowerCloud cx={26} cy={40} r={11} seed={12} density={1.8}/>
            <FlowerCloud cx={76} cy={42} r={11} seed={13} density={1.8}/>
            <FlowerCloud cx={50} cy={30} r={15} seed={14} density={2.2}/>
            <FlowerCloud cx={32} cy={26} r={9} seed={15} density={1.6}/>
            <FlowerCloud cx={66} cy={24} r={9} seed={16} density={1.6}/>
            <FlowerCloud cx={14} cy={50} r={7} seed={17} density={1.4}/>
            <FlowerCloud cx={88} cy={50} r={7} seed={18} density={1.4}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="sakuraAura" color1="#f9b0cf" color2="#eb7cae" />
            <circle cx="50" cy="45" r="46" fill="url(#sakuraAura)" />
            <Ground />
            <Trunk />
            {/* основная шапка из облаков цветов — почти весь верх */}
            <FlowerCloud cx={14} cy={50} r={12} seed={100} density={2}/>
            <FlowerCloud cx={88} cy={50} r={12} seed={101} density={2}/>
            <FlowerCloud cx={26} cy={58} r={15} seed={102} density={2.2}/>
            <FlowerCloud cx={76} cy={58} r={15} seed={103} density={2.2}/>
            <FlowerCloud cx={26} cy={40} r={14} seed={104} density={2}/>
            <FlowerCloud cx={76} cy={42} r={14} seed={105} density={2}/>
            <FlowerCloud cx={50} cy={30} r={18} seed={106} density={2.5}/>
            <FlowerCloud cx={32} cy={24} r={13} seed={107} density={2}/>
            <FlowerCloud cx={68} cy={24} r={13} seed={108} density={2}/>
            <FlowerCloud cx={50} cy={14} r={14} seed={109} density={2.2}/>
            <FlowerCloud cx={14} cy={34} r={10} seed={110} density={1.6}/>
            <FlowerCloud cx={86} cy={32} r={10} seed={111} density={1.6}/>
            <FlowerCloud cx={40} cy={16} r={10} seed={112} density={1.6}/>
            <FlowerCloud cx={60} cy={16} r={10} seed={113} density={1.6}/>

            <SparkleRing colorScheme="pink" />
        </svg>
    )
}