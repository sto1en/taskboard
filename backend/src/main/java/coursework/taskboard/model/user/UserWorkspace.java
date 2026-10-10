package coursework.taskboard.model.user;

import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.project.Project;
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

    /** Стартовая доска (тумблер «Доска по умолчанию»). null = выключено. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_board_id")
    private Board defaultBoard;

    /** Стартовый проект (внутри defaultBoard). Может быть null — тогда открываем саму доску. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "launch_project_id")
    private Project launchProject;

    /** Проект для новых задач, создаваемых из календаря. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_project_id")
    private Project defaultProject;

    @Column(name = "tasks_per_page", nullable = false)
    @Builder.Default
    private Short tasksPerPage = 50;

    @Column(name = "confirm_before_delete", nullable = false)
    @Builder.Default
    private Boolean confirmBeforeDelete = true;
}