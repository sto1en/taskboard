// frontend/src/components/layout/trees/JacarandaTree.jsx

import { Aura, SparkleRing, seededRandom } from './common'

// ============================================================
// ПАЛИТРА
// ============================================================
const JACARANDA_TONES = {
    light: { petal: '#d8b0f0', edge: '#b080d0', core: '#f0d8ff' },
    mid:   { petal: '#b888e8', edge: '#9060c0', core: '#e0c0ff' },
    deep:  { petal: '#9868d0', edge: '#7040a8', core: '#c8a0e8' },
    dark:  { petal: '#7848b0', edge: '#582880', core: '#a878d0' },
    pale:  { petal: '#e8c8f8', edge: '#c8a0e0', core: '#f8e8ff' },
}

// ============================================================
// ОДИН ЦВЕТОК
// ============================================================
function JacarandaFlower({ cx, cy, r = 2.5, rot = 0, tone = 'mid' }) {
    const p = JACARANDA_TONES[tone] || JACARANDA_TONES.mid
    const petals = []
    for (let i = 0; i < 5; i++) {
        const a = i * 72 + rot
        const rad = a * Math.PI / 180
        const px = cx + Math.cos(rad) * r * 0.5
        const py = cy + Math.sin(rad) * r * 0.5
        petals.push(
            <ellipse key={i} cx={px} cy={py} rx={r * 0.5} ry={r * 0.32}
                     transform={`rotate(${a} ${px} ${py})`}
                     fill={p.petal} stroke={p.edge} strokeWidth={r * 0.06}/>
        )
    }
    return (
        <g>
            {petals}
            <circle cx={cx} cy={cy} r={r * 0.18} fill={p.core}/>
        </g>
    )
}

// ============================================================
// ЦВЕТОЧНАЯ КИСТЬ (цвет стебля = цвет ствола)
// ============================================================
function FlowerRaceme({ x1, y1, x2, y2, seed = 0, flowerCount = 20 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'mid', 'light', 'pale', 'mid', 'deep']

    const midX = (x1 + x2) / 2 + (seededRandom(seed, 999) - 0.5) * 2.5
    const midY = (y1 + y2) / 2
    items.push(
        <path key="stem"
              d={`M${x1} ${y1} Q${midX} ${midY} ${x2} ${y2}`}
              stroke="#5a3a20" strokeWidth="0.3" fill="none" opacity="0.55"/>
    )

    for (let i = 0; i < flowerCount; i++) {
        const t = (i + 1) / (flowerCount + 1)
        const cx = x1 + (x2 - x1) * t + (midX - (x1 + x2) / 2) * (1 - Math.abs(2 * t - 1)) * 0.5
        const cy = y1 + (y2 - y1) * t + (midY - (y1 + y2) / 2) * (1 - Math.abs(2 * t - 1)) * 0.5
        const offX = (seededRandom(seed, i + 10) - 0.5) * 2.2
        const offY = (seededRandom(seed, i + 20) - 0.5) * 1.2
        const sizeScale = 1 - t * 0.2
        const flowerR = (1.5 + seededRandom(seed, i + 30) * 0.7) * sizeScale

        items.push(
            <JacarandaFlower key={i}
                             cx={cx + offX} cy={cy + offY}
                             r={flowerR}
                             rot={seededRandom(seed, i + 40) * 360}
                             tone={tones[i % tones.length]}/>
        )
    }
    return <g>{items}</g>
}

// ============================================================
// ХАОТИЧНАЯ ВЕТКА (цвет ветки = цвет ствола)
// ============================================================
function ChaoticBranch({ path, tips = [], seed = 0, maxLen = 40 }) {
    const items = []

    items.push(
        <path key="branch" d={path}
              stroke="#5a3a20" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    )

    tips.forEach((tip, i) => {
        const [tx, ty] = tip
        const length = 8 + seededRandom(seed, i + 100) * maxLen
        const maxY = 86
        const actualLen = Math.min(length, maxY - ty)
        if (actualLen < 4) return

        const endX = tx + (seededRandom(seed, i + 200) - 0.5) * 5

        items.push(
            <FlowerRaceme key={i}
                          x1={tx} y1={ty}
                          x2={endX} y2={ty + actualLen}
                          seed={seed + i * 10}
                          flowerCount={10 + Math.floor(seededRandom(seed, i + 300) * 10)}/>
        )
    })

    return <g>{items}</g>
}

// ============================================================
// ЕДИНЫЙ ИЗВИЛИСТЫЙ СТВОЛ (тоньше — 9)
// ============================================================
function MassiveWindingTrunk() {
    return (
        <g>
            {/* ============ ОСНОВНОЙ СТВОЛ — ОДИН, ПЛАВНО ИЗВИВАЕТСЯ ============ */}
            <path d="M50 96
                     C42 92 40 86 44 80
                     C48 74 54 70 54 62
                     C54 54 46 50 44 42
                     C42 34 48 28 52 22
                     C54 18 53 14 52 10"
                  stroke="#5a3a20" strokeWidth="9" strokeLinecap="round" fill="none"/>

            {/* Светлый блик — вдоль левой стороны ствола */}
            <path d="M46 92 C40 87 42 81 46 76 C50 70 52 65 50 58 C48 51 44 47 44 40 C44 33 48 28 50 22"
                  stroke="#8a5a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>

            {/* Тонкий светлый блик справа — для объёма */}
            <path d="M54 88 C57 83 55 77 52 72 C50 66 49 60 51 54 C53 48 52 42 50 36"
                  stroke="#7a4e2e" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>

            {/* Тёмные трещины — вдоль ствола */}
            <path d="M44 84 C43 78 46 74 48 70"
                  stroke="#1f1208" strokeWidth="0.6" fill="none" opacity="0.65"/>
            <path d="M50 68 C49 62 47 58 46 52"
                  stroke="#1f1208" strokeWidth="0.6" fill="none" opacity="0.65"/>
            <path d="M47 46 C46 40 48 34 50 30"
                  stroke="#1f1208" strokeWidth="0.5" fill="none" opacity="0.55"/>
            <path d="M52 28 C52 24 52 20 52 16"
                  stroke="#1f1208" strokeWidth="0.5" fill="none" opacity="0.5"/>

            {/* Утолщение у основания — «корневая шейка» */}
            <ellipse cx="50" cy="94" rx="9" ry="2.5" fill="#5a3a20" opacity="0.9"/>

            {/* ============ ТОЛСТЫЕ КОРНИ ============ */}
            <path d="M44 96 C38 95 32 94 26 96"
                  stroke="#5a3a20" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M56 96 C62 95 68 94 74 96"
                  stroke="#5a3a20" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M46 96 C42 96 38 97 34 98"
                  stroke="#4a2e18" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            <path d="M54 96 C58 96 62 97 66 98"
                  stroke="#4a2e18" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
            <path d="M48 97 C44 98 40 99 36 99"
                  stroke="#3a2418" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M52 97 C56 98 60 99 64 99"
                  stroke="#3a2418" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

            {/* Мох */}
            <ellipse cx="50" cy="94" rx="16" ry="3.5" fill="#4a6b2a" opacity="0.75"/>
            <ellipse cx="46" cy="94" rx="5" ry="1.8" fill="#5a8038" opacity="0.65"/>
            <ellipse cx="56" cy="94" rx="5" ry="1.8" fill="#5a8038" opacity="0.65"/>
        </g>
    )
}

// ============================================================
// ЦВЕТОЧНОЕ ОБЛАКО (объёмнее — больше цветков и размер)
// ============================================================
function FlowerCloud({ cx, cy, radius = 12, count = 20, seed = 0, opacity = 0.85 }) {
    const items = []
    const tones = ['light', 'mid', 'deep', 'pale', 'mid', 'light']

    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = radius * (0.1 + Math.sqrt(seededRandom(seed, i + 100)) * 0.95)
        const fx = cx + Math.cos(a) * d
        const fy = cy + Math.sin(a) * d * 0.9
        const r = 1.7 + seededRandom(seed, i + 200) * 1.4

        items.push(
            <JacarandaFlower key={i}
                             cx={fx} cy={fy}
                             r={r}
                             rot={seededRandom(seed, i + 300) * 360}
                             tone={tones[i % tones.length]}/>
        )
    }
    return <g opacity={opacity}>{items}</g>
}

// ============================================================
// КОВЁР ИЗ ОПАВШИХ ЦВЕТОВ
// ============================================================
function FlowerCarpet() {
    const flowers = []
    const seed = 321
    const count = 100

    for (let i = 0; i < count; i++) {
        const x = 4 + seededRandom(seed, i) * 92
        const y = 93 + seededRandom(seed, i + 100) * 6
        const r = 0.6 + seededRandom(seed, i + 200) * 0.8
        const tones = ['light', 'mid', 'deep', 'pale']
        const tone = tones[i % tones.length]
        const p = JACARANDA_TONES[tone]

        flowers.push(
            <ellipse key={i}
                     cx={x} cy={y}
                     rx={r * 1.3} ry={r * 0.75}
                     fill={p.petal}
                     opacity={0.7 + seededRandom(seed, i + 300) * 0.3}
                     transform={`rotate(${seededRandom(seed, i + 400) * 180} ${x} ${y})`}/>
        )
    }

    return (
        <g>
            <ellipse cx="50" cy="96" rx="48" ry="5" fill="#6b5540" opacity="0.9"/>
            <ellipse cx="50" cy="95" rx="40" ry="3.5" fill="#7a6450" opacity="0.9"/>
            {flowers}
        </g>
    )
}

// ============================================================
// SPROUT
// ============================================================
export function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <FlowerCarpet />

            <path d="M50 94 C46 88 52 82 50 76 C48 70 52 64 50 58"
                  stroke="#5a3a20" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <path d="M50 80 C44 76 40 72 38 66" stroke="#5a3a20" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
            <path d="M50 74 C56 70 60 66 62 60" stroke="#5a3a20" strokeWidth="2.4" strokeLinecap="round" fill="none"/>

            <FlowerRaceme x1={38} y1={66} x2={36} y2={78} seed={1} flowerCount={10}/>
            <FlowerRaceme x1={62} y1={60} x2={64} y2={74} seed={2} flowerCount={10}/>
            <FlowerRaceme x1={50} y1={58} x2={50} y2={74} seed={3} flowerCount={14}/>
        </svg>
    )
}

// ============================================================
// YOUNG
// ============================================================
export function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <FlowerCarpet />
            <MassiveWindingTrunk />

            {/* Верхние ветки с кистями */}
            <ChaoticBranch
                path="M52 20 C48 14 44 10 38 6"
                tips={[[38, 6], [42, 10], [46, 14]]}
                seed={10} maxLen={20}/>
            <ChaoticBranch
                path="M52 20 C56 14 62 10 68 6"
                tips={[[68, 6], [64, 10], [60, 14]]}
                seed={11} maxLen={20}/>

            {/* Правая большая ветвь */}
            <ChaoticBranch
                path="M52 36 C58 32 64 28 72 26"
                tips={[[72, 26], [66, 28], [60, 32]]}
                seed={12} maxLen={28}/>
            <ChaoticBranch
                path="M72 26 C78 22 84 20 88 18"
                tips={[[88, 18], [82, 22], [76, 24]]}
                seed={13} maxLen={26}/>
            <ChaoticBranch
                path="M72 26 C76 28 82 30 88 30"
                tips={[[88, 30], [82, 30], [76, 28]]}
                seed={14} maxLen={26}/>

            {/* Левая большая ветвь */}
            <ChaoticBranch
                path="M42 50 C34 46 26 42 20 36"
                tips={[[20, 36], [26, 40], [32, 44]]}
                seed={15} maxLen={28}/>
            <ChaoticBranch
                path="M20 36 C14 32 8 30 4 26"
                tips={[[4, 26], [10, 30], [16, 32]]}
                seed={16} maxLen={30}/>
            <ChaoticBranch
                path="M20 36 C16 40 12 44 8 48"
                tips={[[8, 48], [12, 44], [16, 40]]}
                seed={17} maxLen={28}/>

            {/* Мелкие ветки */}
            <ChaoticBranch
                path="M38 6 C32 4 26 4 20 8"
                tips={[[20, 8], [26, 5]]}
                seed={18} maxLen={22}/>
            <ChaoticBranch
                path="M68 6 C74 4 80 4 86 8"
                tips={[[86, 8], [80, 5]]}
                seed={19} maxLen={22}/>
            <ChaoticBranch
                path="M8 22 C4 18 2 14 2 10"
                tips={[[2, 10], [4, 16]]}
                seed={20} maxLen={18}/>
            <ChaoticBranch
                path="M86 16 C90 12 94 10 98 10"
                tips={[[98, 10], [94, 13]]}
                seed={21} maxLen={20}/>

            {/* Облака для заполнения — объёмнее */}
            <FlowerCloud cx={50} cy={8} radius={8} count={16} seed={50}/>
            <FlowerCloud cx={30} cy={28} radius={11} count={18} seed={51}/>
            <FlowerCloud cx={70} cy={28} radius={11} count={18} seed={52}/>
        </svg>
    )
}

// ============================================================
// MATURE — как на фото
// ============================================================
export function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <Aura id="jacarandaAura" color1="#c8a0e8" color2="#7040a8" />
            <circle cx="50" cy="45" r="50" fill="url(#jacarandaAura)" />

            <FlowerCarpet />
            <MassiveWindingTrunk />

            {/* ============ ХАОТИЧНЫЕ ВЕТКИ С КИСТЯМИ ============ */}

            {/* Верхние ветки вверх */}
            <ChaoticBranch
                path="M52 20 C48 14 44 10 38 6"
                tips={[[38, 6], [42, 10], [46, 14]]}
                seed={100} maxLen={18}/>
            <ChaoticBranch
                path="M52 20 C56 14 62 10 68 6"
                tips={[[68, 6], [64, 10], [60, 14]]}
                seed={101} maxLen={18}/>
            <ChaoticBranch
                path="M48 32 C42 28 38 22 34 16"
                tips={[[34, 16], [40, 22], [44, 28]]}
                seed={102} maxLen={20}/>
            <ChaoticBranch
                path="M56 48 C64 44 72 42 80 40"
                tips={[[80, 40], [72, 42], [64, 44]]}
                seed={103} maxLen={22}/>

            {/* Правая большая ветвь — идёт вправо-вверх */}
            <ChaoticBranch
                path="M52 36 C58 32 64 28 72 26"
                tips={[[72, 26], [66, 28], [60, 32], [70, 24]]}
                seed={110} maxLen={28}/>
            <ChaoticBranch
                path="M72 26 C78 22 84 20 88 18"
                tips={[[88, 18], [82, 22], [76, 24]]}
                seed={111} maxLen={26}/>
            <ChaoticBranch
                path="M72 26 C76 28 82 30 88 30"
                tips={[[88, 30], [82, 30], [76, 28]]}
                seed={112} maxLen={26}/>
            <ChaoticBranch
                path="M72 26 C76 22 82 20 86 16"
                tips={[[86, 16], [82, 20], [76, 22]]}
                seed={113} maxLen={24}/>

            {/* Левая большая ветвь — влево-вверх */}
            <ChaoticBranch
                path="M42 50 C34 46 26 42 20 36"
                tips={[[20, 36], [26, 40], [32, 44], [22, 34]]}
                seed={120} maxLen={28}/>
            <ChaoticBranch
                path="M20 36 C14 32 8 30 4 26"
                tips={[[4, 26], [10, 30], [16, 32]]}
                seed={121} maxLen={30}/>
            <ChaoticBranch
                path="M20 36 C16 40 12 44 8 48"
                tips={[[8, 48], [12, 44], [16, 40]]}
                seed={122} maxLen={28}/>
            <ChaoticBranch
                path="M8 22 C4 18 2 14 2 10"
                tips={[[2, 10], [4, 16], [6, 20]]}
                seed={123} maxLen={18}/>

            {/* Мелкие ветки-хаос */}
            <ChaoticBranch
                path="M38 6 C32 4 26 4 20 8"
                tips={[[20, 8], [26, 5], [22, 10]]}
                seed={130} maxLen={22}/>
            <ChaoticBranch
                path="M68 6 C74 4 80 4 86 8"
                tips={[[86, 8], [80, 5], [84, 10]]}
                seed={131} maxLen={22}/>
            <ChaoticBranch
                path="M34 16 C28 14 22 14 16 18"
                tips={[[16, 18], [22, 15], [18, 20]]}
                seed={132} maxLen={24}/>
            <ChaoticBranch
                path="M88 18 C92 16 96 16 98 20"
                tips={[[98, 20], [94, 16], [96, 14]]}
                seed={133} maxLen={20}/>
            <ChaoticBranch
                path="M86 16 C90 12 94 10 98 10"
                tips={[[98, 10], [94, 13], [96, 8]]}
                seed={134} maxLen={18}/>
            <ChaoticBranch
                path="M88 30 C92 32 96 34 98 38"
                tips={[[98, 38], [94, 33], [96, 36]]}
                seed={135} maxLen={22}/>
            <ChaoticBranch
                path="M80 40 C86 42 90 46 94 50"
                tips={[[94, 50], [88, 44], [92, 48]]}
                seed={136} maxLen={24}/>
            <ChaoticBranch
                path="M8 48 C6 52 4 56 2 62"
                tips={[[2, 62], [5, 56], [3, 60]]}
                seed={137} maxLen={22}/>

            {/* ============ ЦВЕТОЧНЫЕ ОБЛАКА — ОБЪЁМНЕЕ И ПЛОТНЕЕ ============ */}
            <FlowerCloud cx={50} cy={6} radius={9} count={20} seed={900}/>
            <FlowerCloud cx={38} cy={8} radius={8} count={18} seed={901}/>
            <FlowerCloud cx={62} cy={8} radius={8} count={18} seed={902}/>
            <FlowerCloud cx={26} cy={12} radius={8} count={18} seed={903}/>
            <FlowerCloud cx={74} cy={12} radius={8} count={18} seed={904}/>

            <FlowerCloud cx={20} cy={22} radius={10} count={20} seed={905}/>
            <FlowerCloud cx={80} cy={22} radius={10} count={20} seed={906}/>
            <FlowerCloud cx={50} cy={18} radius={11} count={22} seed={907}/>
            <FlowerCloud cx={32} cy={22} radius={9} count={18} seed={908}/>
            <FlowerCloud cx={68} cy={22} radius={9} count={18} seed={909}/>

            <FlowerCloud cx={12} cy={34} radius={10} count={20} seed={910}/>
            <FlowerCloud cx={88} cy={34} radius={10} count={20} seed={911}/>
            <FlowerCloud cx={50} cy={32} radius={12} count={24} seed={912}/>
            <FlowerCloud cx={30} cy={34} radius={10} count={20} seed={913}/>
            <FlowerCloud cx={70} cy={34} radius={10} count={20} seed={914}/>

            <FlowerCloud cx={20} cy={46} radius={11} count={22} seed={915}/>
            <FlowerCloud cx={80} cy={46} radius={11} count={22} seed={916}/>
            <FlowerCloud cx={50} cy={48} radius={12} count={24} seed={917}/>
            <FlowerCloud cx={36} cy={46} radius={10} count={20} seed={918}/>
            <FlowerCloud cx={64} cy={46} radius={10} count={20} seed={919}/>

            <FlowerCloud cx={14} cy={58} radius={10} count={20} seed={920}/>
            <FlowerCloud cx={86} cy={58} radius={10} count={20} seed={921}/>
            <FlowerCloud cx={50} cy={60} radius={11} count={22} seed={922}/>
            <FlowerCloud cx={34} cy={60} radius={10} count={20} seed={923}/>
            <FlowerCloud cx={66} cy={60} radius={10} count={20} seed={924}/>

            <SparkleRing colorScheme="pink" />
        </svg>
    )
}