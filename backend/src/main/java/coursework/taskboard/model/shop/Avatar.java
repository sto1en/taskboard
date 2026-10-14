package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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
            name = "avatar_category_links",
            joinColumns = @JoinColumn(name = "avatar_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<AvatarCategory> categories = new HashSet<>();
}