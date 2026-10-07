package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "avatars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Avatar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 32)
    private String emoji;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "css_class", length = 64)
    private String cssClass;

    @Column(nullable = false)
    @Builder.Default
    private Integer price = 0;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}