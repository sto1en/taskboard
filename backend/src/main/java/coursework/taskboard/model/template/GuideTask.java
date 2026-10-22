package coursework.taskboard.model.template;

import jakarta.persistence.*;
import lombok.*;

/**
 * Задача внутри гайда. dayOffset — день от старта гайда (0 = день старта).
 */
@Entity
@Table(name = "guide_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false)
    private Guide guide;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(name = "day_offset", nullable = false)
    @Builder.Default
    private Integer dayOffset = 0;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    @Builder.Default
    private String description = "";

    @Column(nullable = false)
    @Builder.Default
    private Short priority = 0;

    @Column(name = "status_category_code", nullable = false, length = 30)
    @Builder.Default
    private String statusCategoryCode = "ACTIVE";

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "subtasks_text", columnDefinition = "text")
    @Builder.Default
    private String subtasksText = "";
}
