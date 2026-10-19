// frontend/src/components/layout/trees/kit.jsx

/**
 * Ботанический «набор» для деревьев.
 *
 * Старый подход: каждое дерево набиралось сотнями листиков-эллипсов, у каждого
 * своя обводка и прожилки. В магазине/превью это дорого, а силуэт всё равно
 * выглядел «шумным».
 *
 * Новый подход: крона = несколько перекрывающихся капель (`Crown`), поверх —
 * фактура штрихами (`Texture`), по краю — редкие листья (`Edge`). Итог 40–70
 * узлов на дерево вместо 400–800, но читается объёмнее и заметно различается
 * по форме у каждого вида.
 *
 * Все функции принимают координаты в системе viewBox 100×100 (земля ~y=96),
 * поэтому дерево всегда «стоит» на одном уровне в сайдбаре и в превью.
 */

import { seededRandom } from './common'

const r1 = (v) => Math.round(v * 10) / 10

// ============================================================
// Пути
// ============================================================

/**
 * Замкнутый сглаженный путь (Catmull-Rom → кубические Безье).
 * Точки — массив [x, y].
 */
export function smoothClosed(pts) {
    if (pts.length < 3) return ''
    const n = pts.length
    let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`

    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n]
        const p1 = pts[i]
        const p2 = pts[(i + 1) % n]
        const p3 = pts[(i + 2) % n]

        const c1x = p1[0] + (p2[0] - p0[0]) / 6
        const c1y = p1[1] + (p2[1] - p0[1]) / 6
        const c2x = p2[0] - (p3[0] - p1[0]) / 6
        const c2y = p2[1] - (p3[1] - p1[1]) / 6

        d += ` C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(p2[0])} ${r1(p2[1])}`
    }
    return `${d} Z`
}

/**
 * «Пушистая» капля: эллипс, у которого радиус у каждой вершины гуляет по
 * псевдослучайному закону. Даёт живой, неровный контур кроны.
 */
export function blob(cx, cy, rx, ry = rx, seed = 1, points = 13, wobble = 0.14, rot = 0) {
    const pts = []
    for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2 + rot
        const w = 1 + (seededRandom(seed, i) - 0.5) * 2 * wobble
        pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w])
    }
    return smoothClosed(pts)
}

/**
 * Сборный путь из нескольких капель — одна заливка на всю крону.
 * Нужен для теней и градиентов: один <path>, а не N <path>.
 */
export function blobGroup(blobs, seed = 1, wobble = 0.13) {
    return blobs
        .map((b, i) => blob(b.cx, b.cy, b.rx, b.ry || b.rx, seed + i * 13, 13, wobble, b.rot || 0))
        .join(' ')
}

// ============================================================
// Палитры
// ============================================================
//
// fill  — основной тон листвы
// shade — тень (низ и дальняя сторона)
// hi    — блик (верх-лево)
// deep  — совсем тёмный контурный акцент
// bark  — { base, light, dark }

export const PALETTE = {
    oak:      { fill: '#6c9c42', shade: '#33591f', hi: '#b3d97b', deep: '#1f3d12', bark: { base: '#5a3d22', light: '#86613a', dark: '#33230f' } },
    maple:    { fill: '#d4552b', shade: '#8a2a10', hi: '#f59753', deep: '#5e1a06', bark: { base: '#57402a', light: '#7d5b3a', dark: '#2e2116' } },
    apple:    { fill: '#639f42', shade: '#2e5f22', hi: '#a9d477', deep: '#1d4517', bark: { base: '#6b4f30', light: '#946e45', dark: '#3a2a18' } },
    cherry:   { fill: '#e0819f', shade: '#a83f5f', hi: '#ffc9d9', deep: '#7d2745', bark: { base: '#5b3f2c', light: '#86603f', dark: '#312214' } },
    sakura:   { fill: '#f6aec7', shade: '#c76c92', hi: '#ffe2ee', deep: '#a04c6d', bark: { base: '#6d4f3d', light: '#97725a', dark: '#3c2a20' } },
    willow:   { fill: '#93c45c', shade: '#4b7a30', hi: '#d0eba0', deep: '#33581c', bark: { base: '#4f3a24', light: '#7a5a37', dark: '#2a1e11' } },
    palm:     { fill: '#54a03a', shade: '#21601a', hi: '#9ede66', deep: '#154311', bark: { base: '#9a7f4c', light: '#c4a76a', dark: '#5d4a26' } },
    coconut:  { fill: '#4a9a3c', shade: '#1c5c1e', hi: '#8fd46c', deep: '#124014', bark: { base: '#8f7345', light: '#bda067', dark: '#55431f' } },
    cypress:  { fill: '#256b36', shade: '#0b2f15', hi: '#4f9c52', deep: '#061f0c', bark: { base: '#4a3524', light: '#73583c', dark: '#241a10' } },
    banyan:   { fill: '#4e8b36', shade: '#1e4416', hi: '#8fbf63', deep: '#13300d', bark: { base: '#5c4a35', light: '#8b7355', dark: '#2e2416' } },
    fir:      { fill: '#2f7040', shade: '#10401f', hi: '#5fa45e', deep: '#082a12', bark: { base: '#4e3722', light: '#7a5633', dark: '#26190c' } },
    eucalyptus: { fill: '#8fa9a3', shade: '#4f6a68', hi: '#d3e4dc', deep: '#37514f', bark: { base: '#b6ae9b', light: '#ded7c7', dark: '#7c7565' } },
}

// ============================================================
// Земля и тень
// ============================================================

export function Ground({ rx = 30, y = 96, tone = '#7ea24a', dark = '#4f6f2e', dry = false }) {
    return (
        <g>
            <ellipse cx="50" cy={y} rx={rx * 1.18} ry={rx * 0.12} fill={dry ? '#8a7b52' : dark} opacity="0.28" />
            <ellipse cx="50" cy={y - 0.8} rx={rx} ry={rx * 0.085} fill={dry ? '#c4ad74' : tone} opacity="0.85" />
            <ellipse cx="47" cy={y - 1.4} rx={rx * 0.55} ry={rx * 0.045} fill={dry ? '#e0cd9a' : '#a9c96f'} opacity="0.6" />
        </g>
    )
}

// ============================================================
// Крона
// ============================================================

/**
 * Крона из перекрывающихся капель.
 *
 * blobs  — [{ cx, cy, rx, ry?, rot? }] от дальних к ближним
 * p      — палитра
 * opts.shadow / opts.gloss — сила тени и блика
 */
export function Crown({ blobs, p, seed = 1, shadow = 0.30, gloss = 0.20, depth = 4 }) {
    const all = blobs
    const main = blobGroup(all, seed)
    const silhouette = blobGroup(all, seed, 0.17)

    return (
        <g>
            {/* Объём: тёмная подложка снизу */}
            <path d={silhouette} fill={p.shade} opacity={shadow} transform={`translate(0 ${depth})`} />

            {/* Основная масса листвы одним путём */}
            <path d={main} fill={p.fill} />

            {/* Тень по нижней-правой стороне */}
            <path
                d={blobGroup(all, seed + 31, 0.15)}
                fill={p.shade}
                opacity={0.34}
                transform="translate(0 3) scale(0.97) translate(1.5 0)"
                style={{ transformOrigin: '50px 50px' }}
            />

            {/* Блик сверху-слева */}
            <g transform="translate(-1.6 -2.2)" opacity={gloss}>
                <path d={blobGroup(all, seed + 57, 0.22)} fill={p.hi} />
            </g>
        </g>
    )
}

/**
 * Фактура листвы: короткие штрихи внутри силуэта.
 * area — { cx, cy, rx, ry } — эллипс, в который они вписываются.
 */
export function Texture({ area, p, seed = 1, count = 26, size = 1.5, opacity = 0.45 }) {
    const { cx, cy, rx, ry = rx } = area
    const marks = []
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i) * Math.PI * 2
        const d = Math.sqrt(seededRandom(seed, i + 41)) * 0.9
        const x = cx + Math.cos(a) * rx * d
        const y = cy + Math.sin(a) * ry * d
        const s = size * (0.55 + seededRandom(seed, i + 97) * 0.8)
        const rot = seededRandom(seed, i + 131) * 180
        const dark = seededRandom(seed, i + 173) > 0.4
        marks.push(
            <ellipse
                key={i}
                cx={r1(x)}
                cy={r1(y)}
                rx={r1(s)}
                ry={r1(s * 0.46)}
                transform={`rotate(${Math.round(rot)} ${r1(x)} ${r1(y)})`}
                fill={dark ? p.shade : p.hi}
                opacity={dark ? opacity : opacity * 0.8}
            />,
        )
    }
    return <g>{marks}</g>
}

/**
 * Листья по краю кроны — ломают гладкий контур, чтобы силуэт не был «пузырём».
 * ring — массив [x, y] точек, по которым раскидываем листья.
 */
export function Edge({ ring, p, seed = 1, size = 2, count = 18 }) {
    if (!ring || ring.length === 0) return null
    const marks = []
    for (let i = 0; i < count; i++) {
        const base = ring[Math.floor(seededRandom(seed, i + 5) * ring.length)]
        const x = base[0] + (seededRandom(seed, i + 61) - 0.5) * 2.4
        const y = base[1] + (seededRandom(seed, i + 71) - 0.5) * 2.4
        const rot = seededRandom(seed, i + 83) * 360
        const s = size * (0.55 + seededRandom(seed, i + 89) * 0.6)
        marks.push(
            <ellipse
                key={i}
                cx={r1(x)}
                cy={r1(y)}
                rx={r1(s)}
                ry={r1(s * 0.42)}
                transform={`rotate(${Math.round(rot)} ${r1(x)} ${r1(y)})`}
                fill={seededRandom(seed, i + 101) > 0.45 ? p.fill : p.shade}
            />,
        )
    }
    return <g>{marks}</g>
}

/**
 * Кольцо точек по периметру эллипса — удобный источник для <Edge>.
 */
export function ringPoints(cx, cy, rx, ry = rx, count = 20, seed = 1) {
    const pts = []
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
        const w = 0.92 + seededRandom(seed, i) * 0.16
        pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w])
    }
    return pts
}

// ============================================================
// Ствол и ветви
// ============================================================

/**
 * Ствол: заливка по контуру (без «скелетной» обводки) + светлая грань
 * + тёмная правая грань. Форма по пути; ширина taper-том.
 */
export function Trunk({ d, width = 7, bark, taper = 0.45 }) {
    return (
        <g>
            <path d={d} stroke={bark.base} strokeWidth={width} strokeLinecap="round" fill="none" />
            <path
                d={d}
                stroke={bark.light}
                strokeWidth={width * 0.34}
                strokeLinecap="round"
                fill="none"
                opacity="0.5"
                transform="translate(-1.1 0)"
            />
            <path
                d={d}
                stroke={bark.dark}
                strokeWidth={width * taper * 0.5}
                strokeLinecap="round"
                fill="none"
                opacity="0.42"
                transform="translate(1.5 0)"
            />
        </g>
    )
}

/** Сучья одним цветом: основа + светлая грань. */
export function Branches({ ds, bark, width = 3 }) {
    return (
        <g>
            {ds.map((d, i) => (
                <path key={i} d={d} stroke={bark.base} strokeWidth={width * (1 - i * 0.06)} strokeLinecap="round" fill="none" />
            ))}
            {ds.map((d, i) => (
                <path
                    key={`l${i}`}
                    d={d}
                    stroke={bark.light}
                    strokeWidth={width * 0.3}
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.45"
                    transform="translate(-0.7 -0.5)"
                />
            ))}
        </g>
    )
}

/** Засечки коры вдоль ствола. */
export function Bark({ x = 50, y1, y2, seed = 1, count = 5, color, width = 0.8, spread = 2.4 }) {
    const span = y2 - y1
    const marks = []
    for (let i = 0; i < count; i++) {
        const y = y1 + (span * (i + 0.5)) / count
        const dx = (seededRandom(seed, i) - 0.5) * spread * 2
        const len = 1.4 + seededRandom(seed, i + 17) * 2
        marks.push(
            <line
                key={i}
                x1={r1(x + dx - len / 2)}
                y1={r1(y)}
                x2={r1(x + dx + len / 2)}
                y2={r1(y)}
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                opacity="0.5"
            />,
        )
    }
    return <g>{marks}</g>
}

// ============================================================
// Плоды
// ============================================================

/**
 * Круглый плод с бликом и тенью. Тот же приём работает для яблок, вишен,
 * орехов, оливок — отличается только цветом и размером.
 */
export function Berry({ cx, cy, r = 2.4, color = '#d0342c', shade = '#8a1a14', hi = '#f47b72', stem = true, leaf = false }) {
    return (
        <g>
            {stem && (
                <line
                    x1={cx}
                    y1={cy - r * 0.8}
                    x2={cx + r * 0.15}
                    y2={cy - r * 1.6}
                    stroke="#43301f"
                    strokeWidth={r * 0.18}
                    strokeLinecap="round"
                />
            )}
            <circle cx={cx} cy={cy} r={r} fill={color} />
            <path
                d={`M${r1(cx - r * 0.75)} ${r1(cy + r * 0.6)} A${r1(r * 0.95)} ${r1(r * 0.95)} 0 0 0 ${r1(cx + r * 0.85)} ${r1(cy + r * 0.35)}`}
                fill={shade}
                opacity="0.55"
            />
            <circle cx={r1(cx - r * 0.32)} cy={r1(cy - r * 0.35)} r={r * 0.26} fill={hi} opacity="0.85" />
            {leaf && (
                <path
                    d={`M${r1(cx + r * 0.1)} ${r1(cy - r * 1.5)}
                        C${r1(cx + r * 0.8)} ${r1(cy - r * 1.9)} ${r1(cx + r * 1.5)} ${r1(cy - r * 1.4)} ${r1(cx + r * 1.5)} ${r1(cy - r * 1)}
                        C${r1(cx + r * 0.9)} ${r1(cy - r * 0.9)} ${r1(cx + r * 0.3)} ${r1(cy - r * 1.05)} ${r1(cx + r * 0.1)} ${r1(cy - r * 1.5)} Z`}
                    fill="#5a9f3a"
                    stroke="#3a7520"
                    strokeWidth={r * 0.08}
                />
            )}
        </g>
    )
}

/** Скопление плодов в кроне: детерминированно раскладываем по эллипсу. */
export function Fruits({ area, seed = 1, count = 5, r = 2.2, colors, avoid = 0.42 }) {
    const { cx, cy, rx, ry = rx } = area
    const items = []
    for (let i = 0; i < count; i++) {
        const a = seededRandom(seed, i + 7) * Math.PI * 2
        const d = avoid + Math.sqrt(seededRandom(seed, i + 53)) * (0.92 - avoid)
        const x = cx + Math.cos(a) * rx * d
        const y = cy + Math.sin(a) * ry * d + r * 0.6
        const c = colors[i % colors.length]
        items.push(
            <Berry key={i} cx={r1(x)} cy={r1(y)} r={r * (0.82 + seededRandom(seed, i + 91) * 0.4)} {...c} />,
        )
    }
    return <g>{items}</g>
}

// ============================================================
// Каркас стадий
// ============================================================

/** Обёртка SVG — чтобы не повторять атрибуты в каждом дереве. */
export function Stage({ children }) {
    return (
        <svg
            viewBox="0 0 100 100"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
        >
            {children}
        </svg>
    )
}

/** Дефолтные пропорции ствола для каждой стадии. */
export const STAGE_GEO = {
    sprout: { base: 94, top: 62, width: 3.4, spread: 7 },
    young:  { base: 94, top: 34, width: 5, spread: 17 },
    mature: { base: 96, top: 16, width: 8, spread: 31 },
}
