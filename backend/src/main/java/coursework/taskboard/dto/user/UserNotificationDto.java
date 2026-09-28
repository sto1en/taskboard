package coursework.taskboard.dto.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationDto {

    private Boolean notifyEmail;
    private Boolean notifyDeadline;
    private String notifyDigest;
    private Short remindBeforeDays;
}