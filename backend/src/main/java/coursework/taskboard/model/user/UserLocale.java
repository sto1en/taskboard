package coursework.taskboard.model.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_locale")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLocale {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserSettings settings;

    @Column(nullable = false, length = 5)
    @Builder.Default
    private String language = "ru";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String timezone = "Europe/Moscow";
}