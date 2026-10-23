package coursework.taskboard.model.shop;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tree_skins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreeSkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    /**
     * В БД created_at NOT NULL DEFAULT now(), но Hibernate передаёт NULL
     * явно, и DEFAULT не срабатывает (DDL-auto=validate схему не меняет).
     * Поэтому дата выставляется здесь.
     */
    @jakarta.persistence.PrePersist
    void onPersist() {
        if (createdAt == null) {
            createdAt = java.time.LocalDateTime.now();
        }
    }

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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "tree_category_links",
            joinColumns = @JoinColumn(name = "tree_skin_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<TreeCategory> categories = new HashSet<>();
}
