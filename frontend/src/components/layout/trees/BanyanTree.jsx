import { Aura, SparkleRing, seededRandom } from './common'

// Круглый лист баньяна
function BanyanLeaf({ cx, cy, r = 3, rot = 0, tone = 'mid' }) {
    const palette = {
        light: { fill: '#7ab342', vein: '#4a8a24', edge: '#3a7520' },
        mid:   { fill: '#4e8a24', vein: '#2f6b22', edge: '#1f5a18' },
        deep:  { fill: '#3a6e18', vein: '#1f4a10', edge: '#163808' },
    }
    const c = palette[tone] || palette.mid
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx={r * 0.7} ry={r * 1.1}
                     fill={c.fill} stroke={c.edge} strokeWidth={r * 0.08}/>
            <line x1={cx} y1={cy - r * 0.9} x2={cx} y2={cy + r * 0.9}
                  stroke={c.vein} strokeWidth={r * 0.09} opacity="0.6"/>
        </g>
    )
}

function BanyanCluster({ cx, cy, radius = 9, count = 14, seed = 0 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light']
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.05 + Math.sqrt(seededRandom(seed, i + 100)) * 1.0)
        const lx = cx + Math.cos(a) * d
        const ly = cy + Math.sin(a) * d * 0.85
        items.push(
            <BanyanLeaf key={i} cx={lx} cy={ly}
                        r={2.8 + seededRandom(seed, i + 200) * 1.1}
                        rot={seededRandom(seed, i + 300) * 360}
                        tone={tones[i % tones.length]}/>
        )
    }
    return <g>{items}</g>
}

// Воздушный корень — волнистая тонкая линия с утолщением
function AerialRoot({ x1, y1, x2, y2, seed = 0 }) {
    const midX = (x1 + x2) / 2 + (seededRandom(seed, 0) - 0.5) * 4
    const midY = (y1 + y2) / 2
    return (
        <g>
            <path d={`M${x1} ${y1} Q${midX} ${midY} ${x2} ${y2}`}
                  stroke="#5c3a1e" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            <path d={`M${x1} ${y1} Q${midX} ${midY} ${x2} ${y2}`}
                  stroke="#7a5233" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.7"/>
        </g>
    )
}

// Толстый массивный ствол
function BanyanTrunk({ topY = 20 }) {
    return (
        <g>
            {/* Основной ствол — очень толстый */}
            <path d={`M50 96 C46 86 48 74 50 60 C52 46 50 34 50 ${topY}`}
                  stroke="#4a2f22" strokeWidth="13" strokeLinecap="round" fill="none"/>
            {/* Дополнительные стволы-опоры, сросшиеся */}
            <path d={`M40 96 C38 88 42 80 46 74`}
                  stroke="#4a2f22" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d={`M60 96 C62 88 58 80 54 74`}
                  stroke="#4a2f22" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
            {/* Блики */}
            <path d="M45 90 C42 80 44 70 46 62"
                  stroke="#6b4534" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
            {/* Кора — трещины */}
            <path d="M44 78 C43 72 45 66 47 62" stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M52 68 C51 62 52 56 51 50" stroke="#2f1d14" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.7"/>
        </g>
    )
}

// Широкие горизонтальные ветки
function BanyanBranches({ topY = 16 }) {
    return (
        <g stroke="#4a2f22" strokeLinecap="round" fill="none">
            {/* Очень широкие горизонтальные ветки */}
            <path d={`M50 ${topY + 8} C38 ${topY + 4} 20 ${topY + 6} 4 ${topY + 14}`} strokeWidth="5"/>
            <path d={`M50 ${topY + 8} C62 ${topY + 4} 80 ${topY + 6} 96 ${topY + 14}`} strokeWidth="5"/>

            <path d={`M50 ${topY + 20} C36 ${topY + 18} 18 ${topY + 22} 2 ${topY + 30}`} strokeWidth="4.5"/>
            <path d={`M50 ${topY + 20} C64 ${topY + 18} 82 ${topY + 22} 98 ${topY + 30}`} strokeWidth="4.5"/>

            <path d={`M50 ${topY + 32} C38 ${topY + 32} 22 ${topY + 36} 8 ${topY + 46}`} strokeWidth="4"/>
            <path d={`M50 ${topY + 32} C62 ${topY + 32} 78 ${topY + 36} 92 ${topY + 46}`} strokeWidth="4"/>

            {/* Верхние ветки */}
            <path d={`M50 ${topY} C42 ${topY - 6} 32 ${topY - 8} 24 ${topY - 4}`} strokeWidth="3.4"/>
            <path d={`M50 ${topY} C58 ${topY - 6} 68 ${topY - 8} 76 ${topY - 4}`} strokeWidth="3.4"/>
            <path d={`M50 ${topY - 6} C46 ${topY - 12} 40 ${topY - 14} 34 ${topY - 12}`} strokeWidth="2.4"/>
            <path d={`M50 ${topY - 6} C54 ${topY - 12} 60 ${topY - 14} 66 ${topY - 12}`} strokeWidth="2.4"/>

            {/* Тонкие подветочки */}
            <path d={`M4 ${topY + 14} C0 ${topY + 20} 0 ${topY + 28} 2 ${topY + 34}`} strokeWidth="1.8"/>
            <path d={`M96 ${topY + 14} C100 ${topY + 20} 100 ${topY + 28} 98 ${topY + 34}`} strokeWidth="1.8"/>
        </g>
    )
}

// Воздушные корни — главная фишка
function AerialRoots({ topY = 16 }) {
    const roots = []
    // От разных точек веток — вниз к земле
    const rootData = [
        // Левая сторона
        { x: 24, y: topY - 4, seed: 1 },
        { x: 14, y: topY + 8, seed: 2 },
        { x: 4, y: topY + 14, seed: 3 },
        { x: 20, y: topY + 20, seed: 4 },
        { x: 8, y: topY + 30, seed: 5 },
        { x: 0, y: topY + 20, seed: 6 },

        // Центр
        { x: 40, y: topY - 8, seed: 7 },
        { x: 60, y: topY - 8, seed: 8 },
        { x: 34, y: topY - 12, seed: 9 },
        { x: 66, y: topY - 12, seed: 10 },

        // Правая сторона
        { x: 76, y: topY - 4, seed: 11 },
        { x: 86, y: topY + 8, seed: 12 },
        { x: 96, y: topY + 14, seed: 13 },
        { x: 80, y: topY + 20, seed: 14 },
        { x: 92, y: topY + 30, seed: 15 },
        { x: 100, y: topY + 20, seed: 16 },
    ]

    for (const r of rootData) {
        // Каждый корень свисает до земли ~95
        const endY = 95 - seededRandom(r.seed, 100) * 3
        roots.push(
            <AerialRoot key={r.seed}
                        x1={r.x} y1={r.y}
                        x2={r.x + (seededRandom(r.seed, 50) - 0.5) * 3} y2={endY}
                        seed={r.seed}/>
        )
    }
    return <g>{roots}</g>
}

function BanyanGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="46" ry="4.5" fill="#4a6b2a" opacity="0.85"/>
            <ellipse cx="50" cy="95" rx="36" ry="3" fill="#6b8f3a" opacity="0.9"/>
            <path d="M14 95 L12 90 M18 95 L19 90 M22 95 L21 90"
                  stroke="#4e8a3a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <path d="M78 95 L79 90 M82 95 L84 90 M86 95 L85 90"
                  stroke="#4e8a3a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <BanyanGround />
            <path d="M50 94 C48 84 52 74 50 62" stroke="#4a2f22" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <path d="M50 82 C42 78 36 74 34 68" stroke="#4a2f22" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M50 76 C58 72 64 68 66 62" stroke="#4a2f22" strokeWidth="3" strokeLinecap="round" fill="none"/>
            {/* Маленький воздушный корень */}
            <AerialRoot x1={34} y1={68} x2={34} y2={94} seed={1}/>
            <AerialRoot x1={66} y1={62} x2={66} y2={94} seed={2}/>
            <BanyanCluster cx={34} cy={66} radius={5} seed={1} count={10}/>
            <BanyanCluster cx={66} cy={60} radius={5} seed={2} count={10}/>
            <BanyanCluster cx={50} cy={54} radius={6} seed={3} count={12}/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <BanyanGround />
            <BanyanTrunk topY={30}/>
            <BanyanBranches topY={30}/>

            {/* Воздушные корни */}
            <AerialRoot x1={24} y1={26} x2={24} y2={94} seed={10}/>
            <AerialRoot x1={76} y1={26} x2={76} y2={94} seed={11}/>
            <AerialRoot x1={8} y1={36} x2={8} y2={94} seed={12}/>
            <AerialRoot x1={92} y1={36} x2={92} y2={94} seed={13}/>
            <AerialRoot x1={34} y1={22} x2={34} y2={94} seed={14}/>
            <AerialRoot x1={66} y1={22} x2={66} y2={94} seed={15}/>

            {/* Крона */}
            <BanyanCluster cx={20} cy={40} radius={10} seed={20} count={16}/>
            <BanyanCluster cx={80} cy={40} radius={10} seed={21} count={16}/>
            <BanyanCluster cx={10} cy={28} radius={9} seed={22} count={14}/>
            <BanyanCluster cx={90} cy={28} radius={9} seed={23} count={14}/>
            <BanyanCluster cx={30} cy={26} radius={10} seed={24} count={16}/>
            <BanyanCluster cx={70} cy={26} radius={10} seed={25} count={16}/>
            <BanyanCluster cx={50} cy={20} radius={11} seed={26} count={18}/>
            <BanyanCluster cx={14} cy={50} radius={8} seed={27} count={12}/>
            <BanyanCluster cx={86} cy={50} radius={8} seed={28} count={12}/>
            <BanyanCluster cx={4} cy={42} radius={7} seed={29} count={11}/>
            <BanyanCluster cx={96} cy={42} radius={7} seed={30} count={11}/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="banyanAura" color1="#7ab342" color2="#3a6e18" />
            <circle cx="50" cy="45" r="48" fill="url(#banyanAura)" />
            <BanyanGround />
            <BanyanTrunk topY={14}/>
            <BanyanBranches topY={14}/>

            {/* Много воздушных корней — фишка */}
            <AerialRoots topY={14}/>

            {/* Плотная широкая крона — 20 кластеров */}
            <BanyanCluster cx={24} cy={8} radius={10} seed={100} count={16}/>
            <BanyanCluster cx={76} cy={8} radius={10} seed={101} count={16}/>
            <BanyanCluster cx={14} cy={22} radius={11} seed={102} count={18}/>
            <BanyanCluster cx={86} cy={22} radius={11} seed={103} count={18}/>
            <BanyanCluster cx={6} cy={36} radius={10} seed={104} count={16}/>
            <BanyanCluster cx={94} cy={36} radius={10} seed={105} count={16}/>
            <BanyanCluster cx={2} cy={50} radius={9} seed={106} count={14}/>
            <BanyanCluster cx={98} cy={50} radius={9} seed={107} count={14}/>
            <BanyanCluster cx={30} cy={-2} radius={10} seed={108} count={16}/>
            <BanyanCluster cx={70} cy={-2} radius={10} seed={109} count={16}/>
            <BanyanCluster cx={50} cy={-6} radius={10} seed={110} count={16}/>
            <BanyanCluster cx={50} cy={6} radius={11} seed={111} count={18}/>
            <BanyanCluster cx={50} cy={20} radius={11} seed={112} count={18}/>
            <BanyanCluster cx={36} cy={16} radius={10} seed={113} count={16}/>
            <BanyanCluster cx={64} cy={16} radius={10} seed={114} count={16}/>
            <BanyanCluster cx={20} cy={32} radius={10} seed={115} count={16}/>
            <BanyanCluster cx={80} cy={32} radius={10} seed={116} count={16}/>
            <BanyanCluster cx={10} cy={58} radius={9} seed={117} count={14}/>
            <BanyanCluster cx={90} cy={58} radius={9} seed={118} count={14}/>
            <BanyanCluster cx={34} cy={44} radius={9} seed={119} count={14}/>
            <BanyanCluster cx={66} cy={44} radius={9} seed={120} count={14}/>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}