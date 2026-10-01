import { useRef, useState, useEffect } from 'react'

/**
 * Простой rich-text редактор на contentEditable.
 * Без кнопки "Сохранить" внутри — сохранение через родителя (Modal footer)
 * или через onBlur/Ctrl+Enter.
 */
export default function DetailTextEditor({
                                             value,
                                             onSave,
                                             placeholder = 'Нажми, чтобы отредактировать...',
                                             title = 'Нажми, чтобы редактировать',
                                             disabled = false,
                                             autoFocus = false,
                                         }) {
    const ref = useRef(null)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    // При входе в режим редактирования — копируем HTML в contentEditable
    useEffect(() => {
        if (!editing) return
        if (!ref.current) return
        // Очищаем и заново устанавливаем содержимое
        ref.current.innerHTML = sanitizeHtml(value || '')
        // Автофокус
        requestAnimationFrame(() => {
            ref.current?.focus()
            // каретку в конец
            if (ref.current) {
                const range = document.createRange()
                range.selectNodeContents(ref.current)
                range.collapse(false)
                const sel = window.getSelection()
                sel?.removeAllRanges()
                sel?.addRange(range)
            }
        })
    }, [editing, value])

    // Режим просмотра — обновляем HTML при изменении value
    useEffect(() => {
        if (editing) return
        if (!ref.current) return
        ref.current.innerHTML = sanitizeHtml(value || '')
    }, [value, editing])

    const startEdit = (e) => {
        if (disabled) return
        e?.stopPropagation?.()
        setEditing(true)
    }

    const commit = async () => {
        if (!ref.current) return
        const html = sanitizeHtml(ref.current.innerHTML)
        const original = sanitizeHtml(value || '')
        if (html === original) {
            setEditing(false)
            return
        }
        setSaving(true)
        try {
            await onSave?.(html)
            setEditing(false)
        } catch {
            setEditing(false)
        } finally {
            setSaving(false)
        }
    }

    const cancel = () => {
        setEditing(false)
    }

    const exec = (cmd, arg) => {
        ref.current?.focus()
        document.execCommand(cmd, false, arg)
    }

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.stopPropagation()
            cancel()
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            commit()
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault()
            exec('bold')
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault()
            exec('italic')
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
            e.preventDefault()
            exec('underline')
        }
    }

    // Вставляем только plain text при paste — избегаем вложенных элементов
    const onPaste = (e) => {
        e.preventDefault()
        const text = (e.clipboardData || window.clipboardData).getData('text/plain')
        document.execCommand('insertText', false, text)
    }

    // Внутри компонента "Скрыть" кнопку Сохранить, чтобы не было дубля
    if (editing) {
        return (
            <div className="rte rte--editing" onClick={(e) => e.stopPropagation()}>
                <div className="rte__toolbar">
                    <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} title="Жирный (Ctrl+B)"><b>B</b></button>
                    <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} title="Курсив (Ctrl+I)"><i>I</i></button>
                    <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} title="Подчёркнутый (Ctrl+U)"><u>U</u></button>
                    <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('strikeThrough')} title="Зачёркнутый"><s>S</s></button>
                    <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', '<pre>')} title="Код">{'</>'}</button>
                    <span className="rte__spacer" />
                    <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={cancel} title="Отмена (Esc)">×</button>
                </div>
                <div
                    ref={ref}
                    className="rte__content"
                    contentEditable={!saving}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    onBlur={commit}
                    suppressContentEditableWarning
                />
            </div>
        )
    }

    const isEmpty = !value || !stripHtml(value).trim()

    return (
        <div
            className={`rte rte--view ${isEmpty ? 'rte--empty' : ''}`}
            onClick={startEdit}
            title={disabled ? undefined : title}
        >
            {isEmpty
                ? <span className="rte__placeholder">{placeholder}</span>
                : <div className="rte__html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />}
        </div>
    )
}

// Очищаем от вложенных .rte, script, style и прочего мусора
function sanitizeHtml(html) {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    // Удаляем вложенные .rte
    tmp.querySelectorAll('.rte').forEach(el => el.remove())
    // Удаляем script/style
    tmp.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove())
    // Разворачиваем вложенные div, оставляя только разрешённые теги
    const allowed = new Set(['B','I','U','S','STRONG','EM','PRE','CODE','BR','P','DIV','SPAN','UL','OL','LI'])
    const walk = (node) => {
        const children = Array.from(node.childNodes)
        for (const child of children) {
            if (child.nodeType === 1) {
                if (!allowed.has(child.tagName)) {
                    // заменяем на его текстовое содержимое
                    const text = document.createTextNode(child.textContent)
                    child.parentNode.replaceChild(text, child)
                } else {
                    walk(child)
                }
            }
        }
    }
    walk(tmp)
    return tmp.innerHTML
}

function stripHtml(html) {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || ''
}