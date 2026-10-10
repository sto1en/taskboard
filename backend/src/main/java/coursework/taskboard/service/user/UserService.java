package coursework.taskboard.service.user;

import coursework.taskboard.dto.user.*;
import coursework.taskboard.model.attachment.Attachment;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.user.*;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.attachment.AttachmentRepository;
import coursework.taskboard.repository.board.BoardMemberRepository;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.project.ProjectRepository;
import coursework.taskboard.repository.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserAppearanceRepository userAppearanceRepository;
    private final UserLocaleRepository userLocaleRepository;
    private final UserWorkspaceRepository userWorkspaceRepository;
    private final UserDisplayRepository userDisplayRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final AttachmentRepository attachmentRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;
    private final BoardRepository boardRepository;
    private final ProjectRepository projectRepository;
    private final BoardMemberRepository boardMemberRepository;

    private final UserMapper userMapper;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    // ============================================================
    // Получить полный профиль текущего пользователя
    // ============================================================
    @Transactional(readOnly = true)
    public UserDto getMe(User user) {
        Long userId = user.getId();

        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        UserAppearance appearance = userAppearanceRepository.findById(userId).orElse(null);
        UserLocale locale = userLocaleRepository.findById(userId).orElse(null);
        UserWorkspace workspace = userWorkspaceRepository.findById(userId).orElse(null);
        UserDisplay display = userDisplayRepository.findById(userId).orElse(null);
        UserNotification notification = userNotificationRepository.findById(userId).orElse(null);

        AttachmentMeta avatarMeta = null;
        if (profile != null && profile.getAvatar() != null) {
            avatarMeta = attachmentMetaRepository.findById(profile.getAvatar().getId()).orElse(null);
        }

        return userMapper.toUserDto(user, profile, appearance, locale,
                workspace, display, notification, avatarMeta);
    }

    // ============================================================
    // Поиск пользователей по displayName (для приглашения в доску)
    // ============================================================
    @Transactional(readOnly = true)
    public List<UserSearchDto> searchUsers(String query, User requester) {
        if (query == null || query.trim().length() < 1) {
            return List.of();
        }
        String q = query.trim();
        List<UserProfile> profiles = userProfileRepository.searchByDisplayName(q);

        List<UserSearchDto> result = new ArrayList<>();
        for (UserProfile p : profiles) {
            if (p.getUser() == null) continue;
            if (p.getUser().getId().equals(requester.getId())) continue;   // не показываем себя

            String avatarUrl = null;
            if (p.getAvatar() != null) {
                AttachmentMeta meta = attachmentMetaRepository
                        .findById(p.getAvatar().getId()).orElse(null);
                if (meta != null) {
                    avatarUrl = uploadBaseUrl + "/" + meta.getUrl();
                }
            }

            result.add(UserSearchDto.builder()
                    .userId(p.getUser().getId())
                    .username(p.getUser().getUsername())
                    .displayName(p.getDisplayName())
                    .avatarUrl(avatarUrl)
                    .build());

            if (result.size() >= 20) break;
        }
        return result;
    }

    // ============================================================
    // Обновить профиль
    // ============================================================
    @Transactional
    public UserProfileDto updateProfile(User user, UpdateProfileRequest request) {
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Profile not found"));

        if (request.getDisplayName() != null) {
            profile.setDisplayName(request.getDisplayName());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (Boolean.TRUE.equals(request.getClearAvatar())) {
            profile.setAvatar(null);
        } else if (request.getAvatarAttachmentId() != null) {
            Attachment avatar = attachmentRepository.findById(request.getAvatarAttachmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

            if (!avatar.getOwner().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Not your attachment");
            }
            if (!avatar.getMime().getCode().startsWith("image/")) {
                throw new IllegalArgumentException("Avatar must be an image");
            }
            profile.setAvatar(avatar);
        }

        userProfileRepository.save(profile);

        AttachmentMeta avatarMeta = profile.getAvatar() != null
                ? attachmentMetaRepository.findById(profile.getAvatar().getId()).orElse(null)
                : null;

        return userMapper.toProfileDto(profile, avatarMeta);
    }

    // ============================================================
    // Внешний вид
    // ============================================================
    @Transactional
    public UserAppearanceDto updateAppearance(User user, UpdateAppearanceRequest request) {
        UserAppearance appearance = userAppearanceRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserSettings settings = userSettingsRepository.findById(user.getId())
                            .orElseThrow(() -> new IllegalStateException("Settings not found"));
                    UserAppearance fresh = UserAppearance.builder()
                            .settings(settings)
                            .theme("light")
                            .accentCode("blue")
                            .density("cozy")
                            .sidebarCollapsed(false)
                            .treeEnabled(true)
                            .treeKind("sakura")
                            .build();
                    return userAppearanceRepository.save(fresh);
                });

        if (request.getTheme() != null) {
            if (!java.util.Set.of("light", "dark", "system").contains(request.getTheme())) {
                throw new IllegalArgumentException("Invalid theme");
            }
            appearance.setTheme(request.getTheme());
        }
        if (request.getAccentCode() != null) appearance.setAccentCode(request.getAccentCode());
        if (request.getDensity() != null) {
            if (!java.util.Set.of("compact", "cozy", "comfortable").contains(request.getDensity())) {
                throw new IllegalArgumentException("Invalid density");
            }
            appearance.setDensity(request.getDensity());
        }
        if (request.getSidebarCollapsed() != null) {
            appearance.setSidebarCollapsed(request.getSidebarCollapsed());
        }
        if (request.getTreeEnabled() != null) {
            appearance.setTreeEnabled(request.getTreeEnabled());
        }
        if (request.getTreeKind() != null) {
            if (!java.util.Set.of("sakura", "birch", "palm", "apple", "xmas").contains(request.getTreeKind())) {
                throw new IllegalArgumentException("Invalid treeKind");
            }
            appearance.setTreeKind(request.getTreeKind());
        }

        userAppearanceRepository.save(appearance);
        return userMapper.toAppearanceDto(appearance);
    }

    // ============================================================
    // Локаль
    // ============================================================
    @Transactional
    public UserLocaleDto updateLocale(User user, UpdateLocaleRequest request) {
        UserLocale locale = userLocaleRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Locale not found"));

        if (request.getLanguage() != null) {
            if (!java.util.Set.of("ru", "en").contains(request.getLanguage())) {
                throw new IllegalArgumentException("Invalid language");
            }
            locale.setLanguage(request.getLanguage());
        }
        if (request.getTimezone() != null) locale.setTimezone(request.getTimezone());

        userLocaleRepository.save(locale);
        return userMapper.toLocaleDto(locale);
    }

    // ============================================================
    // Рабочее поведение
    // ============================================================
    @Transactional
    public UserWorkspaceDto updateWorkspace(User user, UpdateWorkspaceRequest request) {
        UserWorkspace workspace = userWorkspaceRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Workspace not found"));

        if (Boolean.TRUE.equals(request.getClearDefaultBoard())) {
            workspace.setDefaultBoard(null);
            workspace.setLaunchProject(null);
        } else if (request.getDefaultBoardId() != null) {
            Board board = boardRepository.findById(request.getDefaultBoardId())
                    .orElseThrow(() -> new IllegalArgumentException("Board not found"));

            if (!board.getOwner().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Not your board");
            }
            workspace.setDefaultBoard(board);
            if (workspace.getLaunchProject() != null
                    && !workspace.getLaunchProject().getBoard().getId().equals(board.getId())) {
                workspace.setLaunchProject(null);
            }
        }

        if (Boolean.TRUE.equals(request.getClearLaunchProject())) {
            workspace.setLaunchProject(null);
        } else if (request.getLaunchProjectId() != null) {
            Project p = projectRepository.findById(request.getLaunchProjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
            if (!boardMemberRepository.existsByBoardIdAndUserId(
                    p.getBoard().getId(), user.getId())) {
                throw new IllegalArgumentException("No access to project");
            }
            workspace.setLaunchProject(p);
            if (workspace.getDefaultBoard() == null) {
                workspace.setDefaultBoard(p.getBoard());
            }
        }

        if (Boolean.TRUE.equals(request.getClearDefaultProject())) {
            workspace.setDefaultProject(null);
        } else if (request.getDefaultProjectId() != null) {
            Project p = projectRepository.findById(request.getDefaultProjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));
            if (!boardMemberRepository.existsByBoardIdAndUserId(
                    p.getBoard().getId(), user.getId())) {
                throw new IllegalArgumentException("No access to project");
            }
            workspace.setDefaultProject(p);
        }

        if (request.getTasksPerPage() != null) {
            short value = request.getTasksPerPage();
            if (value < 10 || value > 200) {
                throw new IllegalArgumentException("tasksPerPage must be 10-200");
            }
            workspace.setTasksPerPage(value);
        }

        if (request.getConfirmBeforeDelete() != null) {
            workspace.setConfirmBeforeDelete(request.getConfirmBeforeDelete());
        }

        userWorkspaceRepository.save(workspace);
        return userMapper.toWorkspaceDto(workspace);
    }

    // ============================================================
    // Сортировки и виды
    // ============================================================
    @Transactional
    public UserDisplayDto updateDisplay(User user, UpdateDisplayRequest request) {
        UserDisplay display = userDisplayRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Display not found"));

        if (request.getTaskSortMode() != null) {
            if (!java.util.Set.of("manual", "by_status", "by_deadline",
                            "by_priority", "by_project", "by_created")
                    .contains(request.getTaskSortMode())) {
                throw new IllegalArgumentException("Invalid taskSortMode");
            }
            display.setTaskSortMode(request.getTaskSortMode());
        }

        if (request.getTaskSortDir() != null) {
            if (!java.util.Set.of("asc", "desc").contains(request.getTaskSortDir())) {
                throw new IllegalArgumentException("Invalid taskSortDir");
            }
            display.setTaskSortDir(request.getTaskSortDir());
        }

        if (request.getProjectViewMode() != null) {
            if (!java.util.Set.of("auto", "kanban", "list", "compact")
                    .contains(request.getProjectViewMode())) {
                throw new IllegalArgumentException("Invalid projectViewMode");
            }
            display.setProjectViewMode(request.getProjectViewMode());
        }

        userDisplayRepository.save(display);
        return userMapper.toDisplayDto(display);
    }

    // ============================================================
    // Уведомления
    // ============================================================
    @Transactional
    public UserNotificationDto updateNotification(User user, UpdateNotificationRequest request) {
        UserNotification notification = userNotificationRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("Notification not found"));

        if (request.getNotifyEmail() != null) notification.setNotifyEmail(request.getNotifyEmail());
        if (request.getNotifyDeadline() != null) notification.setNotifyDeadline(request.getNotifyDeadline());

        if (request.getNotifyDigest() != null) {
            if (!java.util.Set.of("off", "daily", "weekly").contains(request.getNotifyDigest())) {
                throw new IllegalArgumentException("Invalid notifyDigest");
            }
            notification.setNotifyDigest(request.getNotifyDigest());
        }

        if (request.getRemindBeforeDays() != null) {
            short value = request.getRemindBeforeDays();
            if (value < 0 || value > 30) {
                throw new IllegalArgumentException("remindBeforeDays must be 0-30");
            }
            notification.setRemindBeforeDays(value);
        }

        userNotificationRepository.save(notification);
        return userMapper.toNotificationDto(notification);
    }
}