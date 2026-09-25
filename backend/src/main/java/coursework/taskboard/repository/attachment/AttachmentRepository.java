package coursework.taskboard.repository.attachment;

import coursework.taskboard.model.attachment.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    Optional<Attachment> findByOwnerIdAndHash(Long ownerId, String hash);

    boolean existsByOwnerIdAndHash(Long ownerId, String hash);
}