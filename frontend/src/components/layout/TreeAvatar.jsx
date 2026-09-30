// Дерево сакуры: 3 стадии роста по количеству выполненных задач ЗА СЕГОДНЯ.
// 0-2 → росток, 3-9 → молодое дерево, 10+ → взрослое пышное дерево.
// Размер растёт внутри стадии, максимум — до середины трея (50vh).

const STAGES = {
    sprout: { min: 0, max: 2, label: 'Росток' },
    young:  { min: 3, max: 9, label: 'Молодое дерево' },
    mature: { min: 10, max: 999, label: 'Взрослое дерево' },
}

function getStage(done) {
    if (done >= 10) return 'mature'
    if (done >= 3) return 'young'
    return 'sprout'
}

function getProgress(done) {
    const stage = getStage(done)
    const { min, max } = STAGES[stage]
    if (max === min) return 1
    return Math.min(1, Math.max(0, (done - min) / (max - min)))
}

export default function TreeAvatar({ done = 0, maxHeight = 400 }) {
    const stage = getStage(done)
    const progress = getProgress(done)

    const cap = Math.min(maxHeight, Math.floor(window.innerHeight * 0.5))

    let size
    if (stage === 'sprout') {
        size = 40 + progress * 30
    } else if (stage === 'young') {
        size = 100 + progress * 80
    } else {
        size = 220 + progress * (cap - 220)
    }

    return (
        <div
            className={`tree-avatar tree-avatar--${stage}`}
            style={{ width: size, height: size }}
            title={`Выполнено сегодня: ${done} (${STAGES[stage].label})`}
        >
            {stage === 'sprout' && <SproutSVG />}
            {stage === 'young' && <YoungSVG />}
            {stage === 'mature' && <MatureSVG />}
        </div>
    )
}

/* ---------- Палитры ---------- */

const PALETTES = {
    light: { petal: '#ffd3e6', petalEdge: '#f9a8cd', core: '#ffe9a8', stamen: '#d34f8c' },
    mid:   { petal: '#f7b8d0', petalEdge: '#ec7fb1', core: '#ffd97a', stamen: '#b83b74' },
    deep:  { petal: '#ec7fb1', petalEdge: '#d34f8c', core: '#f4b942', stamen: '#8f2057' },
    pale:  { petal: '#ffe0ee', petalEdge: '#fcc3db', core: '#fff0c0', stamen: '#e88fbb' },
}

/* ---------- SVG примитивы ---------- */

// Один цветок сакуры: 5 лепестков, сердцевина, тычинки.
function SakuraFlower({ cx, cy, r = 5, rot = 0, hue = 'mid' }) {
    const p = PALETTES[hue] || PALETTES.mid

    const petals = []
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72 + rot) * (Math.PI / 180)
        const px = cx + Math.cos(angle) * r * 0.55
        const py = cy + Math.sin(angle) * r * 0.55
        petals.push(
            <ellipse
                key={i}
                cx={px}
                cy={py}
                rx={r * 0.5}
                ry={r * 0.35}
                transform={`rotate(${i * 72 + rot} ${px} ${py})`}
                fill={p.petal}
                stroke={p.petalEdge}
                strokeWidth={r * 0.06}
            />
        )
    }

    return (
        <g>
            {petals}
            <circle cx={cx} cy={cy} r={r * 0.22} fill={p.core} />
            <line x1={cx} y1={cy} x2={cx - r * 0.28} y2={cy - r * 0.28}
                  stroke={p.stamen} strokeWidth={r * 0.06} opacity="0.7"/>
            <line x1={cx} y1={cy} x2={cx + r * 0.28} y2={cy - r * 0.22}
                  stroke={p.stamen} strokeWidth={r * 0.06} opacity="0.7"/>
            <line x1={cx} y1={cy} x2={cx + r * 0.22} y2={cy + r * 0.28}
                  stroke={p.stamen} strokeWidth={r * 0.06} opacity="0.7"/>
        </g>
    )
}

// Крона: россыпь цветов и бутонов.
function BlossomCluster({ cx, cy, r = 12, seed = 0, density = 1 }) {
    const rnd = (i) => {
        const x = Math.sin(seed * 9301 + i * 49297) * 233280
        return x - Math.floor(x)
    }

    const flowers = []
    const count = Math.round(5 * density)
    const variants = ['light', 'mid', 'deep', 'pale', 'mid']

    for (let i = 0; i < count; i++) {
        const a = rnd(i) * Math.PI * 2
        const dist = r * (0.15 + rnd(i + 10) * 0.7)
        const fx = cx + Math.cos(a) * dist
        const fy = cy + Math.sin(a) * dist
        flowers.push(
            <SakuraFlower
                key={i}
                cx={fx}
                cy={fy}
                r={r * 0.28 + rnd(i + 20) * r * 0.14}
                rot={rnd(i + 30) * 360}
                hue={variants[i % variants.length]}
            />
        )
    }

    const buds = []
    const budCount = Math.round(3 * density)
    for (let i = 0; i < budCount; i++) {
        const a = rnd(i + 100) * Math.PI * 2
        const dist = r * (0.55 + rnd(i + 200) * 0.4)
        const bx = cx + Math.cos(a) * dist
        const by = cy + Math.sin(a) * dist
        buds.push(
            <g key={`b${i}`}>
                <circle cx={bx} cy={by} r={r * 0.09}
                        fill="#ec7fb1" stroke="#b83b74" strokeWidth={r * 0.02} />
                <circle cx={bx - r * 0.02} cy={by - r * 0.02} r={r * 0.04} fill="#ffd3e6" />
            </g>
        )
    }

    return (
        <g>
            {flowers}
            {buds}
        </g>
    )
}

// Ветка с бликом
function Branch({ d, width = 3, color = '#4e332a', highlight = '#6d4a3a' }) {
    return (
        <g>
            <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />
            <path d={d} stroke={highlight} strokeWidth={width * 0.35} strokeLinecap="round" fill="none" opacity="0.5" />
        </g>
    )
}

// Падающий лепесток
function FallingPetal({ cx, cy, r = 1.2, rot = 0, hue = 'light' }) {
    const colors = {
        light: '#ffd3e6',
        mid: '#f7b8d0',
        deep: '#ec7fb1',
    }
    const c = colors[hue] || colors.light
    return (
        <g transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.85">
            <path
                d={`M${cx} ${cy - r * 1.5} C${cx + r * 1.4} ${cy - r * 0.6} ${cx + r * 1.2} ${cy + r * 0.9} ${cx} ${cy + r * 1.4} C${cx - r * 1.2} ${cy + r * 0.9} ${cx - r * 1.4} ${cy - r * 0.6} ${cx} ${cy - r * 1.5} Z`}
                fill={c}
            />
        </g>
    )
}

/* ---------- Стадии ---------- */

function SproutSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <ellipse cx="50" cy="94" rx="18" ry="3" fill="#8a6a52" opacity="0.85" />
            <ellipse cx="50" cy="93" rx="14" ry="2" fill="#b28c6e" opacity="0.8" />
            <path d="M36 93 L34 88 M40 93 L41 87 M44 93 L43 89"
                  stroke="#5c8f4a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <path d="M56 93 L57 88 M60 93 L59 87 M64 93 L66 89"
                  stroke="#5c8f4a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>

            <path
                d="M50 94 C48 82 52 74 50 62"
                stroke="#4e332a" strokeWidth="3.4" strokeLinecap="round" fill="none"
            />
            <path
                d="M50 94 C48 82 52 74 50 62"
                stroke="#6d4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none"
                opacity="0.55"
            />

            <path
                d="M50 78 C42 76 38 72 36 66"
                stroke="#4e332a" strokeWidth="2.2" strokeLinecap="round" fill="none"
            />
            <path
                d="M40 74 C38 72 36 71 34 71 C35 73 37 74 40 74 Z"
                fill="#7fb069"
            />
            <SakuraFlower cx={36} cy={64} r={4.2} rot={20} hue="light" />

            <path
                d="M50 72 C58 70 62 66 64 60"
                stroke="#4e332a" strokeWidth="2.2" strokeLinecap="round" fill="none"
            />
            <path
                d="M60 68 C62 66 64 65 66 65 C65 67 63 68 60 68 Z"
                fill="#7fb069"
            />
            <SakuraFlower cx={64} cy={58} r={4.6} rot={-15} hue="mid" />

            <BlossomCluster cx={50} cy={55} r={8} seed={1} density={0.7} />
        </svg>
    )
}

function YoungSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <ellipse cx="50" cy="95" rx="24" ry="3.5" fill="#8a6a52" opacity="0.9" />
            <ellipse cx="50" cy="94" rx="18" ry="2.2" fill="#b28c6e" opacity="0.8" />
            <path d="M30 94 L28 88 M34 94 L34 87 M38 94 L39 88 M42 94 L41 87"
                  stroke="#5c8f4a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <path d="M58 94 L59 87 M62 94 L63 88 M66 94 L65 87 M70 94 L72 88"
                  stroke="#5c8f4a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>

            <path d="M44 92 C42 94 38 95 36 95" stroke="#4e332a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <path d="M56 92 C58 94 62 95 64 95" stroke="#4e332a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>

            <path
                d="M50 94 C47 82 53 74 50 62 C48 54 52 46 50 38"
                stroke="#4e332a" strokeWidth="5" strokeLinecap="round" fill="none"
            />
            <path d="M48 88 C46 80 49 74 47 66" stroke="#6d4a3a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M52 84 C54 76 51 68 52 60" stroke="#6d4a3a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M49 56 C48 50 51 46 50 42" stroke="#6d4a3a" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.6"/>

            <Branch d="M50 68 C40 64 34 60 30 52" width={3} />
            <Branch d="M50 62 C60 58 66 54 70 46" width={3} />
            <Branch d="M50 46 C44 42 40 38 38 34" width={2} />
            <Branch d="M50 42 C56 38 60 34 62 30" width={2} />

            <path d="M36 60 C34 58 33 56 33 54 C35 55 36 57 36 60 Z" fill="#7fb069" opacity="0.85" />
            <path d="M64 56 C66 54 68 53 70 53 C69 55 67 56 64 56 Z" fill="#7fb069" opacity="0.85" />
            <path d="M42 42 C40 40 39 38 39 36 C41 37 42 39 42 42 Z" fill="#7fb069" opacity="0.85" />

            <BlossomCluster cx={30} cy={50} r={11} seed={3} density={1.2} />
            <BlossomCluster cx={70} cy={46} r={12} seed={5} density={1.2} />
            <BlossomCluster cx={50} cy={32} r={14} seed={7} density={1.4} />
            <BlossomCluster cx={40} cy={34} r={8} seed={11} density={1} />
            <BlossomCluster cx={60} cy={30} r={9} seed={13} density={1} />

            <FallingPetal cx={24} cy={60} r={1.2} rot={30} hue="light" />
            <FallingPetal cx={76} cy={58} r={1.1} rot={-20} hue="mid" />
            <FallingPetal cx={54} cy={68} r={1.1} rot={50} hue="deep" />
        </svg>
    )
}

function MatureSVG() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <ellipse cx="50" cy="96" rx="36" ry="4" fill="#8a6a52" opacity="0.9" />
            <ellipse cx="50" cy="95" rx="28" ry="2.5" fill="#b28c6e" opacity="0.8" />
            <path d="M16 96 L14 88 M20 96 L20 87 M24 96 L25 88 M28 96 L28 87 M32 96 L33 88"
                  stroke="#5c8f4a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
            <path d="M68 96 L69 88 M72 96 L72 87 M76 96 L76 88 M80 96 L82 87 M84 96 L84 88"
                  stroke="#5c8f4a" strokeWidth="0.8" strokeLinecap="round" fill="none"/>

            <path d="M42 92 C38 94 32 96 28 96" stroke="#4e332a" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M46 92 C42 95 38 96 34 96" stroke="#4e332a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <path d="M58 92 C62 94 68 96 72 96" stroke="#4e332a" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M54 92 C58 95 62 96 66 96" stroke="#4e332a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>

            <path
                d="M50 96 C42 84 54 74 48 60 C44 50 54 42 50 30"
                stroke="#4e332a" strokeWidth="6" strokeLinecap="round" fill="none"
            />
            <path d="M46 90 C42 82 48 74 46 64" stroke="#6d4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8"/>
            <path d="M52 86 C56 78 50 68 52 58" stroke="#6d4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8"/>
            <path d="M49 76 C47 70 51 62 49 54" stroke="#8a6a52" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
            <path d="M50 62 C52 56 48 48 50 42" stroke="#6d4a3a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7"/>

            <Branch d="M48 62 C34 58 24 50 18 40" width={4} />
            <Branch d="M50 58 C66 54 78 48 84 38" width={4} />
            <Branch d="M48 44 C38 40 30 32 26 24" width={3} />
            <Branch d="M50 42 C62 38 70 30 74 22" width={3} />
            <Branch d="M50 30 C46 24 44 20 44 16" width={2.4} />
            <Branch d="M50 30 C54 26 58 22 58 18" width={2.4} />

            <Branch d="M24 42 C20 38 18 34 18 30" width={1.8} />
            <Branch d="M30 34 C28 30 26 26 28 22" width={1.8} />
            <Branch d="M70 32 C72 26 74 22 78 18" width={1.8} />
            <Branch d="M80 42 C84 38 86 34 86 30" width={1.8} />
            <Branch d="M18 40 C14 38 12 34 12 30" width={1.4} />
            <Branch d="M84 38 C88 36 90 32 92 28" width={1.4} />
            <Branch d="M38 28 C34 26 30 24 28 20" width={1.4} />
            <Branch d="M62 26 C66 24 70 20 72 16" width={1.4} />

            <path d="M22 40 C20 38 19 36 19 33 C21 35 22 37 22 40 Z" fill="#7fb069" opacity="0.85"/>
            <path d="M78 40 C80 38 82 37 84 37 C83 39 81 40 78 40 Z" fill="#7fb069" opacity="0.85"/>
            <path d="M42 28 C40 26 39 24 39 22 C41 23 42 25 42 28 Z" fill="#7fb069" opacity="0.85"/>
            <path d="M58 24 C60 22 62 21 64 21 C63 23 61 24 58 24 Z" fill="#7fb069" opacity="0.85"/>
            <path d="M28 26 C26 24 25 22 25 20 C27 21 28 23 28 26 Z" fill="#7fb069" opacity="0.85"/>

            <BlossomCluster cx={18} cy={38} r={13} seed={101} density={1.5} />
            <BlossomCluster cx={30} cy={26} r={14} seed={103} density={1.6} />
            <BlossomCluster cx={50} cy={16} r={16} seed={107} density={1.8} />
            <BlossomCluster cx={70} cy={24} r={14} seed={109} density={1.6} />
            <BlossomCluster cx={82} cy={36} r={13} seed={113} density={1.5} />
            <BlossomCluster cx={42} cy={30} r={12} seed={127} density={1.4} />
            <BlossomCluster cx={60} cy={34} r={12} seed={131} density={1.4} />
            <BlossomCluster cx={50} cy={42} r={10} seed={137} density={1.2} />
            <BlossomCluster cx={22} cy={30} r={9} seed={139} density={1.1} />
            <BlossomCluster cx={80} cy={28} r={10} seed={149} density={1.2} />
            <BlossomCluster cx={50} cy={28} r={9} seed={151} density={1.1} />

            <FallingPetal cx={20} cy={54} r={1.4} rot={30} hue="light" />
            <FallingPetal cx={30} cy={60} r={1.2} rot={-10} hue="mid" />
            <FallingPetal cx={42} cy={66} r={1.3} rot={60} hue="deep" />
            <FallingPetal cx={58} cy={62} r={1.2} rot={-40} hue="light" />
            <FallingPetal cx={72} cy={56} r={1.4} rot={15} hue="mid" />
            <FallingPetal cx={84} cy={48} r={1.2} rot={-60} hue="deep" />
            <FallingPetal cx={50} cy={72} r={1.1} rot={80} hue="light" />
            <FallingPetal cx={36} cy={74} r={1.1} rot={-30} hue="mid" />
            <FallingPetal cx={64} cy={78} r={1.1} rot={45} hue="deep" />
        </svg>
    )
}