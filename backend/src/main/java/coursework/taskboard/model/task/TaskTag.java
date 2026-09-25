package coursework.taskboard.model.task;

import coursework.taskboard.model.tag.Tag;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "task_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(TaskTag.TaskTagId.class)
public class TaskTag {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id")
    private Tag tag;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskTagId implements Serializable {
        private Long task;
        private Long tag;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof TaskTagId that)) return false;
            return Objects.equals(task, that.task) && Objects.equals(tag, that.tag);
        }

        @Override
        public int hashCode() {
            return Objects.hash(task, tag);
        }
    }
}