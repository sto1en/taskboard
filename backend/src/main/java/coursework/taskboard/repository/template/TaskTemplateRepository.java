package coursework.taskboard.repository.template;

import coursework.taskboard.model.template.TaskTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, Long> {

    List<TaskTemplate> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    Optional<TaskTemplate> findByIdAndOwnerId(Long id, Long ownerId);
}
