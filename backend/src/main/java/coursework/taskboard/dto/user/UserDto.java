package coursework.taskboard.dto.user;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String username;
    private String email;
    private LocalDateTime createdAt;

    private UserProfileDto profile;
    private UserAppearanceDto appearance;
    private UserLocaleDto locale;
    private UserWorkspaceDto workspace;
    private UserDisplayDto display;
    private UserNotificationDto notification;
}