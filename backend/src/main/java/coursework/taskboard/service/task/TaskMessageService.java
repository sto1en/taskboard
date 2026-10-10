package coursework.taskboard.service.task;

import coursework.taskboard.dto.task.CreateTaskMessageRequest;
import coursework.taskboard.dto.task.TaskMessageDto;
import coursework.taskboard.model.attachment.AttachmentMeta;
import coursework.taskboard.model.task.Task;
import coursework.taskboard.model.task.TaskMessage;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.model.user.UserProfile;
import coursework.taskboard.repository.attachment.AttachmentMetaRepository;
import coursework.taskboard.repository.board.BoardMemberRepository;
import coursework.taskboard.repository.task.TaskMessageRepository;
import coursework.taskboard.repository.task.TaskRepository;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import coursework.taskboard.repository.user.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskMessageService {

    private final TaskMessageRepository taskMessageRepository;
    private final TaskRepository taskRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserAppearanceRepository userAppearanceRepository;
    private final AttachmentMetaRepository attachmentMetaRepository;

    @Value("${app.upload.base-url}")
    private String uploadBaseUrl;

    @Transactional(readOnly = true)
    public List<TaskMessageDto> list(Long taskId, User user) {
        Task task = getTaskWithAccess(taskId, user);
        List<TaskMessage> messages = taskMessageRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());

        List<TaskMessageDto> result = new ArrayList<>();
        for (TaskMessage m : messages) {
            result.add(toDto(m));
        }
        return result;
    }

    @Transactional
    public TaskMessageDto create(Long taskId, CreateTaskMessageRequest req, User user) {
        Task task = getTaskWithAccess(taskId, user);

        TaskMessage msg = TaskMessage.builder()
                .task(task)
                .user(user)
                .text(req.getText().trim())
                .build();
        taskMessageRepository.save(msg);

        return toDto(msg);
    }

    @Transactional
    public TaskMessageDto update(Long messageId, CreateTaskMessageRequest req, User user) {
        TaskMessage msg = taskMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!msg.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Можно редактировать только свои сообщения");
        }

        msg.setText(req.getText().trim());
        msg.setEditedAt(LocalDateTime.now());
        taskMessageRepository.save(msg);

        return toDto(msg);
    }

    @Transactional
    public void delete(Long messageId, User user) {
        TaskMessage msg = taskMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!msg.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Можно удалить только свои сообщения");
        }

        taskMessageRepository.delete(msg);
    }

    private Task getTaskWithAccess(Long taskId, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!boardMemberRepository.existsByBoardIdAndUserId(
                task.getProject().getBoard().getId(), user.getId())) {
            throw new IllegalArgumentException("No access to task");
        }
        return task;
    }

    private TaskMessageDto toDto(TaskMessage m) {
        User u = m.getUser();

        UserProfile profile = userProfileRepository.findById(u.getId()).orElse(null);
        String displayName = profile != null ? profile.getDisplayName() : u.getUsername();

        String avatarUrl = null;
        if (profile != null && profile.getAvatar() != null) {
            AttachmentMeta meta = attachmentMetaRepository
                    .findById(profile.getAvatar().getId()).orElse(null);
            if (meta != null) {
                avatarUrl = uploadBaseUrl + "/" + meta.getUrl();
            }
        }

        String avatarCode = null;
        String avatarEmoji = null;
        String avatarImageUrl = null;
        String frameCssClass = null;
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

        return TaskMessageDto.builder()
                .id(m.getId())
                .taskId(m.getTask().getId())
                .userId(u.getId())
                .username(u.getUsername())
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .avatarCode(avatarCode)
                .avatarEmoji(avatarEmoji)
                .avatarImageUrl(avatarImageUrl)
                .frameCssClass(frameCssClass)
                .text(m.getText())
                .createdAt(m.getCreatedAt())
                .editedAt(m.getEditedAt())
                .build();
    }

    private String normalizeImageUrl(String url) {
        if (url == null || url.isBlank()) return null;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
            return url;
        }
        return uploadBaseUrl + "/" + url;
    }
}