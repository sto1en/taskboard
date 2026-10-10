package coursework.taskboard.service.task;

import coursework.taskboard.dto.task.TaskAuditLogDto;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.task.Task;
import coursework.taskboard.model.task.TaskAuditLog;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.task.TaskAuditLogRepository;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskAuditService {

    private final TaskAuditLogRepository taskAuditLogRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserAppearanceRepository userAppearanceRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    @Transactional
    public void log(Task task, User user, String action, String field, String oldValue, String newValue) {
        if (oldValue != null && oldValue.equals(newValue)) return;

        TaskAuditLog entry = TaskAuditLog.builder()
                .task(task)
                .user(user)
                .action(action)
                .field(field)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        taskAuditLogRepository.save(entry);
    }

    @Transactional
    public void log(Task task, User user, String action, String field) {
        log(task, user, action, field, null, null);
    }

    @Transactional(readOnly = true)
    public List<TaskAuditLogDto> list(Long taskId) {
        List<TaskAuditLog> logs = taskAuditLogRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
        List<TaskAuditLogDto> result = new ArrayList<>();

        for (TaskAuditLog l : logs) {
            User u = l.getUser();

            String username = null;
            String displayName = null;
            String avatarUrl = null;
            String avatarCode = null;
            String avatarEmoji = null;
            String avatarImageUrl = null;
            String frameCssClass = null;

            if (u != null) {
                username = u.getUsername();

                UserProfile profile = userProfileRepository.findById(u.getId()).orElse(null);
                displayName = profile != null ? profile.getDisplayName() : u.getUsername();

                if (profile != null && profile.getAvatar() != null) {
                    AttachmentMeta meta = attachmentMetaRepository
                            .findById(profile.getAvatar().getId()).orElse(null);
                    if (meta != null) {
                        avatarUrl = uploadBaseUrl + "/" + meta.getUrl();
                    }
                }

                UserAppearance appearance = userAppearanceRepository.findById(u.getId()).orElse(null);
                if (appearance != null) {
                    if (appearance.getActiveAvatar() != null) {
                        avatarCode = appearance.getActiveAvatar().getCode();
                        avatarEmoji = appearance.getActiveAvatar().getEmoji();
                        avatarImageUrl = normalizeImageUrl(appearance.getActiveAvatar().getImageUrl());
                    }
                    if (appearance.getActiveFrame() != null) {
                        frameCssClass = appearance.getActiveFrame().getCssClass();
                    }
                }
            }

            result.add(TaskAuditLogDto.builder()
                    .id(l.getId())
                    .createdAt(l.getCreatedAt())
                    .userId(u != null ? u.getId() : null)
                    .username(username)
                    .displayName(displayName)
                    .avatarUrl(avatarUrl)
                    .avatarCode(avatarCode)
                    .avatarEmoji(avatarEmoji)
                    .avatarImageUrl(avatarImageUrl)
                    .frameCssClass(frameCssClass)
                    .action(l.getAction())
                    .field(l.getField())
                    .oldValue(l.getOldValue())
                    .newValue(l.getNewValue())
                    .build());
        }

        return result;
    }

    /**
     * Если в avatars.image_url хранится относительный путь (например, "anime-1.png"),
     * префиксим его upload-base-url. Если уже полный URL — возвращаем как есть.
     */
    private String normalizeImageUrl(String url) {
        if (url == null || url.isBlank()) return null;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
            return url;
        }
        return uploadBaseUrl + "/" + url;
    }
}