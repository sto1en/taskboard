package coursework.taskboard.repository.task;

import coursework.taskboard.model.task.TaskAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskAuditLogRepository extends JpaRepository<TaskAuditLog, Long> {

    List<TaskAuditLog> findByTaskIdOrderByCreatedAtDesc(Long taskId);
}