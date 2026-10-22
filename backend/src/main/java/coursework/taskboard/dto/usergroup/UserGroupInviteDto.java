package coursework.taskboard.dto.usergroup;

import lombok.*;

import java.time.LocalDateTime;

/** Приглашение в группу, которое видит приглашённый. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGroupInviteDto {

    private Long groupId;
    private String groupName;
    private Long ownerId;
    private String ownerUsername;
    private String ownerDisplayName;
    private LocalDateTime createdAt;
    private int acceptedCount;
}
