import { useState } from 'react'

export default function HelpTip({ text }) {
    const [open, setOpen] = useState(false)

    return (
        <span
            className="help-tip"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Что это?"
        >
            ?
            {open && (
                <span className="help-tip__bubble" role="tooltip">
                    {text}
                </span>
            )}
        </span>
    )
}