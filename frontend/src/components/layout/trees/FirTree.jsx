// frontend/src/components/layout/trees/FirTree.jsx

/**
 * Пихта — конус из ярусов лап, верхушка светлее, шишки свисают вниз
 * (в отличие от ели, где они смотрят вверх).
 */

import { PALETTE, Ground, Trunk, Stage } from './kit'

const p = PALETTE.fir

/**
 * Ярус «лап»: широкая форма с зубчатым низом.
 * y — уровень основания яруса, w — половина ширины.
 */
function Tier({ y, w, drop = 7, tone = 'mid', notch = 4 }) {
    const tones = {
        light: { fill: '#3f8a4c', dark: '#1f5a2a' },
        mid: { fill: '#2f7040', dark: '#123f1f' },
        deep: { fill: '#215a31', dark: '#0a2e16' },
    }
    const c = tones[tone] || tones.mid

    // Зубчатый нижний край: чередуем «висящие» уголки лап
    let bottom = ''
    for (let i = 0; i < notch; i++) {
        const x0 = 50 + w - (2 * w * i) / notch
        const x1 = 50 + w - (2 * w * (i + 1)) / notch
        const mid = (x0 + x1) / 2
        bottom += ` L${mid} ${y + drop} L${x1} ${y}`
    }

    return (
        <g>
            <path d={`M50 ${y - drop * 1.5} L${50 + w} ${y}${bottom} Z`} fill={c.fill} />
            <path d={`M50 ${y - drop * 1.5} L${50 + w} ${y} L${50 + w * 0.35} ${y + drop * 0.55} Z`} fill={c.dark} opacity="0.45" />
            <path d={`M50 ${y - drop * 1.4} L${50 - w * 0.55} ${y - drop * 0.12} L50 ${y - drop * 0.05} Z`} fill="#6fb06c" opacity="0.32" />
        </g>
    )
}

function Cone({ x, y, s = 1 }) {
    return (
        <g>
            <path d={`M${x - 1.4 * s} ${y} L${x} ${y + 3 * s} L${x + 1.4 * s} ${y} Z`} fill="#8a5a2a" />
            <path d={`M${x - 1.4 * s} ${y} L${x + 1.4 * s} ${y} L${x + 1 * s} ${y - 0.9 * s} L${x - 1 * s} ${y - 0.9 * s} Z`} fill="#b07a3c" />
            <line x1={x} y1={y - 1.6 * s} x2={x} y2={y - 0.4 * s} stroke="#5e3b16" strokeWidth="0.4" />
        </g>
    )
}

export function SproutSVG() {
    return (
        <Stage>
            <Ground rx={15} tone="#5f8a3e" />
            <path d="M50 94 L50 78" stroke={p.bark.base} strokeWidth="2.4" strokeLinecap="round" />
            <Tier y={80} w={9} drop={4} tone="deep" notch={3} />
            <Tier y={72} w={7} drop={3.6} tone="mid" notch={3} />
            <Tier y={65} w={4.6} drop={3} tone="light" notch={2} />
        </Stage>
    )
}

export function YoungSVG() {
    return (
        <Stage>
            <Ground rx={20} tone="#5f8a3e" />
            <Trunk d="M50 94 L50 40" width={3.6} bark={p.bark} />
            <Tier y={88} w={15} drop={6} tone="deep" />
            <Tier y={78} w={13.5} drop={6} tone="mid" />
            <Tier y={68} w={12} drop={5.6} tone="deep" />
            <Tier y={58} w={10} drop={5.2} tone="mid" />
            <Tier y={48} w={7.6} drop={4.6} tone="light" />
            <Tier y={39} w={5} drop={4} tone="light" notch={3} />
            <Cone x={64} y={77} s={1.2} />
            <Cone x={36} y={67} s={1.1} />
        </Stage>
    )
}

export function MatureSVG() {
    return (
        <Stage>
            <ellipse cx="50" cy="90" rx="26" ry="7" fill={p.shade} opacity="0.16" />
            <Ground rx={24} tone="#5f8a3e" />
            <Trunk d="M50 96 L50 30" width={5.4} bark={p.bark} />
            <Tier y={92} w={26} drop={8} tone="deep" />
            <Tier y={82} w={24} drop={8} tone="mid" />
            <Tier y={72} w={22} drop={7.6} tone="deep" />
            <Tier y={62} w={19.5} drop={7.2} tone="mid" />
            <Tier y={52} w={16.5} drop={6.8} tone="deep" />
            <Tier y={43} w={13.5} drop={6.2} tone="mid" />
            <Tier y={34} w={10} drop={5.6} tone="light" />
            <Tier y={26} w={6.6} drop={5} tone="light" notch={3} />
            <Cone x={72} y={81} s={1.5} />
            <Cone x={30} y={71} s={1.4} />
            <Cone x={62} y={61} s={1.3} />
            <Cone x={40} y={51} s={1.2} />
            <Cone x={58} y={42} s={1.1} />
        </Stage>
    )
}
