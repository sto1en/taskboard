package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accent_skins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccentSkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer price = 0;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}