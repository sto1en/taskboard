package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskMessageRepository extends JpaRepository<TaskMessage, Long> {

    List<TaskMessage> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    long countByTaskId(Long taskId);
}