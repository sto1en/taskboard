package coursework.taskboard.model.board;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_status_appearance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardStatusAppearance {

    @Id
    @Column(name = "status_id")
    private Long statusId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "status_id")
    private BoardStatus status;

    @Column(name = "accent_code", length = 30)
    private String accentCode;

    @Column(name = "is_bold", nullable = false)
    @Builder.Default
    private Boolean isBold = false;

    @Column(name = "is_italic", nullable = false)
    @Builder.Default
    private Boolean isItalic = false;

    @Column(length = 50)
    private String icon;

    @Column(name = "display_mode", nullable = false, length = 20)
    @Builder.Default
    private String displayMode = "default";
}