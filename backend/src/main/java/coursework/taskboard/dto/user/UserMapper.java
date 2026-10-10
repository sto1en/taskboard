package coursework.taskboard.dto.user;

import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.user.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    // ============================================================
    // Entity → DTO
    // ============================================================
    public UserDto toUserDto(User user,
                             UserProfile profile,
                             UserAppearance appearance,
                             UserLocale locale,
                             UserWorkspace workspace,
                             UserDisplay display,
                             UserNotification notification,
                             AttachmentMeta avatarMeta) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .profile(toProfileDto(profile, avatarMeta))
                .appearance(toAppearanceDto(appearance))
                .locale(toLocaleDto(locale))
                .workspace(toWorkspaceDto(workspace))
                .display(toDisplayDto(display))
                .notification(toNotificationDto(notification))
                .build();
    }

    public UserProfileDto toProfileDto(UserProfile profile, AttachmentMeta avatarMeta) {
        if (profile == null) return null;
        return UserProfileDto.builder()
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarAttachmentId(profile.getAvatar() != null ? profile.getAvatar().getId() : null)
                .avatarUrl(avatarMeta != null ? uploadBaseUrl + "/" + avatarMeta.getUrl() : null)
                .build();
    }

    public UserAppearanceDto toAppearanceDto(UserAppearance appearance) {
        if (appearance == null) return null;
        return UserAppearanceDto.builder()
                .theme(appearance.getTheme())
                .accentCode(appearance.getAccentCode())
                .density(appearance.getDensity())
                .sidebarCollapsed(appearance.getSidebarCollapsed())
                .treeEnabled(appearance.getTreeEnabled())
                .treeKind(appearance.getTreeKind())
                .activeFrameId(appearance.getActiveFrame() != null ? appearance.getActiveFrame().getId() : null)
                .activeFrameCode(appearance.getActiveFrame() != null ? appearance.getActiveFrame().getCode() : null)
                .activeFrameCssClass(appearance.getActiveFrame() != null ? appearance.getActiveFrame().getCssClass() : null)
                .activeTreeSkinId(appearance.getActiveTreeSkin() != null ? appearance.getActiveTreeSkin().getId() : null)
                .activeTreeSkinCode(appearance.getActiveTreeSkin() != null ? appearance.getActiveTreeSkin().getCode() : null)
                .build();
    }

    public UserLocaleDto toLocaleDto(UserLocale locale) {
        if (locale == null) return null;
        return UserLocaleDto.builder()
                .language(locale.getLanguage())
                .timezone(locale.getTimezone())
                .build();
    }

    public UserWorkspaceDto toWorkspaceDto(UserWorkspace workspace) {
        if (workspace == null) return null;
        return UserWorkspaceDto.builder()
                .defaultBoardId(workspace.getDefaultBoard() != null
                        ? workspace.getDefaultBoard().getId() : null)
                .launchProjectId(workspace.getLaunchProject() != null
                        ? workspace.getLaunchProject().getId() : null)
                .defaultProjectId(workspace.getDefaultProject() != null
                        ? workspace.getDefaultProject().getId() : null)
                .tasksPerPage(workspace.getTasksPerPage())
                .confirmBeforeDelete(workspace.getConfirmBeforeDelete())
                .build();
    }

    public UserDisplayDto toDisplayDto(UserDisplay display) {
        if (display == null) return null;
        return UserDisplayDto.builder()
                .taskSortMode(display.getTaskSortMode())
                .taskSortDir(display.getTaskSortDir())
                .projectViewMode(display.getProjectViewMode())
                .build();
    }

    public UserNotificationDto toNotificationDto(UserNotification notification) {
        if (notification == null) return null;
        return UserNotificationDto.builder()
                .notifyEmail(notification.getNotifyEmail())
                .notifyDeadline(notification.getNotifyDeadline())
                .notifyDigest(notification.getNotifyDigest())
                .remindBeforeDays(notification.getRemindBeforeDays())
                .build();
    }

    // ============================================================
    // Дефолты для регистрации
    // ============================================================
    public UserProfile toUserProfile(User user, String displayName) {
        return UserProfile.builder()
                .user(user)
                .displayName(displayName)
                .build();
    }

    public UserAppearance toDefaultAppearance(UserSettings settings) {
        return UserAppearance.builder()
                .settings(settings)
                .theme("light")
                .accentCode("blue")
                .density("cozy")
                .sidebarCollapsed(false)
                .build();
    }

    public UserLocale toDefaultLocale(UserSettings settings) {
        return UserLocale.builder()
                .settings(settings)
                .language("ru")
                .timezone("Europe/Moscow")
                .build();
    }

    public UserWorkspace toDefaultWorkspace(UserSettings settings) {
        return UserWorkspace.builder()
                .settings(settings)
                .tasksPerPage((short) 50)
                .confirmBeforeDelete(true)
                .build();
    }

    public UserDisplay toDefaultDisplay(UserSettings settings) {
        return UserDisplay.builder()
                .settings(settings)
                .taskSortMode("manual")
                .taskSortDir("asc")
                .projectViewMode("auto")
                .build();
    }

    public UserNotification toDefaultNotification(UserSettings settings) {
        return UserNotification.builder()
                .settings(settings)
                .notifyEmail(true)
                .notifyDeadline(true)
                .notifyDigest("daily")
                .remindBeforeDays((short) 1)
                .build();
    }
}