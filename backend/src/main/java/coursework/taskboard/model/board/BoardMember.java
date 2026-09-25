package coursework.taskboard.model.board;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "board_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(BoardMember.BoardMemberId.class)
public class BoardMember {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "member";

    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        this.addedAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoardMemberId implements Serializable {
        private Long board;
        private Long user;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof BoardMemberId that)) return false;
            return Objects.equals(board, that.board) && Objects.equals(user, that.user);
        }

        @Override
        public int hashCode() {
            return Objects.hash(board, user);
        }
    }
}