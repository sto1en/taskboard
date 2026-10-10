package coursework.taskboard.dto.task;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAuditLogDto {

    private Long id;
    private LocalDateTime createdAt;

    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String avatarCode;
    private String avatarEmoji;
    private String avatarImageUrl;
    private String frameCssClass;

    private String action;
    private String field;
    private String oldValue;
    private String newValue;
}