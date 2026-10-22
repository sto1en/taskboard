package coursework.taskboard.dto.group;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Ссылка-приглашение в групповой проект.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupInviteDto {

    private String token;

    /** Относительный путь фронтенда: /join/{token}. */
    private String path;

    private Long projectId;
    private String projectTitle;
    private LocalDateTime expiresAt;
}
