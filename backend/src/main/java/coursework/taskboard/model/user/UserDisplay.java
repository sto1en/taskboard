package coursework.taskboard.model.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_display")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDisplay {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserSettings settings;

    @Column(name = "task_sort_mode", nullable = false, length = 30)
    @Builder.Default
    private String taskSortMode = "manual";

    @Column(name = "task_sort_dir", nullable = false, length = 5)
    @Builder.Default
    private String taskSortDir = "asc";

    @Column(name = "project_view_mode", nullable = false, length = 20)
    @Builder.Default
    private String projectViewMode = "auto";
}