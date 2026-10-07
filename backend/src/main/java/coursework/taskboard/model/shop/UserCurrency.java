package coursework.taskboard.model.shop;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_currency")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCurrency {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Integer leaves = 0;
}