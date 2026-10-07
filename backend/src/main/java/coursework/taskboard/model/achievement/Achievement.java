package coursework.taskboard.model.achievement;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 32)
    private String icon;

    @Column(name = "accent_code", nullable = false, length = 30)
    @Builder.Default
    private String accentCode = "blue";

    @Column(name = "condition_type", nullable = false, length = 60)
    private String conditionType;

    @Column(nullable = false)
    @Builder.Default
    private Integer threshold = 1;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer reward = 0;
}