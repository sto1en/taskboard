import { Link } from 'react-router-dom'
import useT from '../hooks/useT'

export default function HelpPage() {
    const t = useT()

    const sections = {
        quickStart: t.helpQuickStart || 'Quick start',
        concepts: t.helpConcepts || 'Concepts',
        views: t.helpViews || 'Views',
        hotkeys: t.helpHotkeys || 'Hotkeys',
        contact: t.helpContact || 'Contact',
        back: t.backToBoards || '← Back to boards',
    }

    return (
        <div className="info-page">
            <h1 className="info-page__title">{t.help || 'Help'}</h1>

            <section className="info-page__section">
                <h2>{sections.quickStart}</h2>
                <ol>
                    <li>Create a board — a direction of work (e.g. "Photography")</li>
                    <li>A main project <b>main</b> will be created automatically inside the board</li>
                    <li>Add tasks directly to this project — this is the simple mode</li>
                    <li>When structure is needed — create new projects and stages</li>
                </ol>
            </section>

            <section className="info-page__section">
                <h2>{sections.concepts}</h2>
                <dl className="info-page__defs">
                    <dt>Board</dt>
                    <dd>A direction of work. Contains projects.</dd>

                    <dt>Project</dt>
                    <dd>A specific piece of work inside a direction. Contains tasks and (optionally) stages.</dd>

                    <dt>Stage</dt>
                    <dd>A project phase (Preparation, Shooting, Editing). Optional.</dd>

                    <dt>Task</dt>
                    <dd>A concrete action. May have subtasks, tags, deadline, and attachments.</dd>

                    <dt>Status</dt>
                    <dd>A task state (Backlog, In Progress, Done). Configured per board.</dd>

                    <dt>Tag</dt>
                    <dd>A label for filtering tasks inside a board.</dd>
                </dl>
            </section>

            <section className="info-page__section">
                <h2>{sections.views}</h2>
                <ul>
                    <li><b>Table</b> — columns by status</li>
                    <li><b>List</b> — flat task list (like a document)</li>
                    <li><b>Compact</b> — status groups with collapsing</li>
                </ul>
                <p>The view is switched in the project header using <b>▦ / ☰ / ⊞</b>.</p>
            </section>

            <section className="info-page__section">
                <h2>{sections.hotkeys}</h2>
                <ul>
                    <li><kbd>Esc</kbd> — close modal</li>
                    <li><kbd>Enter</kbd> — save rename</li>
                </ul>
            </section>

            <section className="info-page__section">
                <h2>{sections.contact}</h2>
                <p>
                    For questions — write to <a href="mailto:support@taskboard.local">support@taskboard.local</a>
                </p>
            </section>

            <p className="info-page__back">
                <Link to="/boards">{sections.back}</Link>
            </p>
        </div>
    )
}