import { useState, useRef, useEffect } from 'react'

/**
 * InlineEdit — двойной клик по тексту → редактирование.
 *
 * props:
 *   value       — текущее значение
 *   onSave      — async (newValue) => void | Promise
 *   multiline   — если true, рендерит <textarea>
 *                 Enter сохраняет (только с Ctrl), Shift+Enter — перенос строки
 *                 Ctrl+Enter — тоже сохранить (для multiline)
 *   placeholder — заглушка, если пусто
 *   className   — класс обёртки (span в режиме просмотра)
 *   inputClassName — класс input/textarea в режиме редактирования
 *   title       — подсказка при наведении
 *   disabled    — отключить редактирование
 */
export default function InlineEdit({
                                       value,
                                       onSave,
                                       multiline = false,
                                       placeholder = '—',
                                       className = '',
                                       inputClassName = 'input',
                                       title = 'Двойной клик для редактирования',
                                       disabled = false,
                                   }) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value ?? '')
    const [saving, setSaving] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        setDraft(value ?? '')
    }, [value])

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
            const len = inputRef.current.value.length
            try { inputRef.current.setSelectionRange(len, len) } catch {}
            if (multiline) {
                inputRef.current.style.height = 'auto'
                inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
            }
        }
    }, [editing, multiline])

    const startEdit = (e) => {
        if (disabled) return
        e.stopPropagation()
        setEditing(true)
    }

    const cancel = () => {
        setDraft(value ?? '')
        setEditing(false)
    }

    const commit = async () => {
        const trimmed = draft.trim()
        const original = (value ?? '').trim()
        if (trimmed === original) {
            setEditing(false)
            return
        }
        setSaving(true)
        try {
            await onSave?.(trimmed)
            setEditing(false)
        } catch {
            setDraft(value ?? '')
            setEditing(false)
        } finally {
            setSaving(false)
        }
    }

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.stopPropagation()
            cancel()
            return
        }

        if (e.key === 'Enter') {
            if (multiline) {
                // Ctrl/Cmd+Enter — сохранить; иначе — перенос строки (по умолчанию)
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault()
                    commit()
                }
                return
            }
            e.preventDefault()
            commit()
        }
    }

    if (editing) {
        const common = {
            ref: inputRef,
            value: draft,
            onChange: (e) => {
                setDraft(e.target.value)
                if (multiline) {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                }
            },
            onBlur: commit,
            onKeyDown,
            disabled: saving,
            className: inputClassName,
            onClick: (e) => e.stopPropagation(),
            onPointerDown: (e) => e.stopPropagation(),
            onDoubleClick: (e) => e.stopPropagation(),
        }

        return multiline
            ? <textarea {...common} rows={2} style={{ resize: 'vertical' }} />
            : <input {...common} type="text" />
    }

    const isEmpty = !value || !String(value).trim()

    return (
        <span
            className={className}
            onDoubleClick={startEdit}
            title={disabled ? undefined : title}
            style={isEmpty ? { opacity: 0.55, fontStyle: 'italic' } : undefined}
        >
            {isEmpty ? placeholder : value}
        </span>
    )
}