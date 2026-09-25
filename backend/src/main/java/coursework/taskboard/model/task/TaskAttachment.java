package coursework.taskboard.model.task;

import coursework.taskboard.model.attachment.Attachment;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "task_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(TaskAttachment.TaskAttachmentId.class)
public class TaskAttachment {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    private Attachment attachment;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskAttachmentId implements Serializable {
        private Long task;
        private Long attachment;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof TaskAttachmentId that)) return false;
            return Objects.equals(task, that.task) && Objects.equals(attachment, that.attachment);
        }

        @Override
        public int hashCode() {
            return Objects.hash(task, attachment);
        }
    }
}