package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskRecurrence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaskRecurrenceRepository extends JpaRepository<TaskRecurrence, Long> {

    Optional<TaskRecurrence> findByTaskId(Long taskId);

    boolean existsByTaskId(Long taskId);
}