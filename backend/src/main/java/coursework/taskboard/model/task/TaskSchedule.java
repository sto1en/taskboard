package coursework.taskboard.model.task;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSchedule {

    @Id
    @Column(name = "task_id")
    private Long taskId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "task_id")
    private Task task;

    private LocalDate deadline;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}