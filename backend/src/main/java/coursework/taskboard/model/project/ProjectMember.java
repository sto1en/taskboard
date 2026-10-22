package coursework.taskboard.model.project;

import coursework.taskboard.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Участник группового проекта.
 *
 * Это отдельный от board_members уровень доступа: человек работает с проектом,
 * но не видит доску-носитель, её остальные проекты, теги и настройки.
 * Роли:
 *   owner  — создатель: приглашает, удаляет участников, удаляет проект;
 *   editor — создаёт и меняет задачи;
 *   viewer — только чтение.
 */
@Entity
@Table(name = "project_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ProjectMember.ProjectMemberId.class)
public class ProjectMember {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "editor";

    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        this.addedAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectMemberId implements Serializable {

        private Long project;
        private Long user;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ProjectMemberId that)) return false;
            return Objects.equals(project, that.project) && Objects.equals(user, that.user);
        }

        @Override
        public int hashCode() {
            return Objects.hash(project, user);
        }
    }
}
