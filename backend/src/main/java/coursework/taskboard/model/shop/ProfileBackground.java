package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Фон профиля — предмет магазина.
 *
 * cssClass задаёт готовый градиент из profile.css (базовые фоны),
 * imageUrl — загруженную админом картинку. Если заданы оба, картинка
 * рисуется поверх градиента.
 */
@Entity
@Table(name = "profile_backgrounds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileBackground {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "css_class", length = 64)
    private String cssClass;

    @Column(nullable = false)
    @Builder.Default
    private Integer price = 0;

    @Column(name = "old_price")
    private Integer oldPrice;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}
