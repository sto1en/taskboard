package coursework.taskboard.model.template;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

/** Гайд, который пользователь выставил в свою витрину на «стене». */
@Entity
@Table(name = "guide_showcase_entries",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_guide_showcase_user_guide",
                columnNames = {"user_id", "guide_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideShowcaseEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false)
    private Guide guide;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;
}
