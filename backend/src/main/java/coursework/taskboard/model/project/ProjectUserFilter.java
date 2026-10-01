package coursework.taskboard.model.project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "project_user_filters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ProjectUserFilter.ProjectUserFilterId.class)
public class ProjectUserFilter {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "status_ids", nullable = false, columnDefinition = "bigint[]")
    @Builder.Default
    private List<Long> statusIds = new ArrayList<>();

    @Column(name = "sort_mode", length = 32)
    private String sortMode;

    @Column(name = "sort_dir", length = 8)
    private String sortDir;

    @Column(name = "view_mode", length = 16)
    private String viewMode;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    @PrePersist
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectUserFilterId implements Serializable {
        private Long userId;
        private Long projectId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ProjectUserFilterId that)) return false;
            return Objects.equals(userId, that.userId)
                    && Objects.equals(projectId, that.projectId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, projectId);
        }
    }
}