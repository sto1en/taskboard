package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskAttachmentRepository
        extends JpaRepository<TaskAttachment, TaskAttachment.TaskAttachmentId> {

    List<TaskAttachment> findByTaskIdOrderByPositionAsc(Long taskId);

    List<TaskAttachment> findByAttachmentId(Long attachmentId);

    long countByTaskId(Long taskId);
}