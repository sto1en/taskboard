package coursework.taskboard.model.board;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_statuses",
        uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "scope", "code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 20)
    private String scope;

    @Column(name = "category_code", nullable = false, length = 30)
    private String categoryCode;

    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false, length = 60)
    private String title;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @OneToOne(mappedBy = "status", cascade = CascadeType.ALL, orphanRemoval = true)
    private BoardStatusAppearance appearance;

    @OneToOne(mappedBy = "status", cascade = CascadeType.ALL, orphanRemoval = true)
    private BoardStatusSettings settings;
}