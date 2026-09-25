package coursework.taskboard.model.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_workspace")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWorkspace {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserSettings settings;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_board_id")
    private Board defaultBoard;

    @Column(name = "tasks_per_page", nullable = false)
    @Builder.Default
    private Short tasksPerPage = 10;

    @Column(name = "confirm_before_delete", nullable = false)
    @Builder.Default
    private Boolean confirmBeforeDelete = true;
}