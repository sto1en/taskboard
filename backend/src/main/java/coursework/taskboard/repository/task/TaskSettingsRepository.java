package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskSettings;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface TaskSettingsRepository extends JpaRepository<TaskSettings, Long> {

    List<TaskSettings> findByStatusId(Long statusId);

    /**
     * Настройки разом по списку задач. {@code status} и {@code status.appearance}
     * подтягиваются графом, иначе для каждого DTO статус и его оформление
     * грузились отдельными запросами (N+1 в лентах задач и канбане).
     */
    @EntityGraph(attributePaths = {"status", "status.appearance"})
    List<TaskSettings> findByTaskIdIn(Collection<Long> taskIds);

    long countByStatusId(Long statusId);
}