import { useState } from 'react'
import { SvgAvatar } from './SvgAvatars'
import { resolveUrl } from '../../utils/format'

/**
 * Универсальная отрисовка аватарки.
 *
 * Порядок источников:
 *   1. загруженная картинка (imageUrl) — если файл существует;
 *   2. нарисованный SVG по code (SvgAvatars) — для аватарок без файла;
 *   3. emoji;
 *   4. первая буква имени.
 *
 * Если картинка не загрузилась (404/битый файл), молча переключаемся на
 * SVG/emoji/инициал: именно из-за отсутствующих файлов в магазине раньше
 * оставались пустые кружки.
 */
export default function AvatarArt({
                                       avatar,
                                       code,
                                       imageUrl,
                                       emoji,
                                       title,
                                       className = 'avatar-frame__img',
                                       emojiClassName = 'avatar-frame__emoji',
                                       emojiSize,
                                       style,
                                   }) {
    const finalCode = code ?? avatar?.code ?? null
    const finalEmoji = emoji ?? avatar?.emoji ?? null
    const finalTitle = title ?? avatar?.title ?? ''
    const src = resolveUrl(imageUrl ?? avatar?.imageUrl)

    const [failedSrc, setFailedSrc] = useState(null)

    const svg = finalCode ? SvgAvatar({ code: finalCode }) : null
    const initial = (finalTitle || '?').charAt(0).toUpperCase()

    if (src && failedSrc !== src) {
        return (
            <img
                src={src}
                alt={finalTitle}
                className={className}
                style={style}
                draggable={false}
                onError={() => setFailedSrc(src)}
            />
        )
    }

    if (svg) return svg

    if (finalEmoji) {
        return (
            <span
                className={emojiClassName}
                style={emojiSize ? { fontSize: emojiSize } : undefined}
            >
                {finalEmoji}
            </span>
        )
    }

    return (
        <span className="avatar-frame__initial" style={style}>
            {initial}
        </span>
    )
}
