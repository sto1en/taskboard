import { Aura, SparkleRing, seededRandom } from './common'

const NEON_COLORS = ['#00f5ff', '#ff00e5', '#7b2ff7', '#00ffaa', '#ff0080', '#00b8ff']

// Светящаяся точка-узел
function NeonNode({ cx, cy, r = 1.5, color = '#00f5ff', pulse = false }) {
    return (
        <g>
            {/* Большое свечение */}
            <circle cx={cx} cy={cy} r={r * 4} fill={color} opacity="0.1">
                {pulse && (
                    <animate attributeName="opacity" values="0.05;0.2;0.05" dur="2s" repeatCount="indefinite"/>
                )}
            </circle>
            {/* Среднее свечение */}
            <circle cx={cx} cy={cy} r={r * 2.5} fill={color} opacity="0.3"/>
            {/* Ядро */}
            <circle cx={cx} cy={cy} r={r} fill={color}/>
            <circle cx={cx} cy={cy} r={r * 0.4} fill="#ffffff"/>
        </g>
    )
}

// Неоновая вена — изогнутая линия со свечением
function NeonVein({ d, width = 1.5, color = '#00f5ff', dashed = false }) {
    return (
        <g>
            {/* Внешнее свечение */}
            <path d={d} stroke={color} strokeWidth={width * 4} opacity="0.15"
                  strokeLinecap="round" fill="none"/>
            {/* Среднее */}
            <path d={d} stroke={color} strokeWidth={width * 2} opacity="0.45"
                  strokeLinecap="round" fill="none"/>
            {/* Ядро */}
            <path d={d} stroke={color} strokeWidth={width} opacity="0.95"
                  strokeLinecap="round" fill="none"
                  strokeDasharray={dashed ? '2 3' : undefined}/>
            {/* Белая сердцевина */}
            <path d={d} stroke="#ffffff" strokeWidth={width * 0.4} opacity="0.9"
                  strokeLinecap="round" fill="none"/>
        </g>
    )
}

// Ветка — вена + узлы + подветки
function NeonBranch({ d, color = '#00f5ff', seed = 0, subBranches = 0 }) {
    const items = []
    items.push(<NeonVein key="main" d={d} width={2} color={color}/>)

    // Подветки — короткие вены
    for (let i = 0; i < subBranches; i++) {
        const t = 0.3 + seededRandom(seed, i) * 0.6
        const parts = d.split(/[MCQ]/).filter(Boolean)
        // Приблизительно берём точку на ветке
        const subD = `M${40 + seededRandom(seed, i + 10) * 20} ${30 + seededRandom(seed, i + 20) * 20} Q${30 + seededRandom(seed, i + 30) * 40} ${20 + seededRandom(seed, i + 40) * 20} ${20 + seededRandom(seed, i + 50) * 60} ${15 + seededRandom(seed, i + 60) * 25}`
        const subColor = NEON_COLORS[(seed + i) % NEON_COLORS.length]
        items.push(
            <NeonVein key={`sub${i}`} d={subD} width={1.2} color={subColor}/>
        )
    }

    return <g>{items}</g>
}

// Асимметричное дерево — ствол с наклоном
function NeonTrunk({ topY = 20 }) {
    return (
        <g>
            {/* Основной ствол — изогнут влево-вправо */}
            <NeonVein d={`M50 96 Q46 80 52 68 T50 ${topY}`}
                      width={2.6} color="#00f5ff"/>

            {/* Боковые вены-обмотки по стволу */}
            <NeonVein d={`M49 90 Q52 82 48 74 T50 62`} width={1.2} color="#ff00e5"/>
            <NeonVein d={`M51 78 Q48 70 53 60 T50 ${topY + 4}`} width={1} color="#00ffaa"/>

            {/* Узлы по стволу */}
            <NeonNode cx={50} cy={88} r={1.2} color="#00f5ff"/>
            <NeonNode cx={49} cy={78} r={1} color="#ff00e5"/>
            <NeonNode cx={51} cy={68} r={1.3} color="#00ffaa"/>
            <NeonNode cx={50} cy={58} r={1.1} color="#7b2ff7"/>
            <NeonNode cx={50} cy={48} r={1.4} color="#00f5ff"/>
            <NeonNode cx={50} cy={38} r={1.2} color="#ff0080"/>
        </g>
    )
}

// Асимметричная крона — вены, узлы, искры
function NeonCrown({ seed = 0 }) {
    const items = []

    // Верхние ветки — асимметрично
    items.push(<NeonBranch key="b1"
                           d="M50 30 Q42 22 30 18 T12 14"
                           color="#00f5ff" seed={seed + 1} subBranches={2}/>)
    items.push(<NeonBranch key="b2"
                           d="M50 28 Q60 20 72 22 T90 26"
                           color="#ff00e5" seed={seed + 2} subBranches={2}/>)

    // Средние ветки — длиннее справа
    items.push(<NeonBranch key="b3"
                           d="M50 44 Q38 36 24 40 T6 48"
                           color="#7b2ff7" seed={seed + 3} subBranches={2}/>)
    items.push(<NeonBranch key="b4"
                           d="M50 42 Q66 32 82 38 T98 44"
                           color="#00ffaa" seed={seed + 4} subBranches={3}/>)

    // Нижние ветки
    items.push(<NeonBranch key="b5"
                           d="M50 58 Q40 54 30 60 T14 72"
                           color="#ff0080" seed={seed + 5} subBranches={2}/>)
    items.push(<NeonBranch key="b6"
                           d="M50 58 Q62 58 74 66 T90 78"
                           color="#00f5ff" seed={seed + 6} subBranches={2}/>)

    // Верхние тонкие веточки-щупальца
    items.push(<NeonBranch key="b7"
                           d="M50 20 Q48 12 44 6 T38 -2"
                           color="#ff00e5" seed={seed + 7} subBranches={0}/>)
    items.push(<NeonBranch key="b8"
                           d="M50 22 Q56 16 64 12 T76 6"
                           color="#00f5ff" seed={seed + 8} subBranches={0}/>)

    // Множество узлов-искр
    const nodes = [
        [12, 14, 1.4], [30, 18, 1.2], [50, 14, 1.5], [72, 22, 1.3], [90, 26, 1.4],
        [6, 48, 1.3], [24, 40, 1.1], [50, 32, 1.5], [82, 38, 1.4], [98, 44, 1.2],
        [14, 72, 1.2], [30, 60, 1.1], [74, 66, 1.2], [90, 78, 1.3],
        [38, -2, 1], [76, 6, 1.1], [44, 6, 0.9], [64, 12, 1],
    ]
    nodes.forEach(([x, y, r], i) => {
        const c = NEON_COLORS[i % NEON_COLORS.length]
        items.push(<NeonNode key={`n${i}`} cx={x} cy={y} r={r} color={c} pulse={i % 3 === 0}/>)
    })

    // Свободные искры вокруг
    const sparks = [
        [8, 8, 0.8, '#00f5ff'], [92, 10, 1, '#ff00e5'], [4, 62, 0.9, '#00ffaa'],
        [96, 66, 1, '#7b2ff7'], [20, 90, 0.7, '#ff0080'], [80, 90, 0.9, '#00f5ff'],
        [40, 4, 0.8, '#00ffaa'], [60, 2, 0.9, '#ff00e5'],
    ]
    sparks.forEach(([x, y, r, c], i) => {
        items.push(<NeonNode key={`s${i}`} cx={x} cy={y} r={r} color={c}/>)
    })

    return <g>{items}</g>
}

function NeonGround() {
    return (
        <g>
            <ellipse cx="50" cy="96" rx="42" ry="4.5" fill="#0a0620" opacity="0.9"/>
            <ellipse cx="50" cy="95" rx="32" ry="2.8" fill="#0f0a30" opacity="0.95"/>
            {/* Светящееся кольцо по земле */}
            <ellipse cx="50" cy="95" rx="32" ry="2.8" fill="none"
                     stroke="#00f5ff" strokeWidth="0.5" opacity="0.7"/>
            <ellipse cx="50" cy="95" rx="24" ry="2" fill="none"
                     stroke="#ff00e5" strokeWidth="0.4" opacity="0.5"/>
            {/* Корни-вены */}
            <NeonVein d="M48 94 Q40 92 32 95" width={1.2} color="#00f5ff"/>
            <NeonVein d="M52 94 Q60 92 68 95" width={1.2} color="#ff00e5"/>
            <NeonVein d="M50 94 Q46 96 40 98" width={0.9} color="#00ffaa"/>
            <NeonVein d="M50 94 Q54 96 60 98" width={0.9} color="#7b2ff7"/>
        </g>
    )
}

export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <NeonGround />
            {/* Тонкий росток с двумя венами-веточками */}
            <NeonVein d="M50 94 Q49 82 51 62" width={2} color="#00f5ff"/>
            <NeonVein d="M51 78 Q46 72 42 66" width={1.4} color="#ff00e5"/>
            <NeonVein d="M51 72 Q57 66 62 60" width={1.4} color="#00ffaa"/>

            {/* Узлы */}
            <NeonNode cx={50} cy={78} r={1.2} color="#00f5ff"/>
            <NeonNode cx={51} cy={66} r={1.3} color="#7b2ff7"/>
            <NeonNode cx={42} cy={65} r={1} color="#ff00e5"/>
            <NeonNode cx={62} cy={59} r={1.1} color="#00ffaa"/>
            <NeonNode cx={51} cy={58} r={1.4} color="#ff0080"/>
        </svg>
    )
}

export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <NeonGround />
            <NeonTrunk topY={32}/>
            <NeonCrown seed={10}/>

            {/* Дополнительные узлы для young */}
            <NeonNode cx={28} cy={30} r={1.1} color="#00f5ff"/>
            <NeonNode cx={72} cy={30} r={1.2} color="#ff00e5"/>
            <NeonNode cx={38} cy={52} r={1} color="#00ffaa"/>
            <NeonNode cx={62} cy={52} r={1.1} color="#7b2ff7"/>
        </svg>
    )
}

export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="neonAura" color1="#00f5ff" color2="#7b2ff7" />
            <circle cx="50" cy="45" r="48" fill="url(#neonAura)" />
            <circle cx="50" cy="45" r="44" fill="#0a0620" opacity="0.35"/>

            <NeonGround />
            <NeonTrunk topY={14}/>
            <NeonCrown seed={100}/>

            {/* Дополнительные вены и узлы для mature */}
            <NeonVein d="M50 20 Q30 10 8 18" width={1.4} color="#00ffaa"/>
            <NeonVein d="M50 20 Q70 10 92 18" width={1.4} color="#ff0080"/>
            <NeonVein d="M50 30 Q20 26 2 36" width={1.2} color="#00f5ff"/>
            <NeonVein d="M50 30 Q80 26 98 36" width={1.2} color="#ff00e5"/>

            {/* Больше искр — «звёзды» вокруг */}
            {Array.from({ length: 20 }).map((_, i) => {
                const a = seededRandom(200, i) * Math.PI * 2
                const d = 38 + seededRandom(200, i + 100) * 12
                const x = 50 + Math.cos(a) * d
                const y = 45 + Math.sin(a) * d * 0.7
                return (
                    <NeonNode key={i} cx={x} cy={y}
                              r={0.7 + seededRandom(200, i + 200) * 0.8}
                              color={NEON_COLORS[i % NEON_COLORS.length]}
                              pulse={i % 4 === 0}/>
                )
            })}

            {/* Пульсирующий контур */}
            <circle cx="50" cy="45" r="46" fill="none" stroke="#00f5ff" strokeWidth="0.4" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="50" cy="45" r="42" fill="none" stroke="#ff00e5" strokeWidth="0.3" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="4s" repeatCount="indefinite"/>
            </circle>

            <SparkleRing colorScheme="green" />
        </svg>
    )
}