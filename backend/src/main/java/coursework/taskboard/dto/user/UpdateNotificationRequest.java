package coursework.taskboard.dto.user;

import lombok.Data;

@Data
public class UpdateNotificationRequest {

    private Boolean notifyEmail;
    private Boolean notifyDeadline;
    private String notifyDigest;
    private Short remindBeforeDays;
}