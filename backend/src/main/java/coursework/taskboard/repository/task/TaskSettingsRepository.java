package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskSettingsRepository extends JpaRepository<TaskSettings, Long> {

    List<TaskSettings> findByStatusId(Long statusId);

    long countByStatusId(Long statusId);
}