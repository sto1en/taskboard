package coursework.taskboard.model.task;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "task_recurrences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRecurrence {

    @Id
    @Column(name = "task_id")
    private Long taskId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "task_id")
    private Task task;

    /** 'daily', 'weekly:1,3,5', 'monthly:15', 'yearly:04-15', 'hourly:1', 'every:2d', 'every:3w' */
    @Column(nullable = false, length = 120)
    private String rule;

    @Column(name = "time_of_day")
    private LocalTime timeOfDay;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    /** 'never' | 'until' | 'count' */
    @Column(name = "end_mode", nullable = false, length = 20)
    @Builder.Default
    private String endMode = "never";

    @Column(name = "end_until")
    private LocalDateTime endUntil;

    @Column(name = "end_count")
    private Integer endCount;

    /** До какого момента уже материализованы вхождения (эксклюзивно). */
    @Column(name = "generated_until")
    private LocalDateTime generatedUntil;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}