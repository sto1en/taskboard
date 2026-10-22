package coursework.taskboard.model.shop;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_backgrounds",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "background_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBackground {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "background_id", nullable = false)
    private ProfileBackground background;

    /** Сколько листьев реально ушло на покупку. null — фон бесплатный/подарен. */
    @Column(name = "price_paid")
    private Integer pricePaid;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt;

    @PrePersist
    protected void onCreate() {
        if (this.purchasedAt == null) this.purchasedAt = LocalDateTime.now();
    }
}
