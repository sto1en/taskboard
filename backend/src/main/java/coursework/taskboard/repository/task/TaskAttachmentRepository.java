package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskAttachment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TaskAttachmentRepository
        extends JpaRepository<TaskAttachment, TaskAttachment.TaskAttachmentId> {

    List<TaskAttachment> findByTaskIdOrderByPositionAsc(Long taskId);

    /**
     * Вложения разом по списку задач, с mime-типом и метаданными файла.
     * Без графа каждый Attachment.mime и AttachmentMeta тянулись отдельно.
     */
    @EntityGraph(attributePaths = {"attachment", "attachment.mime", "attachment.meta"})
    List<TaskAttachment> findByTaskIdInOrderByPositionAsc(Collection<Long> taskIds);

    List<TaskAttachment> findByAttachmentId(Long attachmentId);

    long countByTaskId(Long taskId);
}