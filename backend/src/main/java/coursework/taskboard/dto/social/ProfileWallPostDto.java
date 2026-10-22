package coursework.taskboard.dto.social;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileWallPostDto {
    private Long id;
    private String body;
    private LocalDateTime createdAt;
    private SocialUserDto author;
    private Boolean canDelete;
}
