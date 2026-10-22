package coursework.taskboard.repository.template;

import coursework.taskboard.model.template.Guide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuideRepository extends JpaRepository<Guide, Long> {

    List<Guide> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Guide> findByIsSystemTrueOrderByCreatedAtAsc();

    List<Guide> findByIsSystemTrueOrOwnerIdOrderByCreatedAtDesc(Long ownerId);

    long countByIsSystemTrue();
}
