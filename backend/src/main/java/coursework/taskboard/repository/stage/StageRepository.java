package coursework.taskboard.repository.stage;

import coursework.taskboard.model.stage.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StageRepository extends JpaRepository<Stage, Long> {

    List<Stage> findByProjectIdOrderByPositionAsc(Long projectId);

    List<Stage> findByProjectIdAndStateOrderByPositionAsc(Long projectId, String state);

    long countByProjectId(Long projectId);
}