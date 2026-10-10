package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDto {

    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
}