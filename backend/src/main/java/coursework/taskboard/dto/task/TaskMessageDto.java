package coursework.taskboard.dto.task;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskMessageDto {

    private Long id;
    private Long taskId;

    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String avatarCode;
    private String avatarEmoji;
    private String avatarImageUrl;
    private String frameCssClass;

    private String text;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
}