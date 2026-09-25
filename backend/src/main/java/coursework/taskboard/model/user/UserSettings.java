package coursework.taskboard.model.user;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "default_landing_page", nullable = false, length = 20)
    @Builder.Default
    private String defaultLandingPage = "boards";

    @OneToOne(mappedBy = "settings", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserAppearance appearance;

    @OneToOne(mappedBy = "settings", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserLocale locale;

    @OneToOne(mappedBy = "settings", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserWorkspace workspace;

    @OneToOne(mappedBy = "settings", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserDisplay display;

    @OneToOne(mappedBy = "settings", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserNotification notification;
}