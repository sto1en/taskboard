package coursework.taskboard.repository.template;

import coursework.taskboard.model.template.GuideTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuideTaskRepository extends JpaRepository<GuideTask, Long> {

    List<GuideTask> findByGuideIdOrderByPositionAsc(Long guideId);

    long countByGuideId(Long guideId);
}
