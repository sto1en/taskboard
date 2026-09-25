package coursework.taskboard.model.board;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardSettings {

    @Id
    @Column(name = "board_id")
    private Long boardId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "board_id")
    private Board board;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;
}