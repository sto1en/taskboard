package coursework.taskboard.model.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotification {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserSettings settings;

    @Column(name = "notify_email", nullable = false)
    @Builder.Default
    private Boolean notifyEmail = true;

    @Column(name = "notify_deadline", nullable = false)
    @Builder.Default
    private Boolean notifyDeadline = true;

    @Column(name = "notify_digest", nullable = false, length = 20)
    @Builder.Default
    private String notifyDigest = "daily";

    @Column(name = "remind_before_days", nullable = false)
    @Builder.Default
    private Short remindBeforeDays = 1;
}