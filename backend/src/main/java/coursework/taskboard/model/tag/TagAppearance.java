package coursework.taskboard.model.tag;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tag_appearance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TagAppearance {

    @Id
    @Column(name = "tag_id")
    private Long tagId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "tag_id")
    private Tag tag;

    @Column(name = "accent_code", length = 30)
    private String accentCode;

    @Column(length = 50)
    private String icon;

    @Column(name = "is_bold", nullable = false)
    @Builder.Default
    private Boolean isBold = false;
}