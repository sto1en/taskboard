package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private String displayName;
    private String bio;
    private Long avatarAttachmentId;
    private String avatarUrl;
}