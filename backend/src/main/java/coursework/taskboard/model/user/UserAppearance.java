package coursework.taskboard.model.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_appearance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAppearance {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserSettings settings;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String theme = "light";

    @Column(name = "accent_code", length = 30)
    private String accentCode;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String density = "cozy";

    @Column(name = "sidebar_collapsed", nullable = false)
    @Builder.Default
    private Boolean sidebarCollapsed = false;
}