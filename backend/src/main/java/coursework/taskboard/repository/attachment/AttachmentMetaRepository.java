package coursework.taskboard.repository.attachment;

import coursework.taskboard.model.attachment.AttachmentMeta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentMetaRepository extends JpaRepository<AttachmentMeta, Long> {
}