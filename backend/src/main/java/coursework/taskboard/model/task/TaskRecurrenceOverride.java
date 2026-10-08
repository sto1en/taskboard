package coursework.taskboard.model.task;

import coursework.taskboard.model.board.BoardStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_recurrence_overrides",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"task_id", "occurrence_date"},
                name = "uq_task_rec_overrides_task_date"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRecurrenceOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "occurrence_date", nullable = false)
    private LocalDate occurrenceDate;

    /** 'skip' | 'complete' | 'override' */
    @Column(nullable = false, length = 20)
    private String mode;

    @Column(name = "override_title", length = 255)
    private String overrideTitle;

    @Column(name = "override_deadline")
    private LocalDateTime overrideDeadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "override_status_id")
    private BoardStatus overrideStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}