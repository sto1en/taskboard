package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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

    @Column(name = "hex_color", length = 9)
    private String hexColor;

    @Column(name = "hex_color_secondary", length = 9)
    private String hexColorSecondary;

    @Column(name = "is_gradient", nullable = false)
    @Builder.Default
    private Boolean isGradient = false;

    /** Редкий акцент: собственный визуальный стиль (металл/контур), не заливка. */
    @Column(name = "is_rare", nullable = false)
    @Builder.Default
    private Boolean isRare = false;

    /** Третий стоп металлического/радужного редкого акцента. */
    @Column(name = "hex_color_tertiary", length = 9)
    private String hexColorTertiary;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "accent_category_links",
            joinColumns = @JoinColumn(name = "accent_skin_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<AccentCategory> categories = new HashSet<>();
}