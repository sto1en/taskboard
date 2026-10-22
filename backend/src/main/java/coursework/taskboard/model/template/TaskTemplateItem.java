package coursework.taskboard.model.template;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * Одна задача внутри шаблона.
 *
 * deadlineOffsetDays — через сколько дней от даты применения поставить дедлайн;
 * null означает «поле пустое, дедлайна нет».
 * subtasksText — подзадачи по одной на строку.
 */
@Entity
@Table(name = "task_template_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private TaskTemplate template;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    @Builder.Default
    private String description = "";

    @Column(nullable = false)
    @Builder.Default
    private Short priority = 0;

    @Column(name = "deadline_offset_days")
    private Integer deadlineOffsetDays;

    @Column(name = "status_category_code", nullable = false, length = 30)
    @Builder.Default
    private String statusCategoryCode = "ACTIVE";

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "subtasks_text", columnDefinition = "text")
    @Builder.Default
    private String subtasksText = "";
}
