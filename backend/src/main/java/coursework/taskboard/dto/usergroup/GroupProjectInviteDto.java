package coursework.taskboard.dto.usergroup;

import lombok.*;

import java.time.LocalDateTime;

/** Персональное приглашение в кооперативный проект. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupProjectInviteDto {

    private String token;
    private Long projectId;
    private String projectTitle;
    private Long fromUserId;
    private String fromUsername;
    private String fromDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
