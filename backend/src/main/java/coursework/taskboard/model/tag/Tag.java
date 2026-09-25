package coursework.taskboard.model.tag;

import coursework.taskboard.model.board.Board;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tags",
        uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false, length = 60)
    private String title;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @OneToOne(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    private TagAppearance appearance;
}