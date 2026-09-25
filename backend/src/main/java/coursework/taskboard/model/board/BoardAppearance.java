package coursework.taskboard.model.board;

import coursework.taskboard.model.attachment.Attachment;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_appearance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardAppearance {

    @Id
    @Column(name = "board_id")
    private Long boardId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "board_id")
    private Board board;

    @Column(name = "accent_code", nullable = false, length = 30)
    @Builder.Default
    private String accentCode = "blue";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_attachment_id")
    private Attachment cover;
}