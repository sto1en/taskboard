export default function TopBar() {
    return (
        <header className="topbar">
            <input
                className="topbar__search"
                placeholder="Search for boards, cards, projects, teams"
            />
            <div className="topbar__spacer" />
            <div className="topbar__avatar">A</div>
        </header>
    )
}