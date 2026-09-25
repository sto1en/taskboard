package coursework.taskboard.model.task;

import coursework.taskboard.model.board.BoardStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "task_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSettings {

    @Id
    @Column(name = "task_id")
    private Long taskId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private BoardStatus status;

    @Column(nullable = false)
    @Builder.Default
    private Short priority = 0;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;
}