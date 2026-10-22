import { useEffect, useState } from 'react'

/**
 * Реактивный CSS-медиазапрос.
 *
 * Компоненту иногда мало спрятать элемент через CSS: если десктопный
 * блок остаётся в DOM (display: none), он продолжает держать состояние,
 * висеть на хоткеях или грузить данные этой ветки. Для таких мест нужен
 * честный JS-ответ на «сейчас мобильный экран или нет».
 *
 * Совместимость: matchMedia есть везде, где реально живёт этот проект;
 * в тестах (jsdom) его может не быть — тогда считаем, что мы на десктопе,
 * чтобы мобильная ветка не включилась случайно.
 *
 * Значения по умолчанию повторяют MOBILE_MAX_WIDTH из mobile.css:
 * меньше 900px — мобильная раскладка, больше — десктопная без изменений.
 */
export const MOBILE_QUERY = '(max-width: 899px)'

function read(query) {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false
    }
    return window.matchMedia(query).matches
}

export default function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => read(query))

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined
        }
        const mql = window.matchMedia(query)
        const onChange = (e) => setMatches(e.matches)
        // Совпадение могло измениться между первым рендером и подпиской
        // (поворот экрана): сверяемся через rAF, чтобы не дёргать
        // setState синхронно внутри эффекта.
        const syncFrame = requestAnimationFrame(() => setMatches(mql.matches))
        // addEventListener есть в новых браузерах; addListener — запасной
        // путь для старых WebView, куда мы всё ещё попадаем через ngrok.
        if (mql.addEventListener) {
            mql.addEventListener('change', onChange)
            return () => {
                cancelAnimationFrame(syncFrame)
                mql.removeEventListener('change', onChange)
            }
        }
        mql.addListener(onChange)
        return () => {
            cancelAnimationFrame(syncFrame)
            mql.removeListener(onChange)
        }
    }, [query])

    return matches
}

/** Короткий хелпер: «сейчас телефон/узкий экран». */
export function useIsMobile() {
    return useMediaQuery(MOBILE_QUERY)
}
