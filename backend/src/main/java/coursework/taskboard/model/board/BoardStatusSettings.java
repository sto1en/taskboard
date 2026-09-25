package coursework.taskboard.model.board;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_status_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardStatusSettings {

    @Id
    @Column(name = "status_id")
    private Long statusId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "status_id")
    private BoardStatus status;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "is_hidden", nullable = false)
    @Builder.Default
    private Boolean isHidden = false;

    @Column(name = "allow_drag_in", nullable = false)
    @Builder.Default
    private Boolean allowDragIn = true;

    @Column(name = "auto_transition_days")
    private Integer autoTransitionDays;
}