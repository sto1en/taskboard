export default function AvatarWithFrame({
                                            avatarUrl,
                                            displayName,
                                            username,
                                            frameCssClass,
                                            size = 36,
                                        }) {
    const initial = (displayName || username || 'U').charAt(0).toUpperCase()
    const style = { width: size, height: size }

    return (
        <div
            className={`avatar-frame ${frameCssClass || ''}`}
            style={style}
        >
            {avatarUrl
                ? <img src={avatarUrl} alt={displayName || username} />
                : <span className="avatar-frame__initial">{initial}</span>}
        </div>
    )
}