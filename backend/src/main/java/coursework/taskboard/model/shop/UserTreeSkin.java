package coursework.taskboard.model.shop;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_tree_skins",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "tree_skin_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTreeSkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tree_skin_id", nullable = false)
    private TreeSkin treeSkin;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt;

    @PrePersist
    protected void onCreate() {
        if (this.purchasedAt == null) {
            this.purchasedAt = LocalDateTime.now();
        }
    }
}