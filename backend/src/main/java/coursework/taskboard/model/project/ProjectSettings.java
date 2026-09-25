/**
*
*/
package coursework.taskboard.model.project;

import coursework.taskboard.model.board.BoardStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSettings {

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private BoardStatus status;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "is_template", nullable = false)
    @Builder.Default
    private Boolean isTemplate = false;

    @Column(name = "accent_code", length = 30)
    private String accentCode;
}